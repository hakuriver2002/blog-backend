const response = require('../../utils/response');

class TagController {
    constructor(tagService) {
        this.tagService = tagService;
    }

    // ── Public ────────────────────────────────────────────────────

    // GET /api/tags
    getAll = async (req, res, next) => {
        try {
            const { search, isActive, sortBy, page, limit } = req.query;
            const result = await this.tagService.getAll({ search, isActive, sortBy, page, limit });
            return response.success(res, result);
        } catch (err) { next(err); }
    };

    // GET /api/tags/cloud
    getCloud = async (req, res, next) => {
        try {
            const { limit } = req.query;
            const tags = await this.tagService.getTagCloud({ limit });
            return response.success(res, tags);
        } catch (err) { next(err); }
    };

    // GET /api/tags/suggest?q=kara
    suggest = async (req, res, next) => {
        try {
            const { q, limit } = req.query;
            const tags = await this.tagService.suggest(q, limit);
            return response.success(res, tags);
        } catch (err) { next(err); }
    };

    // GET /api/tags/stats
    getStats = async (req, res, next) => {
        try {
            const stats = await this.tagService.getStats();
            return response.success(res, stats);
        } catch (err) { next(err); }
    };

    // GET /api/tags/:slug
    getBySlug = async (req, res, next) => {
        try {
            const tag = await this.tagService.getBySlug(req.params.slug);
            return response.success(res, tag);
        } catch (err) { next(err); }
    };

    // GET /api/tags/:slug/articles
    getArticles = async (req, res, next) => {
        try {
            const { page, limit } = req.query;
            const result = await this.tagService.getArticlesByTag(req.params.slug, {
                page, limit, user: req.user,
            });
            return response.success(res, result);
        } catch (err) { next(err); }
    };

    // ── Admin ─────────────────────────────────────────────────────

    // POST /api/tags
    create = async (req, res, next) => {
        try {
            const { name, description, color, icon, isActive } = req.body || {};
            const tag = await this.tagService.create({ name, description, color, icon, isActive }, req.user.id);
            return response.created(res, tag, `Đã tạo tag "${tag.name}"`);
        } catch (err) { next(err); }
    };

    // PUT /api/tags/:id
    update = async (req, res, next) => {
        try {
            const { name, description, color, icon, isActive } = req.body || {};
            const tag = await this.tagService.update(req.params.id, { name, description, color, icon, isActive });
            return response.success(res, tag, 'Cập nhật tag thành công');
        } catch (err) { next(err); }
    };

    // DELETE /api/tags/:id
    delete = async (req, res, next) => {
        try {
            const result = await this.tagService.delete(req.params.id);
            return response.success(res, null, result.message);
        } catch (err) { next(err); }
    };

    // PATCH /api/tags/:id/toggle
    toggle = async (req, res, next) => {
        try {
            const tag = await this.tagService.toggleActive(req.params.id);
            return response.success(res, tag, tag.isActive ? 'Đã kích hoạt tag' : 'Đã vô hiệu hóa tag');
        } catch (err) { next(err); }
    };

    // POST /api/tags/:id/merge
    // body: { targetId: "uuid" }
    merge = async (req, res, next) => {
        try {
            const { targetId } = req.body || {};
            if (!targetId) return response.error(res, 'Vui lòng cung cấp targetId', 400);
            const result = await this.tagService.mergeTags(req.params.id, targetId);
            return response.success(res, result.targetTag, result.message);
        } catch (err) { next(err); }
    };

    // POST /api/tags/recalculate — maintenance endpoint
    recalculate = async (req, res, next) => {
        try {
            const result = await this.tagService.recalculateAll();
            return response.success(res, null, result.message);
        } catch (err) { next(err); }
    };
}

module.exports = TagController;