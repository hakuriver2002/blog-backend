const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const response = require('../../utils/response');
const env = require('../../config/env');

class AthleteController {
    constructor(athleteService) {
        this.athleteService = athleteService;
    }

    // GET /api/athletes
    getAll = async (req, res, next) => {
        try {
            const { discipline, belt, club, search, page, limit } = req.query;
            const result = await this.athleteService.getAllProfiles({
                discipline, belt, club, search, page, limit,
            });
            return response.success(res, result);
        } catch (err) { next(err); }
    };

    // GET /api/athletes/:userId
    getByUserId = async (req, res, next) => {
        try {
            const profile = await this.athleteService.getProfileByUserId(
                req.params.userId, req.user
            );
            return response.success(res, profile);
        } catch (err) { next(err); }
    };

    // GET /api/athletes/me
    getMe = async (req, res, next) => {
        try {
            const profile = await this.athleteService.getMyProfile(req.user.id);
            return response.success(res, profile);
        } catch (err) { next(err); }
    };

    // POST /api/athletes
    createProfile = async (req, res, next) => {
        try {
            const profile = await this.athleteService.createProfile(req.user.id, req.body);
            return response.created(res, profile, 'Tạo hồ sơ VĐV thành công');
        } catch (err) { next(err); }
    };

    // PUT /api/athletes/:userId
    updateProfile = async (req, res, next) => {
        try {
            const profile = await this.athleteService.updateProfile(
                req.params.userId, req.body, req.user
            );
            return response.success(res, profile, 'Cập nhật hồ sơ thành công');
        } catch (err) { next(err); }
    };

    // DELETE /api/athletes/:userId
    deleteProfile = async (req, res, next) => {
        try {
            const result = await this.athleteService.deleteProfile(req.params.userId, req.user);
            return response.success(res, null, result.message);
        } catch (err) { next(err); }
    };

    // GET /api/athletes/:userId/achievements
    getAchievements = async (req, res, next) => {
        try {
            const { level, medal, year, page, limit } = req.query;
            const result = await this.athleteService.getAchievements(req.params.userId, {
                level, medal, year, page, limit,
            });
            return response.success(res, result);
        } catch (err) { next(err); }
    };

    // POST /api/athletes/:userId/achievements
    addAchievement = async (req, res, next) => {
        try {
            const achievement = await this.athleteService.addAchievement(
                req.params.userId, req.body, req.user
            );
            return response.created(res, achievement, 'Thêm thành tích thành công');
        } catch (err) { next(err); }
    };

    // PUT /api/achievements/:id
    updateAchievement = async (req, res, next) => {
        try {
            const achievement = await this.athleteService.updateAchievement(
                req.params.id, req.body, req.user
            );
            return response.success(res, achievement, 'Cập nhật thành tích thành công');
        } catch (err) { next(err); }
    };

    // DELETE /api/achievements/:id
    deleteAchievement = async (req, res, next) => {
        try {
            const result = await this.athleteService.deleteAchievement(req.params.id, req.user);
            return response.success(res, null, result.message);
        } catch (err) { next(err); }
    };

    // POST /api/achievements/:id/images
    uploadImages = async (req, res, next) => {
        try {
            if (!req.files?.length) {
                return response.error(res, 'Vui lòng chọn ít nhất 1 ảnh', 400);
            }

            // Process + save images
            const dir = path.join(process.cwd(), env.upload?.dir || 'public/uploads', 'achievements');
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

            const images = await Promise.all(
                req.files.map(async (file, idx) => {
                    const filename = `achievement_${uuidv4()}.webp`;
                    await sharp(file.buffer)
                        .resize(1200, null, { fit: 'inside', withoutEnlargement: true })
                        .webp({ quality: 85 })
                        .toFile(path.join(dir, filename));

                    return {
                        url: `${env.appUrl}/uploads/achievements/${filename}`,
                        caption: req.body[`caption_${idx}`] || null,
                        sortOrder: idx,
                    };
                })
            );

            const achievement = await this.athleteService.addImages(req.params.id, images, req.user);
            return response.success(res, achievement, 'Upload ảnh thành công');
        } catch (err) { next(err); }
    };

    // DELETE /api/achievements/:id/images/:imageId
    deleteImage = async (req, res, next) => {
        try {
            const result = await this.athleteService.deleteImage(
                req.params.imageId, req.params.id, req.user
            );
            return response.success(res, null, result.message);
        } catch (err) { next(err); }
    };

    // GET /api/athletes/:userId/belts
    getBelts = async (req, res, next) => {
        try {
            const belts = await this.athleteService.getBeltHistory(req.params.userId);
            return response.success(res, belts);
        } catch (err) { next(err); }
    };

    // POST /api/athletes/:userId/belts
    addBelt = async (req, res, next) => {
        try {
            const belt = await this.athleteService.addBelt(req.params.userId, req.body, req.user);
            return response.created(res, belt, 'Thêm thông tin đai thành công');
        } catch (err) { next(err); }
    };

    // DELETE /api/athletes/:userId/belts/:beltId
    deleteBelt = async (req, res, next) => {
        try {
            const result = await this.athleteService.deleteBelt(
                req.params.beltId, req.params.userId, req.user
            );
            return response.success(res, null, result.message);
        } catch (err) { next(err); }
    };

    // GET /api/athletes/stats
    getStats = async (req, res, next) => {
        try {
            const stats = await this.athleteService.getStats();
            return response.success(res, stats);
        } catch (err) { next(err); }
    };
}

module.exports = AthleteController;