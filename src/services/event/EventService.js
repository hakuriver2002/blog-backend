const AppError = require('../../domain/errors/AppError');

const VALID_CATEGORIES = ['tournament', 'training', 'seminar', 'grading', 'friendly', 'other'];
const VALID_LEVELS = ['club', 'district', 'provincial', 'national', 'international'];
const VALID_STATUSES = ['draft', 'published', 'cancelled', 'completed'];

// Tạo slug từ tiếng Việt
const makeSlug = (text) => {
    const map = {
        à: 'a', á: 'a', ả: 'a', ã: 'a', ạ: 'a', ă: 'a', ắ: 'a', ặ: 'a', ằ: 'a', ẳ: 'a', ẵ: 'a',
        â: 'a', ấ: 'a', ầ: 'a', ẩ: 'a', ẫ: 'a', ậ: 'a', è: 'e', é: 'e', ẻ: 'e', ẽ: 'e', ẹ: 'e',
        ê: 'e', ế: 'e', ề: 'e', ể: 'e', ễ: 'e', ệ: 'e', ì: 'i', í: 'i', ỉ: 'i', ĩ: 'i', ị: 'i',
        ò: 'o', ó: 'o', ỏ: 'o', õ: 'o', ọ: 'o', ô: 'o', ố: 'o', ồ: 'o', ổ: 'o', ỗ: 'o', ộ: 'o',
        ơ: 'o', ớ: 'o', ờ: 'o', ở: 'o', ỡ: 'o', ợ: 'o', ù: 'u', ú: 'u', ủ: 'u', ũ: 'u', ụ: 'u',
        ư: 'u', ứ: 'u', ừ: 'u', ử: 'u', ữ: 'u', ự: 'u', ỳ: 'y', ý: 'y', ỷ: 'y', ỹ: 'y', ỵ: 'y', đ: 'd',
    };
    return text.toLowerCase()
        .split('').map(c => map[c] || c).join('')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 300);
};

class EventService {
    constructor(eventRepository) {
        this.eventRepo = eventRepository;
    }

    // ── Events ────────────────────────────────────────────────────

    async getAll({ status, category, level, city, upcoming, featured, search, page = 1, limit = 10, user }) {
        const l = Math.min(+limit || 10, 50);
        const offset = ((+page || 1) - 1) * l;

        // Guest chỉ thấy published + public
        const isAdminOrEditor = user && ['admin', 'editor'].includes(user.role);
        const resolvedStatus = (status && isAdminOrEditor) ? status : 'published';

        const result = await this.eventRepo.findAll({
            status: resolvedStatus,
            category: category || null,
            level: level || null,
            city: city || null,
            upcoming: upcoming === 'true' || upcoming === true || undefined,
            featured: featured === 'true' || featured === true || undefined,
            search: search || null,
            isPublic: isAdminOrEditor ? undefined : true,
            limit: l, offset,
        });

        return {
            events: result.events,
            pagination: { page: +page, limit: l, total: result.total, pages: Math.ceil(result.total / l) },
        };
    }

    async getById(id, user) {
        const event = await this.eventRepo.findById(id);
        if (!event) throw new AppError('Sự kiện không tồn tại', 404);

        // Draft chỉ admin/editor/creator mới xem được
        if (event.status === 'draft') {
            const isAdmin = user && ['admin', 'editor'].includes(user.role);
            const isCreator = user && user.id === event.createdBy.id;
            if (!isAdmin && !isCreator) throw new AppError('Sự kiện không tồn tại', 404);
        }

        // Tăng view count nếu published
        if (event.status === 'published') {
            this.eventRepo.incrementViewCount(id).catch(() => { });
        }

        return event;
    }

