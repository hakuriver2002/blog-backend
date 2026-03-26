const AppError = require('../../domain/errors/AppError');

const VALID_DISCIPLINES = ['kata', 'kumite', 'kata_team', 'kumite_team', 'both'];
const VALID_BELTS = ['white', 'yellow', 'orange', 'green', 'blue', 'red', 'purple', 'brown',
    'black_1dan', 'black_2dan', 'black_3dan', 'black_4dan', 'black_5dan'];
const VALID_LEVELS = ['club', 'district', 'provincial', 'national', 'regional', 'world'];
const VALID_MEDALS = ['gold', 'silver', 'bronze', 'top4', 'other'];

class AthleteService {
    constructor(athleteRepository) {
        this.athleteRepo = athleteRepository;
    }

    async getMyProfile(userId) {
        const profile = await this.athleteRepo.findProfileByUserId(userId);
        if (!profile) throw new AppError('Bạn chưa có hồ sơ VĐV. Hãy tạo hồ sơ trước.', 404);
        return profile;
    }

    async getProfileByUserId(userId, requester) {
        const profile = await this.athleteRepo.findProfileByUserId(userId);
        if (!profile) throw new AppError('Hồ sơ VĐV không tồn tại', 404);

        if (!profile.isPublic) {
            const isOwner = requester?.id === userId;
            const isAdmin = ['admin', 'editor'].includes(requester?.role);
            if (!isOwner && !isAdmin) throw new AppError('Hồ sơ này không công khai', 403);
        }

        return profile;
    }

    async getAllProfiles({ discipline, belt, club, search, page = 1, limit = 20 }) {
        if (discipline && !VALID_DISCIPLINES.includes(discipline)) {
            throw new AppError('Môn thi không hợp lệ', 400);
        }
        if (belt && !VALID_BELTS.includes(belt)) {
            throw new AppError('Đai không hợp lệ', 400);
        }

        const l = Math.min(+limit || 20, 50);
        const offset = ((+page || 1) - 1) * l;

        const result = await this.athleteRepo.findAllProfiles({
            discipline: discipline || null,
            belt: belt || null,
            club: club || null,
            search: search || null,
            isPublic: true,
            limit: l, offset,
        });

        return {
            profiles: result.profiles,
            pagination: { page: +page, limit: l, total: result.total, pages: Math.ceil(result.total / l) },
        };
    }

    async createProfile(userId, data) {
        const existing = await this.athleteRepo.findProfileByUserId(userId);
        if (existing) throw new AppError('Bạn đã có hồ sơ VĐV rồi', 409);

        this._validateProfileData(data);

        return this.athleteRepo.createProfile(userId, this._sanitizeProfileData(data));
    }

    async updateProfile(userId, data, requester) {
        const profile = await this.athleteRepo.findProfileByUserId(userId);
        if (!profile) throw new AppError('Hồ sơ VĐV không tồn tại', 404);

        const isOwner = requester.id === userId;
        const isAdmin = ['admin', 'editor'].includes(requester.role);
        if (!isOwner && !isAdmin) throw new AppError('Không có quyền chỉnh sửa hồ sơ này', 403);

        this._validateProfileData(data);

        return this.athleteRepo.updateProfile(userId, this._sanitizeProfileData(data));
    }

    async deleteProfile(userId, requester) {
        const profile = await this.athleteRepo.findProfileByUserId(userId);
        if (!profile) throw new AppError('Hồ sơ VĐV không tồn tại', 404);

        const isOwner = requester.id === userId;
        const isAdmin = requester.role === 'admin';
        if (!isOwner && !isAdmin) throw new AppError('Không có quyền xóa hồ sơ này', 403);

        await this.athleteRepo.deleteProfile(userId);
        return { message: 'Đã xóa hồ sơ VĐV' };
    }

