const AppError = require('../../domain/errors/AppError');

class BookmarkService {
    constructor(bookmarkRepository, articleRepository) {
        this.repo = bookmarkRepository;
        this.articleRepo = articleRepository;
    }

    async toggleBookmark(articleId, userId) {
        const article = await this.articleRepo.findById(articleId);
        if (!article) throw new AppError('Bài viết không tồn tại', 404);
        if (article.status !== 'published') {
            throw new AppError('Không thể bookmark bài viết này', 400);
        }

        let bookmarked = false;
        try {
            await this.repo.addBookmark(articleId, userId);
            bookmarked = true;
        } catch (err) {
            if (err.code === 'P2002') {
                try {
                    await this.repo.removeBookmark(articleId, userId);
                    bookmarked = false;
                } catch (deleteErr) {
                    if (deleteErr.code === 'P2025') {
                        bookmarked = false;
                    } else {
                        throw deleteErr;
                    }
                }
            } else {
                throw err;
            }
        }

        return { bookmarked };
    }

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

module.exports = BookmarkService;
