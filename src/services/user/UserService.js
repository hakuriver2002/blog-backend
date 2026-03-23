const AppError = require('../../domain/errors/AppError');
const NotificationRepository = require('../../repositories/postgres/NotificationRepository');
const NotificationService = require('../NotificationService');
const prisma = require('../../config/prisma');

const notifService = new NotificationService(new NotificationRepository());

class UserService {
    constructor(userRepository) {
        this.userRepo = userRepository;
    }

    async getUsers({ role, status, search, page, limit }) {
        const validRoles = ['admin', 'editor', 'trainer', 'member'];
        const validStatuses = ['pending', 'active', 'inactive', 'rejected'];
        if (role && !validRoles.includes(role)) throw new AppError('Role không hợp lệ', 400);
        if (status && !validStatuses.includes(status)) throw new AppError('Status không hợp lệ', 400);
        return this.userRepo.findAll({ role, status, search, page: +page, limit: +limit });
    }

    async getPendingUsers({ page, limit }) {
        return this.userRepo.findPending({ page: +page, limit: +limit });
    }

    async getUserById(id, requesterId, requesterRole) {
        if (requesterRole !== 'admin' && id !== requesterId) {
            throw new AppError('Không có quyền xem thông tin này', 403);
        }
        const user = await this.userRepo.findById(id);
        if (!user) throw new AppError('Thành viên không tồn tại', 404);
        return user;
    }

    async approveUser(id, adminId) {
        const user = await this.userRepo.findById(id);
        if (!user) throw new AppError('Thành viên không tồn tại', 404);
        if (user.status !== 'pending') throw new AppError('Tài khoản không ở trạng thái chờ duyệt', 400);

        const updated = await this.userRepo.update(id, {
            status: 'active', approvedById: adminId, approvedAt: new Date(),
        });

        notifService.onUserApproved({ userId: id, adminId }).catch(() => { });

        return updated;
    }

    async rejectUser(id) {
        const user = await this.userRepo.findById(id);
        if (!user) throw new AppError('Thành viên không tồn tại', 404);
        if (user.status !== 'pending') throw new AppError('Tài khoản không ở trạng thái chờ duyệt', 400);
        return this.userRepo.update(id, { status: 'rejected' });
    }

    async updateRole(id, newRole, adminId) {
        const validRoles = ['editor', 'trainer', 'member'];
        if (!validRoles.includes(newRole)) throw new AppError('Role không hợp lệ', 400);
        const user = await this.userRepo.findById(id);
        if (!user) throw new AppError('Thành viên không tồn tại', 404);
        if (user.role === 'admin') throw new AppError('Không thể thay đổi quyền của Admin', 403);
        if (id === adminId) throw new AppError('Không thể tự thay đổi role của mình', 403);
        return this.userRepo.update(id, { role: newRole });
    }

    async lockUser(id, adminId) {
        const user = await this.userRepo.findById(id);
        if (!user) throw new AppError('Thành viên không tồn tại', 404);
        if (user.role === 'admin') throw new AppError('Không thể khóa tài khoản Admin', 403);
        if (id === adminId) throw new AppError('Không thể tự khóa tài khoản của mình', 403);
        if (user.status === 'inactive') throw new AppError('Tài khoản đã bị khóa', 400);
        return this.userRepo.update(id, { status: 'inactive' });
    }

    async unlockUser(id) {
        const user = await this.userRepo.findById(id);
        if (!user) throw new AppError('Thành viên không tồn tại', 404);
        if (user.status !== 'inactive') throw new AppError('Tài khoản không ở trạng thái bị khóa', 400);
        return this.userRepo.update(id, { status: 'active' });
    }

    async getProfile(userId) {
        const user = await this.userRepo.findById(userId);
        if (!user) throw new AppError('Thành viên không tồn tại', 404);
        return user;
    }

    async updateProfile(userId, { fullName, avatarUrl }) {
        const user = await this.userRepo.findById(userId);
        if (!user) throw new AppError('Thành viên không tồn tại', 404);
        const data = {};
        if (fullName) {
            if (fullName.trim().length < 2) throw new AppError('Họ và tên phải có ít nhất 2 ký tự', 400);
            data.fullName = fullName.trim();
        }
        if (avatarUrl) data.avatarUrl = avatarUrl;
        return this.userRepo.update(userId, data);
    }

    async changePassword(userId, currentPassword, newPassword) {
        const bcrypt = require('bcrypt');
        const base = await this.userRepo.findById(userId);
        if (!base) throw new AppError('Thành viên không tồn tại', 404);
        const full = await this.userRepo.findByEmail(base.email);
        if (!full?.passwordHash) throw new AppError('Tài khoản Google không thể đổi mật khẩu tại đây', 400);
        const isMatch = await bcrypt.compare(currentPassword, full.passwordHash);
        if (!isMatch) throw new AppError('Mật khẩu hiện tại không đúng', 401);
        const passwordHash = await bcrypt.hash(newPassword, 10);
        await this.userRepo.update(userId, { passwordHash });
    }

    async bulkAction(ids, action, adminId) {
        if (!Array.isArray(ids) || ids.length === 0) throw new AppError('Vui lòng chọn ít nhất 1 thành viên', 400);
        if (ids.length > 100) throw new AppError('Tối đa 100 thành viên mỗi lần', 400);
        if (ids.includes(adminId)) throw new AppError('Không thể thực hiện hành động này lên tài khoản của mình', 400);

        switch (action) {
            case 'approve': {
                const count = await this.userRepo.bulkUpdateStatus(ids, 'active', adminId);
                ids.forEach(userId => notifService.onUserApproved({ userId, adminId }).catch(() => { }));
                return { affected: count, action };
            }
            case 'reject':
                return { affected: await this.userRepo.bulkUpdateStatus(ids, 'rejected'), action };
            case 'lock':
                return { affected: await this.userRepo.bulkUpdateStatus(ids, 'inactive'), action };
            case 'unlock':
                return { affected: await this.userRepo.bulkUpdateStatus(ids, 'active'), action };
            case 'delete':
                return { affected: await this.userRepo.bulkDelete(ids), action };
            default:
                throw new AppError('Action không hợp lệ. Chọn: approve, reject, lock, unlock, delete', 400);
        }
    }

    static async getAdminIds() {
        const admins = await prisma.user.findMany({
            where: { role: 'admin', status: 'active' }, select: { id: true },
        });
        return admins.map(a => a.id);
    }
}

module.exports = UserService;