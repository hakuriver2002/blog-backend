const express = require('express');
const DashboardRepository = require('../repositories/postgres/DashboardRepository');
const DashboardService = require('../services/DashboardService');
const DashboardController = require('../controllers/DashboardController');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

const router = express.Router();
const controller = new DashboardController(
    new DashboardService(new DashboardRepository())
);

router.use(authenticate, authorize('admin', 'editor'));

router.get('/', controller.getOverview);
router.get('/stats', controller.getStats);
router.get('/analytics', controller.getAnalytics);

module.exports = router;