    // Calendar view — GET /api/events/calendar?year=2026&month=3
    async getCalendar({ year, month, user }) {
        const y = +year || new Date().getFullYear();
        const m = +month || new Date().getMonth() + 1;

        if (m < 1 || m > 12) throw new AppError('Tháng không hợp lệ (1-12)', 400);
        if (y < 2000 || y > 2100) throw new AppError('Năm không hợp lệ', 400);

        const isAdminOrEditor = user && ['admin', 'editor'].includes(user.role);
        const events = await this.eventRepo.findByMonth({
            year: y, month: m,
            isPublic: isAdminOrEditor ? undefined : true,
        });

        // Group theo ngày để frontend render calendar dễ hơn
        const grouped = {};
        events.forEach(event => {
            const dateKey = event.startDate.toISOString().slice(0, 10);
            if (!grouped[dateKey]) grouped[dateKey] = [];
            grouped[dateKey].push(event);
        });

        return {
            year: y, month: m,
            events,          // flat list cho list view
            grouped,         // grouped by date cho calendar grid
        };
    }

    async create(data, userId) {
        this._validateRequired(data);
        this._validateData(data);

        const slug = `${makeSlug(data.title)}-${Date.now().toString(36)}`;

        return this.eventRepo.create({
            title: data.title,
            slug,
            description: data.description || null,
            thumbnailUrl: data.thumbnailUrl || null,
            category: data.category,
            level: data.level || 'club',
            status: data.status || 'draft',
            startDate: new Date(data.startDate),
            endDate: new Date(data.endDate),
            registrationDeadline: data.registrationDeadline ? new Date(data.registrationDeadline) : null,
            location: data.location,
            address: data.address || null,
            city: data.city || null,
            divisions: data.divisions ? JSON.stringify(
                Array.isArray(data.divisions) ? data.divisions : data.divisions.split(',').map(d => d.trim())
            ) : null,
            registrationUrl: data.registrationUrl || null,
            maxParticipants: data.maxParticipants ? +data.maxParticipants : null,
            fee: data.fee ? +data.fee : null,
            feeDescription: data.feeDescription || null,
            organizer: data.organizer || null,
            contactEmail: data.contactEmail || null,
            contactPhone: data.contactPhone || null,
            isPublic: data.isPublic !== false && data.isPublic !== 'false',
            isFeatured: data.isFeatured === true || data.isFeatured === 'true',
            createdById: userId,
        });
    }

    async update(id, data, user) {
        const event = await this.eventRepo.findById(id);
        if (!event) throw new AppError('Sự kiện không tồn tại', 404);

        const isAdmin = ['admin', 'editor'].includes(user.role);
        const isCreator = user.id === event.createdBy.id;
        if (!isAdmin && !isCreator) throw new AppError('Không có quyền chỉnh sửa sự kiện này', 403);

        this._validateData(data);

        const updateData = {};
        const fields = [
            'title', 'description', 'thumbnailUrl', 'category', 'level', 'status',
            'location', 'address', 'city', 'registrationUrl', 'organizer',
            'contactEmail', 'contactPhone',
        ];
        fields.forEach(f => { if (data[f] !== undefined) updateData[f] = data[f] || null; });
        if (data.title) updateData.slug = `${makeSlug(data.title)}-${Date.now().toString(36)}`;

        if (data.startDate) updateData.startDate = new Date(data.startDate);
        if (data.endDate) updateData.endDate = new Date(data.endDate);
        if (data.registrationDeadline !== undefined) {
            updateData.registrationDeadline = data.registrationDeadline ? new Date(data.registrationDeadline) : null;
        }
        if (data.divisions !== undefined) {
            updateData.divisions = data.divisions
                ? JSON.stringify(Array.isArray(data.divisions) ? data.divisions : data.divisions.split(',').map(d => d.trim()))
                : null;
        }
        if (data.maxParticipants !== undefined) updateData.maxParticipants = data.maxParticipants ? +data.maxParticipants : null;
        if (data.fee !== undefined) updateData.fee = data.fee ? +data.fee : null;
        if (data.isPublic !== undefined) updateData.isPublic = data.isPublic !== false && data.isPublic !== 'false';
        if (data.isFeatured !== undefined) updateData.isFeatured = data.isFeatured === true || data.isFeatured === 'true';

        return this.eventRepo.update(id, updateData);
    }

