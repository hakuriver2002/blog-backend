const bcrypt = require('bcrypt');
const crypto = require('crypto');
const AppError = require('../../domain/errors/AppError');
const { generateToken } = require('../../utils/jwt');
const { sendResetPasswordEmail } = require('../../utils/mailer');
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
        if (user.status === 'inactive') throw new AppError('Tài khoản đã bị khóa. Liên hệ Admin.', 403);
        if (user.status === 'rejected') throw new AppError('Tài khoản đã bị từ chối', 403);

        const token = generateToken({ id: user.id, email: user.email, role: user.role });

        return {
            token,
            user: {
                id: user.id, fullName: user.fullName, email: user.email,
                role: user.role, status: user.status, avatarUrl: user.avatarUrl,
            },
        };
    }

    async logout() {
        return { message: 'Đăng xuất thành công' };
    }

    async getMe(userId) {
        const user = await this.userRepo.findById(userId);
        if (!user) throw new AppError('Người dùng không tồn tại', 404);
        return user;
    }
}

module.exports = AuthService;