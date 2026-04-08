const bcrypt = require('bcrypt');
const crypto = require('crypto');
const AppError = require('../../domain/errors/AppError');
const { sendResetPasswordEmail } = require('../../utils/mailer');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../../utils/jwt');
const NotificationRepository = require('../../repositories/postgres/NotificationRepository');
const NotificationService = require('../NotificationService');
const UserService = require('../user/UserService');

const notifService = new NotificationService(new NotificationRepository());

class AuthService {
    constructor(userRepository) {
        this.userRepo = userRepository;
    }

    async register({ fullName, email, password }) {
        const existing = await this.userRepo.findByEmail(email);
        if (existing) throw new AppError('Email này đã được sử dụng', 409);

        const passwordHash = await bcrypt.hash(password, 10);
        const user = await this.userRepo.create({
            fullName, email, passwordHash,
            role: 'member', status: 'pending',
        });

        UserService.getAdminIds().then(adminIds => {
            notifService.onUserPending({
                newUserId: user.id,
                newUserName: fullName,
                adminIds,
            }).catch(() => { });
        }).catch(() => { });

        return user;
    }

    async login({ email, password }) {
        const user = await this.userRepo.findByEmail(email);
        if (!user) throw new AppError('Email hoặc mật khẩu không đúng', 401);
        if (!user.passwordHash) throw new AppError('Tài khoản này đăng nhập bằng Google', 400);

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) throw new AppError('Email hoặc mật khẩu không đúng', 401);

        if (user.status === 'pending') throw new AppError('Tài khoản chưa được phê duyệt', 403);
        if (user.status === 'banned') throw new AppError('Tài khoản đã bị khóa. Liên hệ Admin.', 403);
        if (user.status === 'rejected') throw new AppError('Tài khoản đã bị từ chối', 403);

        const accessToken = generateAccessToken({ id: user.id, email: user.email, role: user.role });
        const refreshToken = generateRefreshToken({ id: user.id, email: user.email, role: user.role });

        await this.userRepo.createRefreshToken({
            token: refreshToken,
            userId: user.id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });

        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id, fullName: user.fullName, email: user.email,
                role: user.role, status: user.status, avatarUrl: user.avatarUrl,
            },
        };
    }

    async handleOAuthLogin(user) {

        if (user.status === 'pending') throw new AppError('Tài khoản chưa được phê duyệt', 403);
        if (user.status === 'banned') throw new AppError('Tài khoản đã bị khóa. Liên hệ Admin.', 403);
        if (user.status === 'rejected') throw new AppError('Tài khoản đã bị từ chối', 403);

        const payload = {
            id: user.id,
            email: user.email,
            role: user.role,
        };

        const accessToken = generateAccessToken(payload);
        const refreshToken = generateRefreshToken(payload);

        // TODO: save refreshToken to DB (important)
        // await tokenRepository.save(refreshToken)

        return { accessToken, refreshToken };
    }

    async refreshAccessToken(refreshToken) {
        const token = await this.userRepo.findRefreshToken(refreshToken);
        if (!token) throw new AppError('Refresh token không hợp lệ', 401);

        const payload = verifyRefreshToken(refreshToken);
        if (payload.id !== token.userId) throw new AppError('Refresh token không hợp lệ', 401);

        const accessToken = generateAccessToken({ id: payload.id, email: payload.email, role: payload.role });
        return { accessToken };
    }

    async logout(refreshToken) {
        await this.userRepo.deleteRefreshToken(refreshToken);
        return { message: 'Đăng xuất thành công' };
    }

    async logoutAll(userId) {
        await this.userRepo.deleteAllRefreshTokensByUser(userId);
        return { message: 'Đăng xuất tất cả thành công' };
    }

    async getMe(userId) {
        const user = await this.userRepo.findById(userId);
        if (!user) throw new AppError('Người dùng không tồn tại', 404);
        return user;
    }
}

module.exports = AuthService;