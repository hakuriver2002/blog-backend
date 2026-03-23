const AppError = require('../../domain/errors/AppError');
const NotificationRepository = require('../../repositories/postgres/NotificationRepository');
const NotificationService = require('../NotificationService');

const notifService = new NotificationService(new NotificationRepository());

class CommentService {
    constructor(commentRepository, articleRepository) {
        this.commentRepo = commentRepository;
        this.articleRepo = articleRepository;
    }

    async getComments(articleId, { page, limit }, user) {
        const article = await this.articleRepo.findById(articleId);
        if (!article) throw new AppError('Bài viết không tồn tại', 404);

        const isAdmin = user?.role === 'admin' || user?.role === 'editor';
        return this.commentRepo.findByArticleWithCount(articleId, {
            limit: +limit || 20,
            offset: ((+page || 1) - 1) * (+limit || 20),
        });
    }

    async createComment({ articleId, userId, content, parentId, userName }) {
        if (!content?.trim()) throw new AppError('Nội dung bình luận không được để trống', 400);
        if (content.trim().length > 1000) throw new AppError('Bình luận không vượt quá 1000 ký tự', 400);

        const article = await this.articleRepo.findById(articleId);
        if (!article) throw new AppError('Bài viết không tồn tại', 404);
        if (article.status !== 'published') throw new AppError('Không thể bình luận bài viết này', 400);

        let commentOwnerId = null;

        if (parentId) {
            const parent = await this.commentRepo.findById(parentId);
            if (!parent) throw new AppError('Bình luận gốc không tồn tại', 404);
            if (parent.articleId !== articleId) throw new AppError('Bình luận không thuộc bài viết này', 400);
            if (parent.parentId) throw new AppError('Chỉ hỗ trợ reply 1 cấp', 400);
            commentOwnerId = parent.userId;
        }

        const comment = await this.commentRepo.create({
            articleId, userId, content: content.trim(), parentId: parentId || null,
        });

        if (parentId && commentOwnerId) {
            notifService.onCommentReplied({
                articleId,
                commentId: parentId,
                commentOwnerId,
                replierId: userId,
                replierName: userName,
            }).catch(() => { });
        } else {
            notifService.onArticleCommented({
                articleId,
                articleTitle: article.title,
                authorId: article.authorId,
                commenterId: userId,
                commenterName: userName,
            }).catch(() => { });
        }

        return comment;
    }

    async hideComment(id, hiddenById, reason) {
        const comment = await this.commentRepo.findById(id);
        if (!comment) throw new AppError('Bình luận không tồn tại', 404);
        if (comment.status === 'deleted') throw new AppError('Bình luận đã bị xóa', 400);
        return this.commentRepo.hide(id, { hiddenById, hiddenReason: reason });
    }

    async showComment(id) {
        const comment = await this.commentRepo.findById(id);
        if (!comment) throw new AppError('Bình luận không tồn tại', 404);
        if (comment.status !== 'hidden') throw new AppError('Bình luận không ở trạng thái bị ẩn', 400);
        return this.commentRepo.show(id);
    }

    async deleteComment(id, userId, userRole) {
        const comment = await this.commentRepo.findById(id);
        if (!comment) throw new AppError('Bình luận không tồn tại', 404);
        if (comment.status === 'deleted') throw new AppError('Bình luận đã bị xóa', 400);

        const isOwner = comment.userId === userId;
        const isAdmin = ['admin', 'editor'].includes(userRole);
        if (!isOwner && !isAdmin) throw new AppError('Không có quyền xóa bình luận này', 403);

        return this.commentRepo.delete(id);
    }
}

module.exports = CommentService;