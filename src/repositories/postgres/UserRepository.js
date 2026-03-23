const prisma = require('../../config/prisma');
const IUserRepository = require('../interfaces/IUserRepository');

const SELECT_PUBLIC = {
    id: true,
    fullName: true,
    email: true,
    role: true,
    status: true,
    avatarUrl: true,
    createdAt: true,
    approvedAt: true,
};

class UserRepository extends IUserRepository {

    async findById(id) {
        return await prisma.user.findUnique({
            where: { id },
            select: SELECT_PUBLIC,
        });
    }

    async findByEmail(email) {
        return await prisma.user.findUnique({ where: { email } });
    }

    async findAll({ role, status, search, page = 1, limit = 20 }) {
        const skip = (page - 1) * limit;
        const where = {
            ...(role && { role }),
            ...(status && { status }),
            ...(search && {
                OR: [
                    { fullName: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                ]
            }),
        };

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: SELECT_PUBLIC,
            }),
            prisma.user.count({ where }),
        ]);

        return { users, total };
    }

    async findPending({ page = 1, limit = 20 }) {
        const skip = (page - 1) * limit;
        const where = { status: 'pending' };

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'asc' },
                select: SELECT_PUBLIC,
            }),
            prisma.user.count({ where }),
        ]);

        return { users, total };
    }

    async create(data) {
        return await prisma.user.create({
            data,
            select: SELECT_PUBLIC,
        });
    }

    async update(id, data) {
        return await prisma.user.update({
            where: { id },
            data,
            select: SELECT_PUBLIC,
        });
    }

    async bulkDelete(ids) {
        const result = await prisma.user.deleteMany({
            where: { id: { in: ids }, role: { not: 'admin' } },
        });
        return result.count;
    }

    async bulkUpdateStatus(ids, status, approvedById = null) {
        const data = { status };
        if (status === 'active' && approvedById) {
            data.approvedById = approvedById;
            data.approvedAt = new Date();
        }

        const result = await prisma.user.updateMany({
            where: { id: { in: ids }, role: { not: 'admin' } },
            data,
        });
        return result.count;
    }

    async saveResetToken(userId, token, expiresAt) {
        await prisma.passwordResetToken.deleteMany({ where: { userId } });
        return prisma.passwordResetToken.create({ data: { userId, token, expiresAt } });
    }

    async findResetToken(token) {
        return prisma.passwordResetToken.findUnique({
            where: { token },
            include: { user: true },
        });
    }

    async markResetTokenUsed(token) {
        return prisma.passwordResetToken.update({ where: { token }, data: { used: true } });
    }
}

module.exports = UserRepository;