    async getAchievements(userId, { level, medal, year, page = 1, limit = 20 }) {
        const profile = await this.athleteRepo.findProfileByUserId(userId);
        if (!profile) throw new AppError('Hồ sơ VĐV không tồn tại', 404);

        const l = Math.min(+limit || 20, 50);
        const offset = ((+page || 1) - 1) * l;

        const result = await this.athleteRepo.findAchievements(profile.id, {
            level: level || null,
            medal: medal || null,
            year: year || null,
            limit: l, offset,
        });

        return {
            achievements: result.achievements,
            pagination: { page: +page, limit: l, total: result.total, pages: Math.ceil(result.total / l) },
        };
    }

    async addAchievement(userId, data, requester) {
        const profile = await this.athleteRepo.findProfileByUserId(userId);
        if (!profile) throw new AppError('Hồ sơ VĐV không tồn tại', 404);

        const isOwner = requester.id === userId;
        const isAdmin = ['admin', 'editor'].includes(requester.role);
        if (!isOwner && !isAdmin) throw new AppError('Không có quyền thêm thành tích', 403);

        this._validateAchievementData(data);

        return this.athleteRepo.createAchievement(profile.id, this._sanitizeAchievementData(data));
    }

    async updateAchievement(achievementId, data, requester) {
        const achievement = await this.athleteRepo.findAchievementById(achievementId);
        if (!achievement) throw new AppError('Thành tích không tồn tại', 404);

        const isOwner = requester.id === achievement.athlete.userId;
        const isAdmin = ['admin', 'editor'].includes(requester.role);
        if (!isOwner && !isAdmin) throw new AppError('Không có quyền chỉnh sửa thành tích này', 403);

        this._validateAchievementData(data);

        return this.athleteRepo.updateAchievement(achievementId, this._sanitizeAchievementData(data));
    }

    async deleteAchievement(achievementId, requester) {
        const achievement = await this.athleteRepo.findAchievementById(achievementId);
        if (!achievement) throw new AppError('Thành tích không tồn tại', 404);

        const isOwner = requester.id === achievement.athlete.userId;
        const isAdmin = requester.role === 'admin';
        if (!isOwner && !isAdmin) throw new AppError('Không có quyền xóa thành tích này', 403);

        await this.athleteRepo.deleteAchievement(achievementId);
        return { message: 'Đã xóa thành tích' };
    }

    async addImages(achievementId, images, requester) {
        const achievement = await this.athleteRepo.findAchievementById(achievementId);
        if (!achievement) throw new AppError('Thành tích không tồn tại', 404);

        const isOwner = requester.id === achievement.athlete.userId;
        const isAdmin = ['admin', 'editor'].includes(requester.role);
        if (!isOwner && !isAdmin) throw new AppError('Không có quyền thêm ảnh', 403);

        if (!images?.length) throw new AppError('Vui lòng chọn ít nhất 1 ảnh', 400);

        await this.athleteRepo.addImages(achievementId, images);
        return this.athleteRepo.findAchievementById(achievementId);
    }

    async deleteImage(imageId, achievementId, requester) {
        const achievement = await this.athleteRepo.findAchievementById(achievementId);
        if (!achievement) throw new AppError('Thành tích không tồn tại', 404);

        const isOwner = requester.id === achievement.athlete.userId;
        const isAdmin = ['admin', 'editor'].includes(requester.role);
        if (!isOwner && !isAdmin) throw new AppError('Không có quyền xóa ảnh này', 403);

        await this.athleteRepo.deleteImage(imageId);
        return { message: 'Đã xóa ảnh' };
    }

    async getBeltHistory(userId) {
        const profile = await this.athleteRepo.findProfileByUserId(userId);
        if (!profile) throw new AppError('Hồ sơ VĐV không tồn tại', 404);
        return this.athleteRepo.findBeltHistory(profile.id);
    }

