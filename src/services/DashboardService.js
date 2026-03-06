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
}

module.exports = DashboardService;