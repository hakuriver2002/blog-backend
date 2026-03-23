const response = require('../../utils/response');

class UserController {
    constructor(userService) {
        this.userService = userService;
    }

    getAll = async (req, res, next) => {
        try {
            const { role, status, search, page = 1, limit = 20 } = req.query;
            const result = await this.userService.getUsers({
                role, status, search, page, limit
            });

            return response.success(res, {
                users: result.users,
                pagination: {
                    page: +page,
                    limit: +limit,
                    total: result.total,
                    pages: Math.ceil(result.total / limit),
                }
            });
        } catch (err) { next(err); }
    }

    getPending = async (req, res, next) => {
        try {
            const { page = 1, limit = 20 } = req.query;
            const result = await this.userService.getPendingUsers({ page, limit });

            return response.success(res, {
                users: result.users,
                pagination: {
                    page: +page,
                    limit: +limit,
                    total: result.total,
                    pages: Math.ceil(result.total / limit),
                }
            });
        } catch (err) { next(err); }
    }

    getById = async (req, res, next) => {
        try {
            const user = await this.userService.getUserById(
                req.params.id,
                req.user.id,
                req.user.role
            );
            return response.success(res, user);
        } catch (err) { next(err); }
    }

    approve = async (req, res, next) => {
        try {
            const user = await this.userService.approveUser(
                req.params.id,
                req.user.id
            );
            return response.success(res, user, 'Phê duyệt tài khoản thành công');
        } catch (err) { next(err); }
    }

    reject = async (req, res, next) => {
        try {
            const user = await this.userService.rejectUser(req.params.id);
            return response.success(res, user, 'Đã từ chối tài khoản');
        } catch (err) { next(err); }
    }

    updateRole = async (req, res, next) => {
        try {
            const { role } = req.body || {};
            if (!role) return response.error(res, 'Vui lòng cung cấp role mới', 400);

            const user = await this.userService.updateRole(
                req.params.id,
                role,
                req.user.id
            );
            return response.success(res, user, 'Cập nhật quyền thành công');
        } catch (err) { next(err); }
    }

    lock = async (req, res, next) => {
        try {
            const user = await this.userService.lockUser(
                req.params.id,
                req.user.id
            );
            return response.success(res, user, 'Đã khóa tài khoản');
        } catch (err) { next(err); }
    }

    unlock = async (req, res, next) => {
        try {
            const user = await this.userService.unlockUser(req.params.id);
            return response.success(res, user, 'Đã mở khóa tài khoản');
        } catch (err) { next(err); }
    }

    bulk = async (req, res, next) => {
        try {
            const { ids, action } = req.body || {};
            if (!action) return response.error(res, 'Vui lòng cung cấp action', 400);
            const result = await this.userService.bulkAction(ids, action, req.user.id);
            return response.success(res, result, `Đã ${action} ${result.affected} tài khoản`);
        } catch (err) { next(err); }
    }
}

module.exports = UserController;