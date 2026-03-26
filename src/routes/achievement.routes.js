const express = require('express');
const multer = require('multer');
const AthleteRepository = require('../repositories/postgres/AthleteRepository');
const AthleteService = require('../services/athlete/AthleteService');
const AthleteController = require('../controllers/athlete/AthleteController');
const { authenticate } = require('../middlewares/auth.middleware');
const AppError = require('../domain/errors/AppError');

const router = express.Router();
const controller = new AthleteController(
    new AthleteService(new AthleteRepository())
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

// PUT    /api/achievements/:id              — cập nhật thành tích
// DELETE /api/achievements/:id              — xóa thành tích
// POST   /api/achievements/:id/images       — upload ảnh minh chứng (max 10)
// DELETE /api/achievements/:id/images/:imageId — xóa ảnh

router.put('/:id',
    authenticate,
    controller.updateAchievement
);

router.delete('/:id',
    authenticate,
    controller.deleteAchievement
);

router.post('/:id/images',
    authenticate,
    upload.array('images', 10),
    controller.uploadImages
);

router.delete('/:id/images/:imageId',
    authenticate,
    controller.deleteImage
);

module.exports = router;