const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { upload } = require('../config/env');
const AppError = require('../domain/errors/AppError');

const ensureDir = (dir) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
        return cb(new AppError('Chỉ chấp nhận file ảnh JPG, PNG, WEBP', 400), false);
    }
    cb(null, true);
};

const uploader = multer({
    storage,
    fileFilter,
    limits: { fileSize: upload.maxSize },
});

const processThumbnail = async (req, res, next) => {
    if (!req.file) return next();

    try {
        const dir = path.join(process.cwd(), upload.dir, 'thumbnails');
        ensureDir(dir);

        const filename = `thumb_${uuidv4()}.webp`;
        const filepath = path.join(dir, filename);

        await sharp(req.file.buffer)
            .resize(800, 500, { fit: 'cover', position: 'centre' })
            .webp({ quality: 85 })
            .toFile(filepath);

        req.thumbnailUrl = `/uploads/thumbnails/${filename}`;
        next();
    } catch (err) {
        next(new AppError('Lỗi xử lý ảnh thumbnail', 500));
    }
};

const processImages = async (req, res, next) => {
    if (!req.files || req.files.length === 0) return next();

    try {
        const dir = path.join(process.cwd(), upload.dir, 'articles');
        ensureDir(dir);

        const imageUrls = await Promise.all(
            req.files.map(async (file) => {
                const filename = `img_${uuidv4()}.webp`;
                const filepath = path.join(dir, filename);

                await sharp(file.buffer)
                    .resize(1200, null, { fit: 'inside', withoutEnlargement: true })
                    .webp({ quality: 85 })
                    .toFile(filepath);

                return `/uploads/articles/${filename}`;
            })
        );

        req.imageUrls = imageUrls;
        next();
    } catch (err) {
        next(new AppError('Lỗi xử lý ảnh bài viết', 500));
    }
};

module.exports = {
    uploadThumbnail: [uploader.single('thumbnail'), processThumbnail],
    uploadImages: [uploader.array('images', 10), processImages],
    uploadAll: [uploader.fields([
        { name: 'thumbnail', maxCount: 1 },
        { name: 'images', maxCount: 10 },
    ])],
};