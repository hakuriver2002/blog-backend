const express = require('express');
const passport = require('../config/passport');
const UserRepository = require('../repositories/postgres/UserRepository');
const AuthService = require('../services/auth/AuthService');
const AuthController = require('../controllers/auth/AuthController');
const OAuthController = require('../controllers/auth/OAuthController');
const { authenticate } = require('../middlewares/auth.middleware');

const router = express.Router();
const controller = new AuthController(
    new AuthService(new UserRepository())
);
const oAuthCtrl = new OAuthController();

router.post('/register', controller.register);
router.post('/login', controller.login);
router.get('/me', authenticate, controller.getMe);
router.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);
router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/auth/error', session: false }),
    oAuthCtrl.googleCallback
);

module.exports = router;