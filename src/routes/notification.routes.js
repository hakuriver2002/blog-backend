const express = require('express');
const NotificationRepository = require('../repositories/postgres/NotificationRepository');
const NotificationService = require('../services/NotificationService');
const NotificationController = require('../controllers/NotificationController');
const { authenticate } = require('../middlewares/auth.middleware');

const router = express.Router();
const controller = new NotificationController(
    new NotificationService(new NotificationRepository())
);

router.use(authenticate);

router.get('/', controller.getAll);
router.get('/unread-count', controller.getUnreadCount);
router.patch('/read-all', controller.markAllRead);
router.patch('/:id/read', controller.markRead);
router.delete('/:id', controller.deleteOne);

module.exports = router;