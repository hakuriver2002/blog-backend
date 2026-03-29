const prisma = require('../../config/prisma');

const tagSelect = {
    id: true, name: true, slug: true, description: true,
    color: true, icon: true, isActive: true, usageCount: true,
    createdAt: true, updatedAt: true,
    createdBy: { select: { id: true, fullName: true } },
};

class TagRepository {

    // ── CRUD ──────────────────────────────────────────────────────

    async findAll({ search, isActive, sortBy, limit, offset }) {
        const where = {
            ...(isActive !== undefined && { isActive }),
            ...(search && {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } },
                ],
            }),
        };

        const orderBy = {
            popular: { usageCount: 'desc' },
            name: { name: 'asc' },
            newest: { createdAt: 'desc' },
            articles: { usageCount: 'desc' },
        }[sortBy] || { usageCount: 'desc' };

        const [tags, total] = await Promise.all([
            prisma.tag.findMany({
                where,
                select: {
                    ...tagSelect,
                    _count: { select: { articles: true } },
                },
                orderBy,
                take: limit,
                skip: offset,
            }),
            prisma.tag.count({ where }),
        ]);

        return {
            tags: tags.map(t => ({
                ...t,
                articleCount: t._count.articles,
                _count: undefined,
            })),
            total,
        };
    }

    async findById(id) {
        const tag = await prisma.tag.findUnique({
            where: { id },
            select: {
                ...tagSelect,
                _count: { select: { articles: true } },
            },
        });
        if (!tag) return null;
        return { ...tag, articleCount: tag._count.articles, _count: undefined };
    }

    async findBySlug(slug) {
        const tag = await prisma.tag.findUnique({
            where: { slug },
            select: {
                ...tagSelect,
                _count: { select: { articles: true } },
            },
        });
        if (!tag) return null;
        return { ...tag, articleCount: tag._count.articles, _count: undefined };
    }

    async findByName(name) {
        return prisma.tag.findUnique({ where: { name } });
    }

    async create(data) {
        const tag = await prisma.tag.create({
            data,
            select: {
                ...tagSelect,
                _count: { select: { articles: true } },
            },
        });
        return { ...tag, articleCount: tag._count.articles, _count: undefined };
    }

    async update(id, data) {
        const tag = await prisma.tag.update({
            where: { id },
            data,
            select: {
                ...tagSelect,
                _count: { select: { articles: true } },
            },
        });
        return { ...tag, articleCount: tag._count.articles, _count: undefined };
    }

    async delete(id) {
        return prisma.tag.delete({ where: { id } });
    }

    // ── Articles by tag ───────────────────────────────────────────

    async findArticlesByTag(tagId, { status = 'published', limit, offset, userId }) {
        const where = {
            tags: { some: { tagId } },
            status,
            // Ẩn bài internal với guest
            ...(userId ? {} : { NOT: { category: 'internal' } }),
        };

        const [articles, total] = await Promise.all([
            prisma.article.findMany({
                where,
                select: {
                    id: true, title: true, slug: true, excerpt: true,
                    thumbnailUrl: true, category: true, status: true,
                    isFeatured: true, viewCount: true, publishedAt: true, createdAt: true,
                    author: { select: { id: true, fullName: true, avatarUrl: true } },
                    tags: { select: { tag: { select: { id: true, name: true, slug: true, color: true } } } },
                    _count: { select: { likes: true, comments: true } },
                },
                orderBy: { publishedAt: 'desc' },
                take: limit,
                skip: offset,
            }),
            prisma.article.count({ where }),
        ]);

        return {
            articles: articles.map(a => ({
                ...a,
                tags: a.tags?.map(at => at.tag) ?? [],
                likeCount: a._count.likes,
                commentCount: a._count.comments,
                _count: undefined,
            })),
            total,
        };
    }

    // ── Tag Cloud ─────────────────────────────────────────────────

    async getTagCloud({ limit = 50 }) {
        return prisma.tag.findMany({
            where: { isActive: true, usageCount: { gt: 0 } },
            select: {
                id: true, name: true, slug: true,
                color: true, icon: true, usageCount: true,
                _count: { select: { articles: true } },
            },
            orderBy: { usageCount: 'desc' },
            take: limit,
        });
    }

    // ── Recalculate usage count ───────────────────────────────────

    async recalculateUsageCount(tagId) {
        const count = await prisma.articleTag.count({ where: { tagId } });
        return prisma.tag.update({
            where: { id: tagId },
            data: { usageCount: count },
        });
    }

    async incrementUsageCount(tagId) {
        return prisma.tag.update({
            where: { id: tagId },
            data: { usageCount: { increment: 1 } },
        });
    }

    async decrementUsageCount(tagId) {
        return prisma.tag.updateMany({
            where: { id: tagId, usageCount: { gt: 0 } },
            data: { usageCount: { decrement: 1 } },
        });
    }

    // ── Merge tags ────────────────────────────────────────────────
    // Gộp sourceTag vào targetTag: chuyển tất cả articles sang targetTag rồi xóa source

    async mergeTags(sourceId, targetId) {
        // Lấy tất cả articles dùng sourceTag nhưng chưa dùng targetTag
        const sourceArticles = await prisma.articleTag.findMany({
            where: { tagId: sourceId },
            select: { articleId: true },
        });

        const targetArticles = await prisma.articleTag.findMany({
            where: { tagId: targetId },
            select: { articleId: true },
        });

        const targetArticleIds = new Set(targetArticles.map(a => a.articleId));

        // Chỉ migrate các article chưa có targetTag
        const toMigrate = sourceArticles
            .filter(a => !targetArticleIds.has(a.articleId))
            .map(a => ({ articleId: a.articleId, tagId: targetId }));

        await prisma.$transaction([
            // Tạo relations mới cho targetTag
            ...(toMigrate.length > 0
                ? [prisma.articleTag.createMany({ data: toMigrate, skipDuplicates: true })]
                : []),
            // Xóa tất cả relations của sourceTag
            prisma.articleTag.deleteMany({ where: { tagId: sourceId } }),
            // Xóa sourceTag
            prisma.tag.delete({ where: { id: sourceId } }),
        ]);

        // Recalculate target
        await this.recalculateUsageCount(targetId);
    }

    // ── Stats ─────────────────────────────────────────────────────

    async getStats() {
        const [total, active, unused, topTags] = await Promise.all([
            prisma.tag.count(),
            prisma.tag.count({ where: { isActive: true } }),
            prisma.tag.count({ where: { usageCount: 0 } }),
            prisma.tag.findMany({
                where: { isActive: true },
                select: { id: true, name: true, slug: true, color: true, usageCount: true },
                orderBy: { usageCount: 'desc' },
                take: 10,
            }),
        ]);

        return { total, active, inactive: total - active, unused, topTags };
    }

    // ── Suggest tags (autocomplete) ───────────────────────────────

    async suggest(query, limit = 10) {
        return prisma.tag.findMany({
            where: {
                isActive: true,
                name: { contains: query, mode: 'insensitive' },
            },
            select: { id: true, name: true, slug: true, color: true, icon: true, usageCount: true },
            orderBy: { usageCount: 'desc' },
            take: limit,
        });
    }
}

module.exports = TagRepository;