const response = require('../utils/response');

class NotificationController {
    constructor(notificationService) {
        this.notifService = notificationService;
    }

    getAll = async (req, res, next) => {
        try {
            const { page, limit, unreadOnly } = req.query;
            const result = await this.notifService.getNotifications(req.user.id, {
                page, limit, unreadOnly,
            });
            return response.success(res, result);
        } catch (err) { next(err); }
    }

    getUnreadCount = async (req, res, next) => {
        try {
            const count = await this.notifService.getUnreadCount(req.user.id);
            return response.success(res, { unreadCount: count });
        } catch (err) { next(err); }
    }

    markRead = async (req, res, next) => {
        try {
            const result = await this.notifService.markRead(req.params.id, req.user.id);
            return response.success(res, null, result.message);
        } catch (err) { next(err); }
    }

    markAllRead = async (req, res, next) => {
        try {
            const result = await this.notifService.markAllRead(req.user.id);
            return response.success(res, { affected: result.affected }, result.message);
        } catch (err) { next(err); }
    }

    deleteOne = async (req, res, next) => {
        try {
            const result = await this.notifService.deleteOne(req.params.id, req.user.id);
            return response.success(res, null, result.message);
        } catch (err) { next(err); }
    }
}

module.exports = NotificationController;