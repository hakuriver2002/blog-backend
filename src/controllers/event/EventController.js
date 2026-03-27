const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const response = require('../../utils/response');
const env = require('../../config/env');

class EventController {
    constructor(eventService) {
        this.eventService = eventService;
    }

    // ── Events ────────────────────────────────────────────────────

    // GET /api/events
    getAll = async (req, res, next) => {
        try {
            const { status, category, level, city, upcoming, featured, search, page, limit } = req.query;
            const result = await this.eventService.getAll({
                status, category, level, city, upcoming, featured, search, page, limit,
                user: req.user,
            });
            return response.success(res, result);
        } catch (err) { next(err); }
    };

    // GET /api/events/calendar?year=2026&month=3
    getCalendar = async (req, res, next) => {
        try {
            const { year, month } = req.query;
            const result = await this.eventService.getCalendar({ year, month, user: req.user });
            return response.success(res, result);
        } catch (err) { next(err); }
    };

    // GET /api/events/stats
    getStats = async (req, res, next) => {
        try {
            const stats = await this.eventService.getStats();
            return response.success(res, stats);
        } catch (err) { next(err); }
    };

    // GET /api/events/:id
    getById = async (req, res, next) => {
        try {
            const event = await this.eventService.getById(req.params.id, req.user);
            return response.success(res, event);
        } catch (err) { next(err); }
    };

    // POST /api/events
    create = async (req, res, next) => {
        try {
            const thumbnailUrl = await this._processImage(req.file);
            const event = await this.eventService.create(
                { ...req.body, thumbnailUrl },
                req.user.id
            );
            return response.created(res, event, 'Tạo sự kiện thành công');
        } catch (err) { next(err); }
    };

    // PUT /api/events/:id
    update = async (req, res, next) => {
        try {
            const thumbnailUrl = req.file
                ? await this._processImage(req.file)
                : req.body.thumbnailUrl;

            const event = await this.eventService.update(
                req.params.id,
                { ...req.body, thumbnailUrl },
                req.user
            );
            return response.success(res, event, 'Cập nhật sự kiện thành công');
        } catch (err) { next(err); }
    };

    // DELETE /api/events/:id
    delete = async (req, res, next) => {
        try {
            const result = await this.eventService.delete(req.params.id, req.user);
            return response.success(res, null, result.message);
        } catch (err) { next(err); }
    };

    // PATCH /api/events/:id/publish
    publish = async (req, res, next) => {
        try {
            const event = await this.eventService.publish(req.params.id, req.user);
            return response.success(res, event, 'Đã công bố sự kiện');
        } catch (err) { next(err); }
    };

    // PATCH /api/events/:id/cancel
    cancel = async (req, res, next) => {
        try {
            const event = await this.eventService.cancel(req.params.id, req.user);
            return response.success(res, event, 'Đã hủy sự kiện');
        } catch (err) { next(err); }
    };

    // PATCH /api/events/:id/complete
    complete = async (req, res, next) => {
        try {
            const event = await this.eventService.complete(req.params.id, req.user);
            return response.success(res, event, 'Đã đánh dấu sự kiện hoàn thành');
        } catch (err) { next(err); }
    };

    // ── Registrations ─────────────────────────────────────────────

    // POST /api/events/:id/register
    register = async (req, res, next) => {
        try {
            const { division, note } = req.body || {};
            const result = await this.eventService.register(req.params.id, req.user.id, { division, note });
            return response.created(res, result, 'Đăng ký sự kiện thành công');
        } catch (err) { next(err); }
    };

    // DELETE /api/events/:id/register
    cancelRegistration = async (req, res, next) => {
        try {
            const result = await this.eventService.cancelRegistration(req.params.id, req.user.id, req.user);
            return response.success(res, null, result.message);
        } catch (err) { next(err); }
    };

    // GET /api/events/:id/registrations  (Admin/Creator)
    getRegistrations = async (req, res, next) => {
        try {
            const { status, page, limit } = req.query;
            const result = await this.eventService.getRegistrations(req.params.id, { status, page, limit }, req.user);
            return response.success(res, result);
        } catch (err) { next(err); }
    };

    // PATCH /api/events/:id/registrations/:userId  (Admin/Creator)
    updateRegistration = async (req, res, next) => {
        try {
            const { status } = req.body || {};
            if (!status) return response.error(res, 'Vui lòng cung cấp trạng thái mới', 400);
            const result = await this.eventService.updateRegistrationStatus(
                req.params.id, req.params.userId, status, req.user
            );
            return response.success(res, result, 'Cập nhật trạng thái đăng ký thành công');
        } catch (err) { next(err); }
    };

    // GET /api/profile/events  (dùng qua profile routes)
    getMyRegistrations = async (req, res, next) => {
        try {
            const { upcoming, page, limit } = req.query;
            const result = await this.eventService.getMyRegistrations(req.user.id, { upcoming, page, limit });
            return response.success(res, result);
        } catch (err) { next(err); }
    };

    // ── Private ───────────────────────────────────────────────────
    async _processImage(file) {
        if (!file) return null;
        const dir = path.join(process.cwd(), env.upload?.dir || 'public/uploads', 'events');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        const filename = `event_${uuidv4()}.webp`;
        await sharp(file.buffer)
            .resize(1200, 630, { fit: 'cover', position: 'centre' })
            .webp({ quality: 85 })
            .toFile(path.join(dir, filename));

        return `${env.appUrl}/uploads/events/${filename}`;
    }
}

module.exports = EventController;