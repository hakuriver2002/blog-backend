const bcrypt = require('bcrypt');
const AppError = require('../../domain/errors/AppError');
const { generateToken } = require('../../utils/jwt');

class AuthService {
    constructor(userRepository) {
        this.userRepo = userRepository;
    }

    async register({ fullName, email, password }) {
        const existing = await this.userRepo.findByEmail(email);
        if (existing) {
            throw new AppError('Email này đã được sử dụng', 400);
        }
        const passwordHash = await bcrypt.hash(password, 10);

        const user = await this.userRepo.create({
            fullName,
            email,
            passwordHash,
            role: 'member',
            status: 'pending',
        });

        return user;
    }

    async login({ email, password }) {
        const user = await this.userRepo.findByEmail(email);
        if (!user) {
            throw new AppError('Email hoặc mật khẩu không đúng', 401);
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            throw new AppError('Email hoặc mật khẩu không đúng', 401);
        }

        if (user.status === 'pending') {
            throw new AppError('Tài khoản đang chờ Admin phê duyệt', 403);
        }
        if (user.status === 'inactive') {
            throw new AppError('Tài khoản đã bị khóa, vui lòng liên hệ Admin', 403);
        }
        if (user.status === 'rejected') {
            throw new AppError('Tài khoản đã bị từ chối', 403);
        }

        const token = generateToken({
            id: user.id,
            email: user.email,
            role: user.role,
        });

        const { passwordHash: _, ...userInfo } = user;
        return { token, user: userInfo };
    }

    // async logout({ userId, refreshToken, logoutAll = false }) {
    //     if (logoutAll) {
    //         await this.userRepo.deleteAllRefreshTokens(userId);
    //     } else if (refreshToken) {
    //         await this.userRepo.deleteRefreshToken(refreshToken);
    //     }
    //     return { message: 'Đăng xuất thành công' };
    // }
}

module.exports = AuthService;