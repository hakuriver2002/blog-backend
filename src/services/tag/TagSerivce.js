const AppError = require('../../domain/errors/AppError');

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
        .trim().slice(0, 120);
};

const isValidHex = (color) => /^#[0-9A-Fa-f]{6}$/.test(color);

class TagService {
    constructor(tagRepository) {
        this.tagRepo = tagRepository;
    }

    // ── Public

    async getAll({ search, isActive, sortBy = 'popular', page = 1, limit = 20 }) {
        const l = Math.min(+limit || 20, 100);
        const offset = ((+page || 1) - 1) * l;

        const result = await this.tagRepo.findAll({
            search: search || null,
            isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
            sortBy,
            limit: l, offset,
        });

        return {
            tags: result.tags,
            pagination: { page: +page, limit: l, total: result.total, pages: Math.ceil(result.total / l) },
        };
    }

    async getBySlug(slug) {
        const tag = await this.tagRepo.findBySlug(slug);
        if (!tag) throw new AppError('Tag không tồn tại', 404);
        if (!tag.isActive) throw new AppError('Tag này không còn hoạt động', 404);
        return tag;
    }

    async getById(id) {
        const tag = await this.tagRepo.findById(id);
        if (!tag) throw new AppError('Tag không tồn tại', 404);
        return tag;
    }

    // GET /api/tags/:slug/articles — lấy bài viết theo tag
    async getArticlesByTag(slug, { page = 1, limit = 10, user }) {
        const tag = await this.tagRepo.findBySlug(slug);
        if (!tag) throw new AppError('Tag không tồn tại', 404);
        if (!tag.isActive) throw new AppError('Tag này không còn hoạt động', 404);

        const l = Math.min(+limit || 10, 50);
        const offset = ((+page || 1) - 1) * l;

        const result = await this.tagRepo.findArticlesByTag(tag.id, {
            status: 'published',
            limit: l, offset,
            userId: user?.id || null,
        });

        return {
            tag,
            articles: result.articles,
            pagination: { page: +page, limit: l, total: result.total, pages: Math.ceil(result.total / l) },
        };
    }

    // GET /api/tags/cloud — tag cloud cho sidebar
    async getTagCloud({ limit = 50 }) {
        const tags = await this.tagRepo.getTagCloud({ limit: Math.min(+limit || 50, 100) });

        // Tính weight cho font-size (1–5) dựa trên usageCount
        const counts = tags.map(t => t.usageCount);
        const max = Math.max(...counts, 1);
        const min = Math.min(...counts, 0);
        const range = max - min || 1;

        return tags.map(t => ({
            id: t.id,
            name: t.name,
            slug: t.slug,
            color: t.color,
            icon: t.icon,
            usageCount: t.usageCount,
            articleCount: t._count?.articles ?? t.usageCount,
            // weight 1-5 cho frontend render font-size tương ứng
            weight: Math.ceil(((t.usageCount - min) / range) * 4) + 1,
        }));
    }

    // GET /api/tags/suggest?q=kara — autocomplete
    async suggest(query, limit = 10) {
        if (!query?.trim()) return [];
        return this.tagRepo.suggest(query.trim(), Math.min(+limit || 10, 20));
    }

    async getStats() {
        return this.tagRepo.getStats();
    }

    // ── Admin ─────────────────────────────────────────────────────

    async create({ name, description, color, icon, isActive }, userId) {
        if (!name?.trim()) throw new AppError('Tên tag là bắt buộc', 400);
        if (name.trim().length > 100) throw new AppError('Tên tag tối đa 100 ký tự', 400);
        if (color && !isValidHex(color)) throw new AppError('Color phải là mã hex hợp lệ (VD: #C0392B)', 400);

        const existing = await this.tagRepo.findByName(name.trim());
        if (existing) throw new AppError(`Tag "${name.trim()}" đã tồn tại`, 409);

        const slug = makeSlug(name.trim());

        return this.tagRepo.create({
            name: name.trim(),
            slug,
            description: description || null,
            color: color || null,
            icon: icon || null,
            isActive: isActive !== false && isActive !== 'false',
            createdById: userId,
        });
    }

    async update(id, { name, description, color, icon, isActive }) {
        const tag = await this.tagRepo.findById(id);
        if (!tag) throw new AppError('Tag không tồn tại', 404);

        const data = {};

        if (name !== undefined) {
            if (!name.trim()) throw new AppError('Tên tag không được để trống', 400);
            if (name.trim().length > 100) throw new AppError('Tên tag tối đa 100 ký tự', 400);

            // Kiểm tra duplicate tên (trừ chính nó)
            const existing = await this.tagRepo.findByName(name.trim());
            if (existing && existing.id !== id) throw new AppError(`Tag "${name.trim()}" đã tồn tại`, 409);

            data.name = name.trim();
            data.slug = makeSlug(name.trim());
        }

        if (description !== undefined) data.description = description || null;
        if (color !== undefined) {
            if (color && !isValidHex(color)) throw new AppError('Color phải là mã hex hợp lệ (VD: #C0392B)', 400);
            data.color = color || null;
        }
        if (icon !== undefined) data.icon = icon || null;
        if (isActive !== undefined) data.isActive = isActive !== false && isActive !== 'false';

        if (!Object.keys(data).length) throw new AppError('Không có thông tin để cập nhật', 400);

        return this.tagRepo.update(id, data);
    }

    async delete(id) {
        const tag = await this.tagRepo.findById(id);
        if (!tag) throw new AppError('Tag không tồn tại', 404);
        if (tag.articleCount > 0) {
            throw new AppError(
                `Không thể xóa tag đang được dùng bởi ${tag.articleCount} bài viết. Hãy dùng "Merge" để gộp vào tag khác.`,
                400
            );
        }
        await this.tagRepo.delete(id);
        return { message: `Đã xóa tag "${tag.name}"` };
    }

    async toggleActive(id) {
        const tag = await this.tagRepo.findById(id);
        if (!tag) throw new AppError('Tag không tồn tại', 404);
        return this.tagRepo.update(id, { isActive: !tag.isActive });
    }

    // Gộp 2 tags: chuyển toàn bộ articles từ source sang target rồi xóa source
    async mergeTags(sourceId, targetId) {
        if (sourceId === targetId) throw new AppError('Không thể gộp tag vào chính nó', 400);

        const [source, target] = await Promise.all([
            this.tagRepo.findById(sourceId),
            this.tagRepo.findById(targetId),
        ]);

        if (!source) throw new AppError('Tag nguồn không tồn tại', 404);
        if (!target) throw new AppError('Tag đích không tồn tại', 404);

        await this.tagRepo.mergeTags(sourceId, targetId);

        return {
            message: `Đã gộp tag "${source.name}" vào "${target.name}"`,
            targetTag: await this.tagRepo.findById(targetId),
        };
    }

    // Recalculate usage count cho tất cả tags (maintenance)
    async recalculateAll() {
        const { tags } = await this.tagRepo.findAll({ limit: 1000, offset: 0 });
        await Promise.all(tags.map(t => this.tagRepo.recalculateUsageCount(t.id)));
        return { message: `Đã recalculate ${tags.length} tags`, count: tags.length };
    }
}

module.exports = TagService;