const express = require('express');
const TagRepository = require('../repositories/postgres/TagRepository');
const TagService = require('../services/tag/TagService');
const TagController = require('../controllers/tag/TagController');
const { authenticate, optionalAuth } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

const router = express.Router();
const controller = new TagController(
    new TagService(new TagRepository())
);


router.get('/cloud', controller.getCloud);
router.get('/suggest', controller.suggest);

router.get('/stats',
    authenticate,
    authorize('admin', 'editor'),
    controller.getStats
);

router.get('/', controller.getAll);
router.get('/:slug', optionalAuth, controller.getBySlug);
router.get('/:slug/articles', optionalAuth, controller.getArticles);


router.post('/recalculate',
    authenticate,
    authorize('admin'),
    controller.recalculate
);

router.post('/',
    authenticate,
    authorize('admin', 'editor'),
    controller.create
);

router.put('/:id',
    authenticate,
    authorize('admin', 'editor'),
    controller.update
);

router.delete('/:id',
    authenticate,
    authorize('admin'),
    controller.delete
);

router.patch('/:id/toggle',
    authenticate,
    authorize('admin', 'editor'),
    controller.toggle
);

router.post('/:id/merge',
    authenticate,
    authorize('admin'),
    controller.merge
);

module.exports = router;