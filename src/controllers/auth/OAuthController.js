const { generateToken } = require('../../utils/jwt');
const AppError = require('../../domain/errors/AppError');
const { appUrl } = require('../../config/env');

class OAuthController {
    googleLogin = (req, res, next) => {
        next();
    }

    googleCallback = async (req, res, next) => {
        try {
            const user = req.user;
            if (!user) throw new AppError('Đăng nhập Google thất bại', 401);

            if (user.status === 'pending') {
                return res.redirect(
                    `${appUrl}/auth/pending?message=Tài khoản đang chờ Admin phê duyệt`
                );
            }
            if (user.status === 'inactive') {
                return res.redirect(
                    `${appUrl}/auth/error?message=Tài khoản đã bị khóa`
                );
            }
            if (user.status === 'rejected') {
                return res.redirect(
                    `${appUrl}/auth/error?message=Tài khoản đã bị từ chối`
                );
            }

            const token = generateToken({
                id: user.id,
                email: user.email,
                role: user.role,
            });

            return res.redirect(`${appUrl}/auth/callback?token=${token}`);
        } catch (err) {
            next(err);
        }
    }
}

module.exports = OAuthController;