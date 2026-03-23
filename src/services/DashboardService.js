class DashboardService {
    constructor(dashboardRepository) {
        this.dashboardRepo = dashboardRepository;
    }

    async getOverview() {
        const [stats, recentPending, recentUsers, pendingUsers, topArticles, byCategory] =
            await Promise.all([
                this.dashboardRepo.getStats(),
                this.dashboardRepo.getRecentPending(5),
                this.dashboardRepo.getRecentUsers(5),
                this.dashboardRepo.getPendingUsers(5),
                this.dashboardRepo.getTopArticles(5),
                this.dashboardRepo.getArticlesByCategory(),
            ]);

        return {
            stats,
            recentPending,
            recentUsers,
            pendingUsers,
            topArticles,
            byCategory,
        };
    }

    async getStats() {
        return await this.dashboardRepo.getStats();
    }

    async getAnalytics({ period = 'day', days }) {
        if (!VALID_PERIODS.includes(period)) {
            throw new AppError(`Period không hợp lệ. Chọn: ${VALID_PERIODS.join(', ')}`, 400);
        }

        const defaultDays = { day: 30, week: 12 * 7, month: 12 * 30 };
        const resolvedDays = Math.min(
            parseInt(days) || defaultDays[period],
            365
        );

        const [articles, users, comments, articlesByStatus, usersByRole, topArticles] =
            await Promise.all([
                this.dashboardRepo.getArticlesOverTime({ period, days: resolvedDays }),
                this.dashboardRepo.getUsersOverTime({ period, days: resolvedDays }),
                this.dashboardRepo.getCommentsOverTime({ period, days: resolvedDays }),
                this.dashboardRepo.getArticlesByStatus(),
                this.dashboardRepo.getUsersByRole(),
                this.dashboardRepo.getTopArticlesByViews({ limit: 10 }),
            ]);

        return {
            period,
            days: resolvedDays,
            charts: {
                articlesPublished: articles,
                usersRegistered: users,
                comments: comments,
            },
            distributions: {
                articlesByStatus,
                usersByRole,
                articlesByCategory: await this.dashboardRepo.getArticlesByCategory(),
            },
            topArticles,
        };
    }
}

module.exports = DashboardService;