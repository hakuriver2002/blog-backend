const response = require('../../utils/response');

class ProfileController {
    constructor(userService, articleService) {
        this.userService = userService;
        this.articleService = articleService;
    }

    getMe = async (req, res, next) => {
        try {
            const user = await this.userService.getProfile(req.user.id);
            return response.success(res, user);
        } catch (err) { next(err); }
    }

    updateMe = async (req, res, next) => {
        try {
            const { fullName } = req.body || {};
            const avatarUrl = req.thumbnailUrl || null;

            const user = await this.userService.updateProfile(req.user.id, {
                fullName,
                avatarUrl,
            });
            return response.success(res, user, 'Cập nhật thông tin thành công');
        } catch (err) { next(err); }
    }

    changePassword = async (req, res, next) => {
        try {
            const { currentPassword, newPassword } = req.body || {};
            if (!currentPassword || !newPassword) {
                return response.error(res, 'Vui lòng nhập đầy đủ thông tin', 400);
            }
            if (newPassword.length < 8) {
                return response.error(res, 'Mật khẩu mới phải có ít nhất 8 ký tự', 400);
            }
            if (currentPassword === newPassword) {
                return response.error(res, 'Mật khẩu mới phải khác mật khẩu cũ', 400);
            }

            await this.userService.changePassword(req.user.id, currentPassword, newPassword);
            return response.success(res, null, 'Đổi mật khẩu thành công');
        } catch (err) { next(err); }
    }

    getMyArticles = async (req, res, next) => {
        try {
            const { status, page = 1, limit = 10 } = req.query;
            const articles = await this.articleService.getMyArticles(
                req.user.id, { status, page, limit }
            );
            return response.success(res, articles);
        } catch (err) { next(err); }
    }

    deleteAccount = async (req, res, next) => {
        try {
            const { password, confirmation } = req.body || {};
            if (!password) return response.error(res, 'Vui lòng cung cấp password để xác nhận', 400);
            if (confirmation !== 'DELETE_MY_ACCOUNT') {
                return response.error(res, 'Vui lòng gửi confirmation: "DELETE_MY_ACCOUNT"', 400);
            }
            await this.userService.deleteAccount(req.user.id, password);
            return response.success(res, null, 'Tài khoản đã được xóa vĩnh viễn');
        } catch (err) { next(err); }
    }
}

module.exports = ProfileController;