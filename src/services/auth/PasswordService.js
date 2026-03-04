const crypto = require('crypto');
const bcrypt = require('bcrypt');
const AppError = require('../../domain/errors/AppError');
const { sendResetPasswordEmail } = require('../../utils/mailer');

class PasswordService {
    constructor(userRepository, tokenRepository) {
        this.userRepo = userRepository;
        this.tokenRepo = tokenRepository;
    }

    async forgotPassword(email) {
        const user = await this.userRepo.findByEmail(email);
        if (!user) return;

        if (user.status !== 'active') return;

        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
        await this.tokenRepo.createResetToken(user.id, token, expiresAt);

        await sendResetPasswordEmail({
            toEmail: user.email,
            fullName: user.fullName,
            token,
        });
    }

    async resetPassword(token, newPassword) {
        const resetToken = await this.tokenRepo.findResetToken(token);

        if (!resetToken) {
            throw new AppError('Token không hợp lệ', 400);
        }
        if (resetToken.used) {
            throw new AppError('Token đã được sử dụng', 400);
        }
        if (new Date() > resetToken.expiresAt) {
            throw new AppError('Token đã hết hạn, vui lòng yêu cầu lại', 400);
        }

        const passwordHash = await bcrypt.hash(newPassword, 10);

        await this.userRepo.update(resetToken.userId, { passwordHash });

        await this.tokenRepo.markTokenUsed(resetToken.id);
    }
}

module.exports = PasswordService;