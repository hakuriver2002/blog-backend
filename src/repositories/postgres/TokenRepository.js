const prisma = require('../../config/prisma');

class TokenRepository {
    async createResetToken(userId, token, expiresAt) {
        await prisma.passwordResetToken.deleteMany({
            where: { userId }
        });

        return await prisma.passwordResetToken.create({
            data: { userId, token, expiresAt }
        });
    }

    async findResetToken(token) {
        return await prisma.passwordResetToken.findUnique({
            where: { token },
            include: { user: true }
        });
    }

    async markTokenUsed(id) {
        return await prisma.passwordResetToken.update({
            where: { id },
            data: { used: true }
        });
    }
}

module.exports = TokenRepository;