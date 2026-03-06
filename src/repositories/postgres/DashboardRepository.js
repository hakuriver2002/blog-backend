const prisma = require('../../config/prisma');

class DashboardRepository {

    async getStats() {
        const [
            totalUsers,
            pendingUsers,
            totalArticles,
            pendingArticles,
            publishedArticles,
            totalComments,
        ] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { status: 'pending' } }),
            prisma.article.count(),
            prisma.article.count({ where: { status: 'pending' } }),
            prisma.article.count({ where: { status: 'published' } }),
            prisma.comment.count({ where: { status: 'visible' } }),
        ]);

        return {
            users: {
                total: totalUsers,
                pending: pendingUsers,
            },
            articles: {
                total: totalArticles,
                pending: pendingArticles,
                published: publishedArticles,
            },
            comments: {
                total: totalComments,
            }
        };
    }

    async getRecentPending(limit = 5) {
        return await prisma.article.findMany({
            where: { status: 'pending' },
            take: limit,
            orderBy: { createdAt: 'asc' },
            include: {
                author: { select: { id: true, fullName: true } }
            }
        });
    }

    async getRecentUsers(limit = 5) {
        return await prisma.user.findMany({
            take: limit,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                status: true,
                createdAt: true,
            }
        });
    }

    async getPendingUsers(limit = 5) {
        return await prisma.user.findMany({
            where: { status: 'pending' },
            take: limit,
            orderBy: { createdAt: 'asc' },
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                status: true,
                createdAt: true,
            }
        });
    }

    async getTopArticles(limit = 5) {
        return await prisma.article.findMany({
            where: { status: 'published' },
            take: limit,
            orderBy: { viewCount: 'desc' },
            select: {
                id: true,
                title: true,
                category: true,
                viewCount: true,
                publishedAt: true,
                author: { select: { fullName: true } }
            }
        });
    }

    async getArticlesByCategory() {
        const categories = ['club_news', 'events', 'regional_news', 'internal'];

        const counts = await Promise.all(
            categories.map(category =>
                prisma.article.count({
                    where: { category, status: 'published' }
                })
            )
        );

        return categories.map((category, idx) => ({
            category,
            count: counts[idx],
        }));
    }
}

module.exports = DashboardRepository;