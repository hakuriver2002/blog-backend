const express = require('express');
const multer = require('multer');
const AthleteRepository = require('../repositories/postgres/AthleteRepository');
const AthleteService = require('../services/athlete/AthleteService');
const AthleteController = require('../controllers/athlete/AthleteController');
const { authenticate, optionalAuth } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const AppError = require('../domain/errors/AppError');

const router = express.Router();
const controller = new AthleteController(
    new AthleteService(new AthleteRepository())
);

// Multer — upload ảnh achievement (max 10 ảnh, 5MB/ảnh)
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
// ATHLETE PROFILES
// ════════════════════════════════════════════════════════════════

// GET  /api/athletes          — danh sách VĐV (public)
// GET  /api/athletes/stats    — thống kê (admin/editor)
// GET  /api/athletes/me       — hồ sơ của tôi
// GET  /api/athletes/:userId  — hồ sơ theo userId (public + optional auth)
// POST /api/athletes          — tạo hồ sơ (tự tạo)
// PUT  /api/athletes/:userId  — cập nhật hồ sơ
// DEL  /api/athletes/:userId  — xóa hồ sơ

router.get('/',
    optionalAuth,
    controller.getAll
);

// QUAN TRỌNG: /stats và /me phải đặt TRƯỚC /:userId
router.get('/stats',
    authenticate,
    authorize('admin', 'editor'),
    controller.getStats
);

router.get('/me',
    authenticate,
    controller.getMe
);

router.get('/:userId',
    optionalAuth,
    controller.getByUserId
);

router.post('/',
    authenticate,
    controller.createProfile
);

router.put('/:userId',
    authenticate,
    controller.updateProfile
);

router.delete('/:userId',
    authenticate,
    controller.deleteProfile
);

// ════════════════════════════════════════════════════════════════
// ACHIEVEMENTS (nested under athlete)
// ════════════════════════════════════════════════════════════════

// GET  /api/athletes/:userId/achievements
// POST /api/athletes/:userId/achievements

router.get('/:userId/achievements',
    optionalAuth,
    controller.getAchievements
);

router.post('/:userId/achievements',
    authenticate,
    controller.addAchievement
);

// ════════════════════════════════════════════════════════════════
// BELT HISTORY (nested under athlete)
// ════════════════════════════════════════════════════════════════

// GET  /api/athletes/:userId/belts
// POST /api/athletes/:userId/belts
// DEL  /api/athletes/:userId/belts/:beltId

router.get('/:userId/belts',
    optionalAuth,
    controller.getBelts
);

router.post('/:userId/belts',
    authenticate,
    controller.addBelt
);

router.delete('/:userId/belts/:beltId',
    authenticate,
    controller.deleteBelt
);

module.exports = router;