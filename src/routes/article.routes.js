const express = require('express');
const ArticleRepository = require('../repositories/postgres/ArticleRepository');
const ReviewRepository = require('../repositories/postgres/ReviewRepository');
const ArticleService = require('../services/article/ArticleService');
const ReviewService = require('../services/article/ReviewService');
const ArticleController = require('../controllers/article/ArticleController');
const ReviewController = require('../controllers/article/ReviewController');
const { authenticate, optionalAuth } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const { uploadThumbnail } = require('../middlewares/upload.middleware');

const router = express.Router();
const articleRepo = new ArticleRepository();
const reviewRepo = new ReviewRepository();

const articleCtrl = new ArticleController(new ArticleService(articleRepo));
const reviewCtrl = new ReviewController(new ReviewService(articleRepo, reviewRepo));

router.get('/', optionalAuth, articleCtrl.getAll);
router.get('/me', authenticate, articleCtrl.getMyArticles);

// Pending list for Admin/Editor
router.get('/pending',
    authenticate,
    authorize('admin', 'editor'),
    reviewCtrl.getPending
);

router.get('/:id/reviews',
    authenticate,
    authorize('admin', 'editor'),
    reviewCtrl.getHistory
);

router.get('/:id', optionalAuth, articleCtrl.getById);

// CRUD Article
router.post('/',
    authenticate,
    authorize('admin', 'editor', 'trainer'),
    uploadThumbnail,
    articleCtrl.create
);

router.put('/:id',
    authenticate,
    authorize('admin', 'editor', 'trainer'),
    uploadThumbnail,
    articleCtrl.update
);

router.delete('/:id',
    authenticate,
    authorize('admin', 'editor', 'trainer'),
    articleCtrl.remove
);

// Review Article
router.patch('/:id/submit',
    authenticate,
    authorize('admin', 'editor', 'trainer'),
    reviewCtrl.submit
);

router.patch('/:id/approve',
    authenticate,
    authorize('admin', 'editor'),
    reviewCtrl.approve
);

router.patch('/:id/reject',
    authenticate,
    authorize('admin', 'editor'),
    reviewCtrl.reject
);

module.exports = router;