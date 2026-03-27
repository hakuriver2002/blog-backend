const AppError = require('../../domain/errors/AppError');

class LikeService {
    constructor(likeRepository, articleRepository) {
        this.repo = likeRepository;
        this.articleRepo = articleRepository;
    }

    async toggleLike(articleId, userId) {
        const article = await this.articleRepo.findById(articleId);
        if (!article) throw new AppError('Bài viết không tồn tại', 404);
        if (article.status !== 'published') {
            throw new AppError('Không thể like bài viết này', 400);
        }

        let liked = false;
        try {
            await this.repo.addLike(articleId, userId);
            liked = true;
        } catch (err) {
            // Prisma Unique Constraint Violation
            if (err.code === 'P2002') {
                try {
                    await this.repo.removeLike(articleId, userId);
                    liked = false;
                } catch (deleteErr) {
                    // Record to delete does not exist (already deleted)
                    if (deleteErr.code === 'P2025') {
                        liked = false;
                    } else {
                        throw deleteErr;
                    }
                }
            } else {
                throw err;
            }
        }

        const likeCount = await this.repo.getLikeCount(articleId);

        return { liked, likeCount };
    }
}

module.exports = LikeService;
