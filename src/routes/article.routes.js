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
const { canViewArticle, canEditArticle, canDeleteArticle } = require('../middlewares/permission.middleware');
const { uploadLimiter } = require('../middlewares/security.middleware');
const { validateArticle, validateUUID } = require('../middlewares/validate.middleware');

const router = express.Router();
const articleRepo = new ArticleRepository();
const reviewRepo = new ReviewRepository();

const articleCtrl = new ArticleController(new ArticleService(articleRepo));
const reviewCtrl = new ReviewController(new ReviewService(articleRepo, reviewRepo));

/**
 * @swagger
 * tags:
 *   name: Articles
 *   description: Quản lý bài viết
 */

// Validate UUID params
router.use('/:id', validateUUID('id'));

/**
 * @swagger
 * /api/articles:
 *   get:
 *     summary: Lấy danh sách bài viết
 *     tags: [Articles]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [club_news, events, regional_news, internal]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     articles:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/Article' }
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 */
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

router.get('/:id',
    optionalAuth,
    canViewArticle,
    articleCtrl.getById
);

// CRUD Article
/**
 * @swagger
 * /api/articles:
 *   post:
 *     summary: Tạo bài viết mới
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [title, content, category]
 *             properties:
 *               title:
 *                 type: string
 *                 example: Giải đấu Karatedo 2026
 *               content:
 *                 type: string
 *               excerpt:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [club_news, events, regional_news, internal]
 *               thumbnail:
 *                 type: string
 *                 format: binary
 *               isFeatured:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/',
    authenticate,
    authorize('admin', 'editor', 'trainer'),
    uploadLimiter,
    uploadThumbnail,
    validateArticle,
    articleCtrl.create
);

/**
 * @swagger
 * /api/articles/{id}:
 *   get:
 *     summary: Xem chi tiết bài viết
 *     tags: [Articles]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Article'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 *   put:
 *     summary: Cập nhật bài viết
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:     { type: string }
 *               content:   { type: string }
 *               category:  { type: string }
 *               thumbnail: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *
 *   delete:
 *     summary: Xóa bài viết
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.put('/:id',
    authenticate,
    authorize('admin', 'editor', 'trainer'),
    canEditArticle,
    uploadThumbnail,
    articleCtrl.update
);

router.delete('/:id',
    authenticate,
    authorize('admin', 'editor', 'trainer'),
    canDeleteArticle,
    articleCtrl.remove
);

// Review Article
/**
 * @swagger
 * /api/articles/{id}/submit:
 *   patch:
 *     summary: Nộp bài chờ duyệt
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Đã nộp bài
 *
 * /api/articles/{id}/approve:
 *   patch:
 *     summary: Duyệt bài viết (Admin/Editor)
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               note: { type: string, example: Bài viết tốt! }
 *     responses:
 *       200:
 *         description: Duyệt thành công
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *
 * /api/articles/{id}/reject:
 *   patch:
 *     summary: Từ chối bài viết (Admin/Editor)
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [note]
 *             properties:
 *               note: { type: string, example: Nội dung chưa đủ chi tiết }
 *     responses:
 *       200:
 *         description: Từ chối thành công
 */
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

router.patch('/:id/autosave',
    authenticate,
    authorize('admin', 'editor', 'trainer'),
    articleCtrl.autosave
);

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