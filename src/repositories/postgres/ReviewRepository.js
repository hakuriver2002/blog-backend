const prisma = require('../../config/prisma');

class ReviewRepository {
    async createLog({ articleId, reviewerId, action, note }) {
        return await prisma.articleReview.create({
            data: { articleId, reviewerId, action, note }
        });
    }

    async findByArticle(articleId) {
        return await prisma.articleReview.findMany({
            where: { articleId },
            orderBy: { createdAt: 'desc' },
            include: {
                reviewer: { select: { id: true, fullName: true, role: true } }
            }
        });
    }
}

module.exports = ReviewRepository;