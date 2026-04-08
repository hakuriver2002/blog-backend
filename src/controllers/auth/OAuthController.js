const { generateToken } = require('../../utils/jwt');
const AppError = require('../../domain/errors/AppError');
const { appUrl } = require('../../config/env');
const AuthService = require('../../services/auth/AuthService');

const authService = new AuthService();

class OAuthController {
    googleLogin = (req, res, next) => {
        next();
    }

    googleCallback = async (req, res, next) => {
        try {
            const user = req.user;
            if (!user) throw new Error('OAuth failed');

            const { accessToken, refreshToken } = await authService.handleOAuthLogin(user);

            res.cookie('accessToken', accessToken, {
                httpOnly: true,
                secure: false,
                sameSite: 'Lax',
                maxAge: 15 * 60 * 1000
            });

            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: false,
                sameSite: 'Lax',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });

            let redirectPath = '/';
            if (user.role === 'admin' || user.role === 'editor') {
                redirectPath = '/dashboard';
            }

            return res.redirect(`${appUrl}${redirectPath}`);

        } catch (err) {
            return res.redirect(`${appUrl}/auth/callback/google?error=${err.message}`);
        }
    }
}

module.exports = OAuthController;