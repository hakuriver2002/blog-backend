const AppError = require('../../domain/errors/AppError');

class LikeBookmarkService {
    constructor(likeBookmarkRepository, articleRepository) {
        this.repo = likeBookmarkRepository;
        this.articleRepo = articleRepository;
    }

    // ── Toggle Like ───────────────────────────────────────────────
    async toggleLike(articleId, userId) {
        // Bài phải tồn tại và đã published
        const article = await this.articleRepo.findById(articleId);
        if (!article) throw new AppError('Bài viết không tồn tại', 404);
        if (article.status !== 'published') {
            throw new AppError('Không thể like bài viết này', 400);
        }

        const existing = await this.repo.findLike(articleId, userId);

        if (existing) {
            await this.repo.removeLike(articleId, userId);
        } else {
            await this.repo.addLike(articleId, userId);
        }

        const likeCount = await this.repo.getLikeCount(articleId);

        return {
            liked: !existing,
            likeCount,
        };
    }

    // ── Toggle Bookmark ───────────────────────────────────────────
    async toggleBookmark(articleId, userId) {
        const article = await this.articleRepo.findById(articleId);
        if (!article) throw new AppError('Bài viết không tồn tại', 404);
        if (article.status !== 'published') {
            throw new AppError('Không thể bookmark bài viết này', 400);
        }

        const existing = await this.repo.findBookmark(articleId, userId);

        if (existing) {
            await this.repo.removeBookmark(articleId, userId);
        } else {
            await this.repo.addBookmark(articleId, userId);
        }

        return {
            bookmarked: !existing,
        };
    }

    // ── Get User Bookmarks ────────────────────────────────────────
    async getUserBookmarks(userId, { page = 1, limit = 10 }) {
        const l = Math.min(+limit || 10, 50);
        const offset = ((+page || 1) - 1) * l;

        const result = await this.repo.getUserBookmarks(userId, { limit: l, offset });

        return {
            articles: result.bookmarks,
            pagination: {
                page: +page,
                limit: l,
                total: result.total,
                pages: Math.ceil(result.total / l),
            },
        };
    }
}

module.exports = LikeBookmarkService;