const response = require('../../utils/response');

class AuthController {
    constructor(authService) {
        this.authService = authService;
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
            return response.success(res, result, 'Đăng nhập thành công');
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
}

module.exports = AuthController;