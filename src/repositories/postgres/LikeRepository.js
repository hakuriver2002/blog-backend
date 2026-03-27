const prisma = require('../../config/prisma');

class LikeRepository {
    async addLike(articleId, userId) {
        return prisma.articleLike.create({
            data: { articleId, userId },
        });
    }

    async removeLike(articleId, userId) {
        return prisma.articleLike.delete({
            where: { articleId_userId: { articleId, userId } },
        });
    }

    async getLikeCount(articleId) {
        return prisma.articleLike.count({ where: { articleId } });
    }
}

module.exports = LikeRepository;
