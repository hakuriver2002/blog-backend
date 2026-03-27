const express = require('express');
const multer = require('multer');
const EventRepository = require('../repositories/postgres/EventRepository');
const EventService = require('../services/event/EventService');
const EventController = require('../controllers/event/EventController');
const { authenticate, optionalAuth } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const AppError = require('../domain/errors/AppError');

const router = express.Router();
const controller = new EventController(
    new EventService(new EventRepository())
);

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
            return cb(new AppError('Chỉ chấp nhận JPG, PNG, WEBP', 400), false);
        }
        cb(null, true);
    },
});

// ════════════════════════════════════════════════════════════════
// PUBLIC / OPTIONAL AUTH
// ════════════════════════════════════════════════════════════════

// GET /api/events              — danh sách sự kiện
// GET /api/events/calendar     — calendar view theo tháng
// GET /api/events/stats        — thống kê (admin/editor)
// GET /api/events/:id          — chi tiết sự kiện

// QUAN TRỌNG: /calendar và /stats phải đặt TRƯỚC /:id
router.get('/calendar', optionalAuth, controller.getCalendar);

router.get('/stats',
    authenticate,
    authorize('admin', 'editor'),
    controller.getStats
);

router.get('/', optionalAuth, controller.getAll);

router.get('/:id', optionalAuth, controller.getById);

// ════════════════════════════════════════════════════════════════
// PROTECTED — Tạo / Cập nhật / Xóa
// ════════════════════════════════════════════════════════════════

// POST /api/events             — tạo sự kiện (Admin/Editor)
router.post('/',
    authenticate,
    authorize('admin', 'editor'),
    upload.single('thumbnail'),
    controller.create
);

// PUT /api/events/:id          — cập nhật sự kiện
router.put('/:id',
    authenticate,
    authorize('admin', 'editor'),
    upload.single('thumbnail'),
    controller.update
);

// DELETE /api/events/:id       — xóa sự kiện
router.delete('/:id',
    authenticate,
    authorize('admin', 'editor'),
    controller.delete
);

// ════════════════════════════════════════════════════════════════
// WORKFLOW — Thay đổi trạng thái
// ════════════════════════════════════════════════════════════════

// PATCH /api/events/:id/publish   — công bố sự kiện
router.patch('/:id/publish',
    authenticate,
    authorize('admin', 'editor'),
    controller.publish
);

// PATCH /api/events/:id/cancel    — hủy sự kiện
router.patch('/:id/cancel',
    authenticate,
    controller.cancel
);

// PATCH /api/events/:id/complete  — đánh dấu hoàn thành
router.patch('/:id/complete',
    authenticate,
    authorize('admin', 'editor'),
    controller.complete
);

// ════════════════════════════════════════════════════════════════
// REGISTRATIONS
// ════════════════════════════════════════════════════════════════

// POST   /api/events/:id/register             — đăng ký sự kiện
// DELETE /api/events/:id/register             — hủy đăng ký
// GET    /api/events/:id/registrations        — danh sách đăng ký (Admin/Creator)
// PATCH  /api/events/:id/registrations/:userId — cập nhật trạng thái đăng ký

router.post('/:id/register',
    authenticate,
    controller.register
);

router.delete('/:id/register',
    authenticate,
    controller.cancelRegistration
);

router.get('/:id/registrations',
    authenticate,
    controller.getRegistrations
);

router.patch('/:id/registrations/:userId',
    authenticate,
    controller.updateRegistration
);

module.exports = router;