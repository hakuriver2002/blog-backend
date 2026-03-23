const response = require('../utils/response');

class DashboardController {
    constructor(dashboardService) {
        this.dashboardService = dashboardService;
    }

    getOverview = async (req, res, next) => {
        try {
            const data = await this.dashboardService.getOverview();
            return response.success(res, data, 'Lấy dữ liệu dashboard thành công');
        } catch (err) { next(err); }
    }

    getStats = async (req, res, next) => {
        try {
            const data = await this.dashboardService.getStats();
            return response.success(res, data);
        } catch (err) { next(err); }
    }
    getAnalytics = async (req, res, next) => {
        try {
            const { period = 'day', days } = req.query;
            const data = await this.dashboardService.getAnalytics({ period, days });
            return response.success(res, data);
        } catch (err) { next(err); }
    }
}

module.exports = DashboardController;