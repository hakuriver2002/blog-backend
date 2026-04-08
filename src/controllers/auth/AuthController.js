const response = require('../../utils/response');
const { setRefreshCookie, clearRefreshCookie, REFRESH_COOKIE_NAME } = require('../../utils/cookie');

class AuthController {
    constructor(authService, passwordService) {
        this.authService = authService;
        this.passwordService = passwordService;
    }

    register = async (req, res, next) => {
        try {
            const { fullName, email, password } = req.body;

            // Validate input cơ bản
            if (!fullName || !email || !password) {
                return response.error(res, 'Vui lòng điền đầy đủ thông tin', 400);
            }
            if (password.length < 8) {
                return response.error(res, 'Mật khẩu phải có ít nhất 8 ký tự', 400);
            }

            const user = await this.authService.register({ fullName, email, password });
            return response.created(res, user, 'Đăng ký thành công! Vui lòng chờ Admin phê duyệt.');
        } catch (err) {
            next(err);
        }
    }

    login = async (req, res, next) => {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return response.error(res, 'Vui lòng nhập email và mật khẩu', 400);
            }

            const result = await this.authService.login({ email, password });

            let redirectTo = '/';

            if (result.user.role === 'admin') {
                redirectTo = '/admin';
            }
            setRefreshCookie(res, result.refreshToken);
            return response.success(res, { ...result, redirectTo }, 'Đăng nhập thành công');
        } catch (err) {
            next(err);
        }
    }

    refresh = async (req, res, next) => {
        try {
            const oldToken = req.cookies[REFRESH_COOKIE_NAME];
            if (!oldToken) throw new AppError('Refresh token không tìm thấy', 401);

            const { accessToken, refreshToken } = await this.authService.refresh(oldToken);

            setRefreshCookie(res, refreshToken);
            return response.success(res, { accessToken }, 'Refresh token thành công');
        } catch (err) {
            next(err);
        }
    }

    getMe = async (req, res, next) => {
        try {
            return response.success(res, req.user, 'Lấy thông tin thành công');
        } catch (err) {
            next(err);
        }
    }

    logout = async (req, res, next) => {
        try {
            const result = await this.authService.logout(req.cookies[REFRESH_COOKIE_NAME]);
            clearRefreshCookie(res);
            return response.success(res, null, result.message);
        } catch (err) {
            next(err);
        }
    }

    logoutAll = async (req, res, next) => {
        try {
            const userId = req.user.id;
            const result = await this.authService.logoutAll(userId);
            clearRefreshCookie(res);
            return response.success(res, null, result.message);
        } catch (err) {
            next(err);
        }
    }

    forgotPassword = async (req, res, next) => {
        try {
            const { email } = req.body;
            if (!email) {
                return response.error(res, 'Vui lòng nhập email', 400);
            }

            await this.passwordService.forgotPassword(email);
            return response.success(
                res, null,
                'Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi.'
            );
        } catch (err) { next(err); }
    }

    resetPassword = async (req, res, next) => {
        try {
            const { token, password } = req.body;
            if (!token || !password) {
                return response.error(res, 'Thiếu token hoặc mật khẩu mới', 400);
            }
            if (password.length < 8) {
                return response.error(res, 'Mật khẩu phải có ít nhất 8 ký tự', 400);
            }

            await this.passwordService.resetPassword(token, password);
            return response.success(res, null, 'Đặt lại mật khẩu thành công!');
        } catch (err) { next(err); }
    }
}

module.exports = AuthController;