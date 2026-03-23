const AppError = require('../domain/errors/AppError');

class NotificationService {
    constructor(notificationRepository) {
        this.notifRepo = notificationRepository;
    }

    async getNotifications(userId, { page = 1, limit = 20, unreadOnly = false }) {
        const l = Math.min(+limit || 20, 50);
        const offset = ((+page || 1) - 1) * l;

        const result = await this.notifRepo.findByUser(userId, {
            limit: l,
            offset,
            unreadOnly: unreadOnly === 'true' || unreadOnly === true,
        });

        return {
            notifications: result.notifications,
            unreadCount: result.unreadCount,
            pagination: {
                page: +page,
                limit: l,
                total: result.total,
                pages: Math.ceil(result.total / l),
            },
        };
    }

    async getUnreadCount(userId) {
        return this.notifRepo.getUnreadCount(userId);
    }

    async markRead(notificationId, userId) {
        const notif = await this.notifRepo.findById(notificationId);
        if (!notif) throw new AppError('Notification không tồn tại', 404);
        if (notif.userId !== userId) throw new AppError('Không có quyền', 403);
        await this.notifRepo.markRead(notificationId, userId);
        return { message: 'Đã đánh dấu đã đọc' };
    }

    async markAllRead(userId) {
        const count = await this.notifRepo.markAllRead(userId);
        return { affected: count, message: 'Đã đánh dấu tất cả là đã đọc' };
    }

    async deleteOne(notificationId, userId) {
        const notif = await this.notifRepo.findById(notificationId);
        if (!notif) throw new AppError('Notification không tồn tại', 404);
        if (notif.userId !== userId) throw new AppError('Không có quyền', 403);
        await this.notifRepo.deleteOne(notificationId, userId);
        return { message: 'Đã xóa notification' };
    }

    async onArticleApproved({ articleId, articleTitle, authorId, reviewerId }) {
        await this.notifRepo.create({
            userId: authorId,
            type: 'article_approved',
            title: 'Bài viết được duyệt',
            body: `Bài "${this._truncate(articleTitle)}" đã được phê duyệt và xuất bản.`,
            articleId,
            actorId: reviewerId,
        });
    }

    async onArticleRejected({ articleId, articleTitle, authorId, reviewerId, note }) {
        await this.notifRepo.create({
            userId: authorId,
            type: 'article_rejected',
            title: 'Bài viết bị từ chối',
            body: `Bài "${this._truncate(articleTitle)}" bị từ chối. Lý do: ${this._truncate(note, 100)}`,
            articleId,
            actorId: reviewerId,
        });
    }

    async onArticleCommented({ articleId, articleTitle, authorId, commenterId, commenterName }) {
        if (authorId === commenterId) return;

        await this.notifRepo.create({
            userId: authorId,
            type: 'article_commented',
            title: 'Có bình luận mới',
            body: `${commenterName} đã bình luận bài "${this._truncate(articleTitle)}".`,
            articleId,
            actorId: commenterId,
        });
    }

    async onCommentReplied({ articleId, commentId, commentOwnerId, replierId, replierName }) {
        if (commentOwnerId === replierId) return;

        await this.notifRepo.create({
            userId: commentOwnerId,
            type: 'comment_replied',
            title: 'Có người trả lời bình luận',
            body: `${replierName} đã trả lời bình luận của bạn.`,
            articleId,
            commentId,
            actorId: replierId,
        });
    }

    async onUserApproved({ userId, adminId }) {
        await this.notifRepo.create({
            userId,
            type: 'user_approved',
            title: 'Tài khoản được kích hoạt',
            body: 'Tài khoản của bạn đã được Admin phê duyệt. Chào mừng bạn!',
            actorId: adminId,
        });
    }

    async onUserPending({ newUserId, newUserName, adminIds = [] }) {
        if (!adminIds.length) return;

        await this.notifRepo.createMany(
            adminIds.map(adminId => ({
                userId: adminId,
                type: 'user_pending',
                title: 'Thành viên mới chờ duyệt',
                body: `${newUserName} vừa đăng ký tài khoản và đang chờ phê duyệt.`,
                actorId: newUserId,
            }))
        );
    }

    _truncate(str, max = 60) {
        if (!str) return '';
        return str.length > max ? str.slice(0, max) + '...' : str;
    }
}

module.exports = NotificationService;