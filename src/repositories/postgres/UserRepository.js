const prisma = require('../../config/prisma');
const IUserRepository = require('../interfaces/IUserRepository');

class UserRepository extends IUserRepository {
    async findById(id) {
        return await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                status: true,
                avatarUrl: true,
                createdAt: true,
            }
        });
    }

    async findByEmail(email) {
        return await prisma.user.findUnique({
            where: { email },
        });
    }

    async create(data) {
        return await prisma.user.create({
            data,
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

    async update(id, data) {
        return await prisma.user.update({
            where: { id },
            data,
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                status: true,
                updatedAt: true,
            }
        });
    }
}

module.exports = UserRepository;