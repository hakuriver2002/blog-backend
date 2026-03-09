const AppError = require('../../domain/errors/AppError');

class UserService {
    constructor(userRepository) {
        this.userRepo = userRepository;
    }

    async getUsers({ role, status, search, page, limit }) {
        const validRoles = ['admin', 'editor', 'trainer', 'member'];
        const validStatuses = ['pending', 'active', 'inactive', 'rejected'];

        if (role && !validRoles.includes(role)) {
            throw new AppError('Role không hợp lệ', 400);
        }
        if (status && !validStatuses.includes(status)) {
            throw new AppError('Status không hợp lệ', 400);
        }

        return await this.userRepo.findAll({
            role, status, search, page: +page, limit: +limit
        });
    }

    async getPendingUsers({ page, limit }) {
        return await this.userRepo.findPending({ page: +page, limit: +limit });
    }

    async getUserById(id, requesterId, requesterRole) {
        const isAdmin = requesterRole === 'admin';
        const isSelf = id === requesterId;

        if (!isAdmin && !isSelf) {
            throw new AppError('Không có quyền xem thông tin này', 403);
        }

        const user = await this.userRepo.findById(id);
        if (!user) throw new AppError('Thành viên không tồn tại', 404);

        return user;
    }

    async approveUser(id, adminId) {
        const user = await this.userRepo.findById(id);
        if (!user) throw new AppError('Thành viên không tồn tại', 404);

        if (user.status !== 'pending') {
            throw new AppError('Tài khoản không ở trạng thái chờ duyệt', 400);
        }

        return await this.userRepo.update(id, {
            status: 'active',
            approvedById: adminId,
            approvedAt: new Date(),
        });
    }

    async rejectUser(id) {
        const user = await this.userRepo.findById(id);
        if (!user) throw new AppError('Thành viên không tồn tại', 404);

        if (user.status !== 'pending') {
            throw new AppError('Tài khoản không ở trạng thái chờ duyệt', 400);
        }

        return await this.userRepo.update(id, { status: 'rejected' });
    }

    async updateRole(id, newRole, adminId) {
        const validRoles = ['editor', 'trainer', 'member'];
        if (!validRoles.includes(newRole)) {
            throw new AppError('Role không hợp lệ. Chỉ được phép: editor, trainer, member', 400);
        }

        const user = await this.userRepo.findById(id);
        if (!user) throw new AppError('Thành viên không tồn tại', 404);

        if (user.role === 'admin') {
            throw new AppError('Không thể thay đổi quyền của Admin', 403);
        }

        if (id === adminId) {
            throw new AppError('Không thể tự thay đổi role của mình', 403);
        }

        return await this.userRepo.update(id, { role: newRole });
    }

    async lockUser(id, adminId) {
        const user = await this.userRepo.findById(id);
        if (!user) throw new AppError('Thành viên không tồn tại', 404);

        if (user.role === 'admin') {
            throw new AppError('Không thể khóa tài khoản Admin', 403);
        }
        if (id === adminId) {
            throw new AppError('Không thể tự khóa tài khoản của mình', 403);
        }
        if (user.status === 'inactive') {
            throw new AppError('Tài khoản đã bị khóa', 400);
        }

        return await this.userRepo.update(id, { status: 'inactive' });
    }

    async unlockUser(id) {
        const user = await this.userRepo.findById(id);
        if (!user) throw new AppError('Thành viên không tồn tại', 404);

        if (user.status !== 'inactive') {
            throw new AppError('Tài khoản không ở trạng thái bị khóa', 400);
        }

        return await this.userRepo.update(id, { status: 'active' });
    }

    async getProfile(userId) {
        const user = await this.userRepo.findById(userId);
        if (!user) throw new AppError('Thành viên không tồn tại', 404);
        return user;
    }

    async updateProfile(userId, { fullName, avatarUrl }) {
        const user = await this.userRepo.findById(userId);
        if (!user) throw new AppError('Thành viên không tồn tại', 404);

        const updateData = {};
        if (fullName && fullName.trim().length >= 2) {
            updateData.fullName = fullName.trim();
        } else if (fullName !== undefined) {
            throw new AppError('Họ và tên phải có ít nhất 2 ký tự', 400);
        }
        if (avatarUrl) updateData.avatarUrl = avatarUrl;

        return await this.userRepo.update(userId, updateData);
    }

    async changePassword(userId, currentPassword, newPassword) {
        const bcrypt = require('bcrypt');

        const user = await this.userRepo.findByEmail(
            (await this.userRepo.findById(userId)).email
        );
        if (!user) throw new AppError('Thành viên không tồn tại', 404);

        if (!user.passwordHash) {
            throw new AppError('Tài khoản Google không thể đổi mật khẩu tại đây', 400);
        }

        const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isMatch) throw new AppError('Mật khẩu hiện tại không đúng', 401);

        const passwordHash = await bcrypt.hash(newPassword, 10);
        await this.userRepo.update(userId, { passwordHash });
    }
}

module.exports = UserService;