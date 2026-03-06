const express = require('express');
const CommentRepository = require('../repositories/postgres/CommentRepository');
const ArticleRepository = require('../repositories/postgres/ArticleRepository');
const CommentService = require('../services/comment/CommentService');
const CommentController = require('../controllers/comment/CommentController');
const { authenticate, optionalAuth } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

const router = express.Router({ mergeParams: true });
const controller = new CommentController(
    new CommentService(new CommentRepository(), new ArticleRepository())
);

router.get('/', optionalAuth, controller.getByArticle);
router.post('/', authenticate, controller.create);

router.patch('/:commentId/hide',
    authenticate,
    authorize('admin', 'editor'),
    controller.hide
);

router.patch('/:commentId/show',
    authenticate,
    authorize('admin', 'editor'),
    controller.show
);

router.delete('/:commentId',
    authenticate,
    controller.remove
);

module.exports = router;