    async delete(id, user) {
        const event = await this.eventRepo.findById(id);
        if (!event) throw new AppError('Sự kiện không tồn tại', 404);

        const isAdmin = user.role === 'admin';
        const isCreator = user.id === event.createdBy.id;
        if (!isAdmin && !isCreator) throw new AppError('Không có quyền xóa sự kiện này', 403);

        await this.eventRepo.delete(id);
        return { message: 'Đã xóa sự kiện' };
    }

    async publish(id, user) {
        const event = await this.eventRepo.findById(id);
        if (!event) throw new AppError('Sự kiện không tồn tại', 404);
        if (!['admin', 'editor'].includes(user.role)) throw new AppError('Không có quyền công bố sự kiện', 403);
        if (event.status === 'published') throw new AppError('Sự kiện đã được công bố', 400);
        return this.eventRepo.update(id, { status: 'published' });
    }

    async cancel(id, user) {
        const event = await this.eventRepo.findById(id);
        if (!event) throw new AppError('Sự kiện không tồn tại', 404);
        const isAdmin = ['admin', 'editor'].includes(user.role);
        const isCreator = user.id === event.createdBy.id;
        if (!isAdmin && !isCreator) throw new AppError('Không có quyền hủy sự kiện này', 403);
        if (event.status === 'completed') throw new AppError('Không thể hủy sự kiện đã kết thúc', 400);
        return this.eventRepo.update(id, { status: 'cancelled' });
    }

    async complete(id, user) {
        const event = await this.eventRepo.findById(id);
        if (!event) throw new AppError('Sự kiện không tồn tại', 404);
        if (!['admin', 'editor'].includes(user.role)) throw new AppError('Không có quyền', 403);
        return this.eventRepo.update(id, { status: 'completed' });
    }

    async getStats() {
        return this.eventRepo.getStats();
    }

    // ── Registrations ─────────────────────────────────────────────

    async register(eventId, userId, { division, note }) {
        const event = await this.eventRepo.findById(eventId);
        if (!event) throw new AppError('Sự kiện không tồn tại', 404);
        if (event.status !== 'published') throw new AppError('Sự kiện chưa được công bố', 400);
        if (event.status === 'cancelled') throw new AppError('Sự kiện đã bị hủy', 400);

        // Kiểm tra deadline đăng ký
        if (event.registrationDeadline && new Date() > new Date(event.registrationDeadline)) {
            throw new AppError('Đã hết thời hạn đăng ký sự kiện này', 400);
        }

        // Kiểm tra số lượng
        if (event.maxParticipants) {
            const count = await this.eventRepo.countRegistrations(eventId);
            if (count >= event.maxParticipants) {
                throw new AppError('Sự kiện đã đủ số lượng đăng ký', 400);
            }
        }

        // Kiểm tra đã đăng ký chưa
        const existing = await this.eventRepo.findRegistration(eventId, userId);
        if (existing) throw new AppError('Bạn đã đăng ký sự kiện này rồi', 409);

        return this.eventRepo.createRegistration({ eventId, userId, division, note });
    }

    async cancelRegistration(eventId, userId, requester) {
        const registration = await this.eventRepo.findRegistration(eventId, userId);
        if (!registration) throw new AppError('Bạn chưa đăng ký sự kiện này', 404);

        const isAdmin = ['admin', 'editor'].includes(requester.role);
        const isOwner = requester.id === userId;
        if (!isAdmin && !isOwner) throw new AppError('Không có quyền hủy đăng ký này', 403);

        await this.eventRepo.deleteRegistration(eventId, userId);
        return { message: 'Đã hủy đăng ký' };
    }

