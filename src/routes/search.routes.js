const express = require('express');
const SearchController = require('../controllers/SearchController');
const { optionalAuth } = require('../middlewares/auth.middleware');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const { searchLimiter } = require('../middlewares/security.middleware');

const router = express.Router();
const controller = new SearchController();

router.get('/articles', searchLimiter, optionalAuth, controller.articles);

router.get('/users',
    searchLimiter,
    authenticate,
    authorize('admin'),
    controller.users
);

module.exports = router;