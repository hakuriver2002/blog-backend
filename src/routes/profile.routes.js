const express = require('express');
const UserRepository = require('../repositories/postgres/UserRepository');
const ArticleRepository = require('../repositories/postgres/ArticleRepository');
const UserService = require('../services/user/UserService');
const ArticleService = require('../services/article/ArticleService');
const ProfileController = require('../controllers/user/ProfileController');
const { authenticate } = require('../middlewares/auth.middleware');
const { uploadThumbnail } = require('../middlewares/upload.middleware');

const router = express.Router();
const controller = new ProfileController(
    new UserService(new UserRepository()),
    new ArticleService(new ArticleRepository())
);

router.use(authenticate);

router.get('/', controller.getMe);
router.put('/', uploadThumbnail, controller.updateMe);
router.patch('/change-password', controller.changePassword);
router.get('/articles', controller.getMyArticles);

module.exports = router;