    async getRegistrations(eventId, { status, page = 1, limit = 20 }, user) {
        const event = await this.eventRepo.findById(eventId);
        if (!event) throw new AppError('Sự kiện không tồn tại', 404);

        if (!['admin', 'editor'].includes(user.role) && user.id !== event.createdBy.id) {
            throw new AppError('Không có quyền xem danh sách đăng ký', 403);
        }

        const l = Math.min(+limit || 20, 50);
        const offset = ((+page || 1) - 1) * l;

        const result = await this.eventRepo.findRegistrations(eventId, { status: status || null, limit: l, offset });

        return {
            registrations: result.registrations,
            pagination: { page: +page, limit: l, total: result.total, pages: Math.ceil(result.total / l) },
        };
    }

    async updateRegistrationStatus(eventId, userId, status, requester) {
        const event = await this.eventRepo.findById(eventId);
        if (!event) throw new AppError('Sự kiện không tồn tại', 404);

        if (!['admin', 'editor'].includes(requester.role) && requester.id !== event.createdBy.id) {
            throw new AppError('Không có quyền cập nhật trạng thái đăng ký', 403);
        }

        const validStatuses = ['pending', 'confirmed', 'cancelled'];
        if (!validStatuses.includes(status)) throw new AppError('Trạng thái không hợp lệ', 400);

        return this.eventRepo.updateRegistrationStatus(eventId, userId, status);
    }

    async getMyRegistrations(userId, { upcoming, page = 1, limit = 10 }) {
        const l = Math.min(+limit || 10, 50);
        const offset = ((+page || 1) - 1) * l;

        const result = await this.eventRepo.findUserRegistrations(userId, {
            upcoming: upcoming === 'true',
            limit: l, offset,
        });

        return {
            registrations: result.registrations,
            pagination: { page: +page, limit: l, total: result.total, pages: Math.ceil(result.total / l) },
        };
    }

    // ── Validators ────────────────────────────────────────────────
    _validateRequired(data) {
        if (!data.title?.trim()) throw new AppError('Tên sự kiện là bắt buộc', 400);
        if (!data.category) throw new AppError('Loại sự kiện là bắt buộc', 400);
        if (!data.startDate) throw new AppError('Ngày bắt đầu là bắt buộc', 400);
        if (!data.endDate) throw new AppError('Ngày kết thúc là bắt buộc', 400);
        if (!data.location?.trim()) throw new AppError('Địa điểm là bắt buộc', 400);
    }

    _validateData(data) {
        if (data.category && !VALID_CATEGORIES.includes(data.category)) {
            throw new AppError(`Loại sự kiện không hợp lệ. Chọn: ${VALID_CATEGORIES.join(', ')}`, 400);
        }
        if (data.level && !VALID_LEVELS.includes(data.level)) {
            throw new AppError(`Cấp độ không hợp lệ. Chọn: ${VALID_LEVELS.join(', ')}`, 400);
        }
        if (data.status && !VALID_STATUSES.includes(data.status)) {
            throw new AppError(`Trạng thái không hợp lệ. Chọn: ${VALID_STATUSES.join(', ')}`, 400);
        }
        if (data.startDate && data.endDate && new Date(data.startDate) > new Date(data.endDate)) {
            throw new AppError('Ngày kết thúc phải sau ngày bắt đầu', 400);
        }
        if (data.registrationDeadline && data.startDate) {
            if (new Date(data.registrationDeadline) > new Date(data.startDate)) {
                throw new AppError('Hạn đăng ký phải trước ngày bắt đầu sự kiện', 400);
            }
        }
        if (data.maxParticipants && +data.maxParticipants < 1) {
            throw new AppError('Số lượng tối đa phải lớn hơn 0', 400);
        }
        if (data.fee && +data.fee < 0) {
            throw new AppError('Phí tham dự không được âm', 400);
        }
    }
}

module.exports = EventService;