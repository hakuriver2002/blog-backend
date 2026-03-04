const express = require('express');
const UserRepository = require('../repositories/postgres/UserRepository');
const AuthService = require('../services/auth/AuthService');
const AuthController = require('../controllers/auth/AuthController');
const { authenticate } = require('../middlewares/auth.middleware');

const router = express.Router();
const controller = new AuthController(
    new AuthService(new UserRepository())
);

router.post('/register', controller.register);
router.post('/login', controller.login);
router.get('/me', authenticate, controller.getMe);

module.exports = router;