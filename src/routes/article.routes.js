const express = require('express');
const ArticleRepository = require('../repositories/postgres/ArticleRepository');
const ArticleService = require('../services/article/ArticleService');
const ArticleController = require('../controllers/article/ArticleController');
const { authenticate, optionalAuth } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const { uploadThumbnail } = require('../middlewares/upload.middleware');

const router = express.Router();
const controller = new ArticleController(
    new ArticleService(new ArticleRepository())
);

router.get('/', optionalAuth, controller.getAll);
router.get('/me', authenticate, controller.getMyArticles);
router.get('/:id', optionalAuth, controller.getById);

router.post('/',
    authenticate,
    authorize('admin', 'editor', 'trainer'),
    uploadThumbnail,
    controller.create
);

router.put('/:id',
    authenticate,
    authorize('admin', 'editor', 'trainer'),
    uploadThumbnail,
    controller.update
);

router.delete('/:id',
    authenticate,
    authorize('admin', 'editor', 'trainer'),
    controller.remove
);

module.exports = router;