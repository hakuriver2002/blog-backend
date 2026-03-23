const AppError = require('../../domain/errors/AppError');
const NotificationRepository = require('../../repositories/postgres/NotificationRepository');
const NotificationService = require('../NotificationService');

const notifService = new NotificationService(new NotificationRepository());

class ReviewService {
    constructor(articleRepository, reviewRepository) {
        this.articleRepo = articleRepository;
        this.reviewRepo = reviewRepository;
    }

    async submitArticle(articleId, userId) {
        const article = await this.articleRepo.findById(articleId);
        if (!article) throw new AppError('Bài viết không tồn tại', 404);
        if (article.authorId !== userId) throw new AppError('Không có quyền thực hiện', 403);
        if (!['draft', 'rejected'].includes(article.status)) {
            throw new AppError(`Không thể submit bài đang ở trạng thái "${article.status}"`, 400);
        }

        const updated = await this.articleRepo.update(articleId, { status: 'pending' });
        await this.reviewRepo.createLog({ articleId, reviewerId: userId, action: 'submitted', note: null });

        return updated;
    }

    async approveArticle(articleId, reviewerId, note) {
        const article = await this.articleRepo.findById(articleId);
        if (!article) throw new AppError('Bài viết không tồn tại', 404);
        if (article.status !== 'pending') throw new AppError('Bài viết không ở trạng thái chờ duyệt', 400);

        const updated = await this.articleRepo.update(articleId, {
            status: 'published', publishedAt: new Date(),
        });
        await this.reviewRepo.createLog({ articleId, reviewerId, action: 'approved', note: note || null });

        notifService.onArticleApproved({
            articleId,
            articleTitle: article.title,
            authorId: article.authorId,
            reviewerId,
        }).catch(() => { });

        return updated;
    }

    async rejectArticle(articleId, reviewerId, note) {
        if (!note?.trim()) throw new AppError('Vui lòng cung cấp lý do từ chối', 400);

        const article = await this.articleRepo.findById(articleId);
        if (!article) throw new AppError('Bài viết không tồn tại', 404);
        if (article.status !== 'pending') throw new AppError('Bài viết không ở trạng thái chờ duyệt', 400);

        const updated = await this.articleRepo.update(articleId, { status: 'rejected' });
        await this.reviewRepo.createLog({ articleId, reviewerId, action: 'rejected', note: note.trim() });

        notifService.onArticleRejected({
            articleId,
            articleTitle: article.title,
            authorId: article.authorId,
            reviewerId,
            note: note.trim(),
        }).catch(() => { });

        return updated;
    }

    async getPendingArticles({ page, limit }) {
        return this.articleRepo.findPending({ limit: +limit, offset: ((+page || 1) - 1) * +limit });
    }

    async getReviewHistory(articleId) {
        const article = await this.articleRepo.findById(articleId);
        if (!article) throw new AppError('Bài viết không tồn tại', 404);
        return this.reviewRepo.findByArticle(articleId);
    }
}

module.exports = ReviewService;