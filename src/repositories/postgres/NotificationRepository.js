const prisma = require('../../config/prisma');

class NotificationRepository {

    async findByUser(userId, { limit, offset, unreadOnly }) {
        const where = {
            userId,
            ...(unreadOnly && { isRead: false }),
        };

        const [notifications, total, unreadCount] = await Promise.all([
            prisma.notification.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset,
                include: {
                    actor: { select: { id: true, fullName: true, avatarUrl: true } },
                },
            }),
            prisma.notification.count({ where }),
            prisma.notification.count({ where: { userId, isRead: false } }),
        ]);

        return { notifications, total, unreadCount };
    }

    async findById(id) {
        return prisma.notification.findUnique({ where: { id } });
    }

    async create({ userId, type, title, body, articleId, commentId, actorId }) {
        return prisma.notification.create({
            data: { userId, type, title, body, articleId, commentId, actorId },
        });
    }

    async createMany(notifications) {
        return prisma.notification.createMany({
            data: notifications,
            skipDuplicates: true,
        });
    }

    async markRead(id, userId) {
        return prisma.notification.updateMany({
            where: { id, userId },
            data: { isRead: true },
        });
    }

    async markAllRead(userId) {
        const result = await prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });
        return result.count;
    }

    async deleteOne(id, userId) {
        return prisma.notification.deleteMany({ where: { id, userId } });
    }

    async getUnreadCount(userId) {
        return prisma.notification.count({ where: { userId, isRead: false } });
    }

    async deleteOld() {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 90);
        const result = await prisma.notification.deleteMany({
            where: { createdAt: { lt: cutoff } },
        });
        return result.count;
    }
}

module.exports = NotificationRepository;