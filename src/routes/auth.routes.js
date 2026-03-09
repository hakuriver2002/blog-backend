const express = require('express');
const passport = require('../config/passport');
const UserRepository = require('../repositories/postgres/UserRepository');
const TokenRepository = require('../repositories/postgres/TokenRepository');
const AuthService = require('../services/auth/AuthService');
const PasswordService = require('../services/auth/PasswordService');
const AuthController = require('../controllers/auth/AuthController');
const OAuthController = require('../controllers/auth/OAuthController');
const { authenticate } = require('../middlewares/auth.middleware');
const {
    authLimiter,
} = require('../middlewares/security.middleware');
const {
    validateRegister,
    validateLogin,
} = require('../middlewares/validate.middleware');

const router = express.Router();
const controller = new AuthController(
    new AuthService(new UserRepository()),
    new PasswordService(new UserRepository(), new TokenRepository())
);
const oAuthCtrl = new OAuthController();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Xác thực & phân quyền
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Đăng ký tài khoản mới
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fullName, email, password]
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: Nguyễn Văn A
 *               email:
 *                 type: string
 *                 example: nguyena@gmail.com
 *               password:
 *                 type: string
 *                 example: Password@123
 *     responses:
 *       201:
 *         description: Đăng ký thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Dữ liệu không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/register', authLimiter, validateRegister, controller.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Đăng nhập
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: admin@karatedo.vn
 *               password:
 *                 type: string
 *                 example: Admin@123
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     token: { type: string }
 *                     user:  { $ref: '#/components/schemas/User' }
 *       401:
 *         description: Sai email hoặc mật khẩu
 */
router.post('/login', authLimiter, validateLogin, controller.login);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Lấy thông tin người dùng hiện tại
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/me', authenticate, controller.getMe);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Quên mật khẩu — gửi email reset
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 example: admin@karatedo.vn
 *     responses:
 *       200:
 *         description: Email đã được gửi
 */
router.post('/forgot-password', authLimiter, controller.forgotPassword);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Đặt lại mật khẩu
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, password]
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *                 example: NewPass@456
 *     responses:
 *       200:
 *         description: Đặt lại thành công
 *       400:
 *         description: Token không hợp lệ hoặc hết hạn
 */
router.post('/reset-password', authLimiter, controller.resetPassword);

router.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);
router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/auth/error', session: false }),
    oAuthCtrl.googleCallback
);

module.exports = router;