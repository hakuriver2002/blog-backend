const AppError = require('../../domain/errors/AppError');

class CommentService {
    constructor(commentRepository, articleRepository) {
        this.commentRepo = commentRepository;
        this.articleRepo = articleRepository;
    }

    async getComments(articleId, { page, limit }, user) {
        const article = await this.articleRepo.findById(articleId);
        if (!article) throw new AppError('Bài viết không tồn tại', 404);

        const isAdmin = user?.role === 'admin' || user?.role === 'editor';
        return await this.commentRepo.findByArticle(articleId, {
            page: +page, limit: +limit, isAdmin
        });
    }

    async createComment({ articleId, userId, content, parentId }) {
        if (!content || content.trim().length === 0) {
            throw new AppError('Nội dung bình luận không được để trống', 400);
        }
        if (content.trim().length > 1000) {
            throw new AppError('Bình luận không được vượt quá 1000 ký tự', 400);
        }

        const article = await this.articleRepo.findById(articleId);
        if (!article) throw new AppError('Bài viết không tồn tại', 404);
        if (article.status !== 'published') {
            throw new AppError('Không thể bình luận bài viết này', 400);
        }

        if (parentId) {
            const parent = await this.commentRepo.findById(parentId);
            if (!parent) throw new AppError('Bình luận gốc không tồn tại', 404);
            if (parent.articleId !== articleId) {
                throw new AppError('Bình luận không thuộc bài viết này', 400);
            }
            if (parent.parentId) {
                throw new AppError('Chỉ hỗ trợ reply 1 cấp', 400);
            }
        }

        return await this.commentRepo.create({
            articleId,
            userId,
            content: content.trim(),
            parentId,
        });
    }

    async hideComment(id, adminId, reason) {
        const comment = await this.commentRepo.findById(id);
        if (!comment) throw new AppError('Bình luận không tồn tại', 404);
        if (comment.status === 'deleted') {
            throw new AppError('Bình luận đã bị xóa', 400);
        }

        return await this.commentRepo.hide(id, adminId, reason);
    }

    async showComment(id) {
        const comment = await this.commentRepo.findById(id);
        if (!comment) throw new AppError('Bình luận không tồn tại', 404);
        if (comment.status !== 'hidden') {
            throw new AppError('Bình luận không ở trạng thái bị ẩn', 400);
        }

        return await this.commentRepo.show(id);
    }

    async deleteComment(id, userId, userRole) {
        const comment = await this.commentRepo.findById(id);
        if (!comment) throw new AppError('Bình luận không tồn tại', 404);
        if (comment.status === 'deleted') {
            throw new AppError('Bình luận đã bị xóa', 400);
        }

        const isOwner = comment.userId === userId;
        const isAdmin = userRole === 'admin' || userRole === 'editor';

        if (!isOwner && !isAdmin) {
            throw new AppError('Không có quyền xóa bình luận này', 403);
        }

        return await this.commentRepo.delete(id);
    }
}

module.exports = CommentService;