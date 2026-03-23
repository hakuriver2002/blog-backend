const prisma = require('../../config/prisma');

class DashboardRepository {

    async getStats() {
        const [
            totalUsers, pendingUsers,
            totalArticles, pendingArticles, publishedArticles,
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
            users: { total: totalUsers, pending: pendingUsers },
            articles: { total: totalArticles, pending: pendingArticles, published: publishedArticles },
            comments: { total: totalComments },
        };
    }

    async getRecentPending(limit = 5) {
        return prisma.article.findMany({
            where: { status: 'pending' }, take: limit, orderBy: { createdAt: 'asc' },
            include: { author: { select: { id: true, fullName: true } } },
        });
    }

    async getRecentUsers(limit = 5) {
        return prisma.user.findMany({
            take: limit, orderBy: { createdAt: 'desc' },
            select: { id: true, fullName: true, email: true, role: true, status: true, createdAt: true },
        });
    }

    async getPendingUsers(limit = 5) {
        return prisma.user.findMany({
            where: { status: 'pending' }, take: limit, orderBy: { createdAt: 'asc' },
            select: { id: true, fullName: true, email: true, role: true, status: true, createdAt: true },
        });
    }

    async getTopArticles(limit = 5) {
        return prisma.article.findMany({
            where: { status: 'published' }, take: limit, orderBy: { viewCount: 'desc' },
            select: {
                id: true, title: true, category: true, viewCount: true, publishedAt: true,
                author: { select: { fullName: true } },
            },
        });
    }

    async getArticlesByCategory() {
        const categories = ['club_news', 'events', 'regional_news', 'internal'];
        const counts = await Promise.all(
            categories.map(category =>
                prisma.article.count({ where: { category, status: 'published' } })
            )
        );
        return categories.map((category, idx) => ({ category, count: counts[idx] }));
    }

    async getArticlesOverTime({ period = 'day', days = 30 }) {
        const from = new Date();
        from.setDate(from.getDate() - days);
        from.setHours(0, 0, 0, 0);

        const rows = await prisma.$queryRaw`
      SELECT
        DATE_TRUNC(${period}, "published_at") AS date,
        COUNT(*)::int                          AS count
      FROM articles
      WHERE status = 'published'
        AND "published_at" >= ${from}
      GROUP BY DATE_TRUNC(${period}, "published_at")
      ORDER BY date ASC
    `;

        return this._fillDateGaps(rows, days, period);
    }

    async getUsersOverTime({ period = 'day', days = 30 }) {
        const from = new Date();
        from.setDate(from.getDate() - days);
        from.setHours(0, 0, 0, 0);

        const rows = await prisma.$queryRaw`
      SELECT
        DATE_TRUNC(${period}, "created_at") AS date,
        COUNT(*)::int                        AS count
      FROM users
      WHERE "created_at" >= ${from}
      GROUP BY DATE_TRUNC(${period}, "created_at")
      ORDER BY date ASC
    `;

        return this._fillDateGaps(rows, days, period);
    }

    async getTopArticlesByViews({ limit = 10 }) {
        return prisma.article.findMany({
            where: { status: 'published' },
            take: limit,
            orderBy: { viewCount: 'desc' },
            select: {
                id: true, title: true, slug: true, category: true,
                viewCount: true, publishedAt: true,
                author: { select: { fullName: true } },
            },
        });
    }

    async getArticlesByStatus() {
        const statuses = ['draft', 'pending', 'published', 'rejected', 'archived'];
        const counts = await Promise.all(
            statuses.map(status => prisma.article.count({ where: { status } }))
        );
        return statuses.map((status, idx) => ({ status, count: counts[idx] }));
    }

    async getUsersByRole() {
        const roles = ['admin', 'editor', 'trainer', 'member'];
        const counts = await Promise.all(
            roles.map(role => prisma.user.count({ where: { role, status: 'active' } }))
        );
        return roles.map((role, idx) => ({ role, count: counts[idx] }));
    }

    async getCommentsOverTime({ period = 'day', days = 30 }) {
        const from = new Date();
        from.setDate(from.getDate() - days);
        from.setHours(0, 0, 0, 0);

        const rows = await prisma.$queryRaw`
      SELECT
        DATE_TRUNC(${period}, "created_at") AS date,
        COUNT(*)::int                        AS count
      FROM comments
      WHERE status != 'deleted'
        AND "created_at" >= ${from}
      GROUP BY DATE_TRUNC(${period}, "created_at")
      ORDER BY date ASC
    `;

        return this._fillDateGaps(rows, days, period);
    }

    _fillDateGaps(rows, days, period) {
        const map = new Map(
            rows.map(r => [this._dateKey(new Date(r.date), period), r.count])
        );

        const result = [];
        const now = new Date();

        for (let i = days - 1; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            d.setHours(0, 0, 0, 0);

            const key = this._dateKey(d, period);

            if (result.length && result[result.length - 1].date === key) continue;

            result.push({ date: key, count: map.get(key) ?? 0 });
        }

        return result;
    }

    _dateKey(date, period) {
        if (period === 'month') return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (period === 'week') {
            const d = new Date(date);
            const day = d.getDay() || 7;
            d.setDate(d.getDate() - day + 1);
            return d.toISOString().slice(0, 10);
        }
        return date.toISOString().slice(0, 10); // YYYY-MM-DD
    }
}

module.exports = DashboardRepository;