    async addBelt(userId, data, requester) {
        const profile = await this.athleteRepo.findProfileByUserId(userId);
        if (!profile) throw new AppError('Hồ sơ VĐV không tồn tại', 404);

        const isOwner = requester.id === userId;
        const isAdmin = ['admin', 'editor'].includes(requester.role);
        if (!isOwner && !isAdmin) throw new AppError('Không có quyền thêm thông tin đai', 403);

        if (!data.belt || !VALID_BELTS.includes(data.belt)) {
            throw new AppError('Màu đai không hợp lệ', 400);
        }
        if (!data.achievedAt) throw new AppError('Vui lòng nhập ngày thăng đai', 400);

        return this.athleteRepo.addBelt(profile.id, {
            belt: data.belt,
            achievedAt: new Date(data.achievedAt),
            examiner: data.examiner || null,
            location: data.location || null,
            note: data.note || null,
        });
    }

    async deleteBelt(beltId, userId, requester) {
        const profile = await this.athleteRepo.findProfileByUserId(userId);
        if (!profile) throw new AppError('Hồ sơ VĐV không tồn tại', 404);

        const isOwner = requester.id === userId;
        const isAdmin = requester.role === 'admin';
        if (!isOwner && !isAdmin) throw new AppError('Không có quyền xóa thông tin đai', 403);

        await this.athleteRepo.deleteBelt(beltId, profile.id);
        return { message: 'Đã xóa thông tin đai' };
    }

    async getStats() {
        return this.athleteRepo.getStats();
    }

    _validateProfileData(data) {
        if (data.discipline && !VALID_DISCIPLINES.includes(data.discipline)) {
            throw new AppError('Môn thi không hợp lệ', 400);
        }
        if (data.currentBelt && !VALID_BELTS.includes(data.currentBelt)) {
            throw new AppError('Màu đai không hợp lệ', 400);
        }
        if (data.height && (data.height < 50 || data.height > 250)) {
            throw new AppError('Chiều cao không hợp lệ (50-250 cm)', 400);
        }
        if (data.weight && (data.weight < 20 || data.weight > 200)) {
            throw new AppError('Cân nặng không hợp lệ (20-200 kg)', 400);
        }
        if (data.startYear) {
            const year = +data.startYear;
            if (year < 1950 || year > new Date().getFullYear()) {
                throw new AppError('Năm bắt đầu tập không hợp lệ', 400);
            }
        }
    }

    _validateAchievementData(data) {
        if (data.level && !VALID_LEVELS.includes(data.level)) {
            throw new AppError('Cấp độ giải đấu không hợp lệ', 400);
        }
        if (data.medal && !VALID_MEDALS.includes(data.medal)) {
            throw new AppError('Loại huy chương không hợp lệ', 400);
        }
        if (data.discipline && !VALID_DISCIPLINES.includes(data.discipline)) {
            throw new AppError('Môn thi không hợp lệ', 400);
        }
        if (data.year) {
            const year = +data.year;
            if (year < 1950 || year > new Date().getFullYear() + 1) {
                throw new AppError('Năm thi đấu không hợp lệ', 400);
            }
        }
    }

    _sanitizeProfileData(data) {
        const allowed = [
            'dateOfBirth', 'gender', 'height', 'weight', 'nationality', 'hometown',
            'club', 'discipline', 'startYear', 'currentBelt', 'coachName', 'bio', 'isPublic',
        ];
        const clean = {};
        for (const key of allowed) {
            if (data[key] !== undefined) clean[key] = data[key] === '' ? null : data[key];
        }
        if (clean.height) clean.height = +clean.height;
        if (clean.weight) clean.weight = +clean.weight;
        if (clean.startYear) clean.startYear = +clean.startYear;
        if (clean.dateOfBirth && clean.dateOfBirth !== null) {
            clean.dateOfBirth = new Date(clean.dateOfBirth);
        }
        return clean;
    }

    _sanitizeAchievementData(data) {
        const allowed = [
            'tournamentName', 'discipline', 'level', 'medal', 'year',
            'location', 'weightCategory', 'kataName', 'description',
        ];
        const clean = {};
        for (const key of allowed) {
            if (data[key] !== undefined) clean[key] = data[key] === '' ? null : data[key];
        }
        if (clean.year) clean.year = +clean.year;
        return clean;
    }
}

module.exports = AthleteService;