const express = require('express');
const router = express.Router();
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const AppError = require('../domain/errors/AppError');
const response = require('../utils/response');
const env = require('../config/env');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowed.includes(file.mimetype)) {
            return cb(new AppError('Chỉ chấp nhận file ảnh JPG, PNG, WEBP, GIF', 400), false);
        }
        cb(null, true);
    },
});

router.post(
    '/image',
    authenticate,
    authorize('admin', 'editor', 'trainer'),
    upload.single('image'),
    async (req, res, next) => {
        try {
            if (!req.file) return response.error(res, 'Vui lòng chọn file ảnh', 400);

            const dir = path.join(process.cwd(), env.upload?.dir || 'public/uploads', 'inline');
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

            const filename = `inline_${uuidv4()}.webp`;
            const filepath = path.join(dir, filename);

            if (req.file.mimetype === 'image/gif') {
                fs.writeFileSync(filepath.replace('.webp', '.gif'), req.file.buffer);
                const url = `${env.appUrl}/uploads/inline/${filename.replace('.webp', '.gif')}`;
                return response.success(res, { url }, 'Upload ảnh thành công');
            }

            await sharp(req.file.buffer)
                .resize(1200, null, { fit: 'inside', withoutEnlargement: true })
                .webp({ quality: 85 })
                .toFile(filepath);

            const url = `${env.appUrl}/uploads/inline/${filename}`;
            return response.success(res, { url }, 'Upload ảnh thành công');
        } catch (err) { next(err); }
    }
);

router.post(
    '/avatar',
    authenticate,
    upload.single('avatar'),
    async (req, res, next) => {
        try {
            if (!req.file) return response.error(res, 'Vui lòng chọn file ảnh', 400);

            const dir = path.join(process.cwd(), env.upload?.dir || 'public/uploads', 'avatars');
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

            const filename = `avatar_${uuidv4()}.webp`;
            const filepath = path.join(dir, filename);

            await sharp(req.file.buffer)
                .resize(300, 300, { fit: 'cover', position: 'centre' })
                .webp({ quality: 90 })
                .toFile(filepath);

            const url = `${env.appUrl}/uploads/avatars/${filename}`;
            return response.success(res, { url }, 'Upload avatar thành công');
        } catch (err) { next(err); }
    }
);

module.exports = router;