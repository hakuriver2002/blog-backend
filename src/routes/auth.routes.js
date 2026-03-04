const express = require('express');
const passport = require('../config/passport');
const UserRepository = require('../repositories/postgres/UserRepository');
const TokenRepository = require('../repositories/postgres/TokenRepository');
const AuthService = require('../services/auth/AuthService');
const PasswordService = require('../services/auth/PasswordService');
const AuthController = require('../controllers/auth/AuthController');
const OAuthController = require('../controllers/auth/OAuthController');
const { authenticate } = require('../middlewares/auth.middleware');

const router = express.Router();
const controller = new AuthController(
    new AuthService(new UserRepository()),
    new PasswordService(new UserRepository(), new TokenRepository())
);
const oAuthCtrl = new OAuthController();

router.post('/register', controller.register);
router.post('/login', controller.login);
router.get('/me', authenticate, controller.getMe);
router.post('/forgot-password', controller.forgotPassword);
router.post('/reset-password', controller.resetPassword);

router.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);
router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/auth/error', session: false }),
    oAuthCtrl.googleCallback
);

module.exports = router;