const prisma = require('../../config/prisma');

const articleListSelect = {
    id: true, title: true, slug: true, excerpt: true,
    thumbnailUrl: true, category: true, status: true,
    isFeatured: true, viewCount: true, publishedAt: true,
    createdAt: true, updatedAt: true,
    author: { select: { id: true, fullName: true, avatarUrl: true, role: true } },
    tags: { select: { tag: { select: { id: true, name: true, slug: true } } } },
};

class ArticleRepository {

    async findAll({ status, category, authorId, search, limit, offset }) {
        const where = {
            ...(status && { status }),
            ...(category && { category }),
            ...(authorId && { authorId }),
            ...(search && {
                OR: [
                    { title: { contains: search, mode: 'insensitive' } },
                    { excerpt: { contains: search, mode: 'insensitive' } },
                ],
            }),
        };

        const [articles, total] = await Promise.all([
            prisma.article.findMany({
                where,
                select: articleListSelect,
                orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
                take: limit,
                skip: offset,
            }),
            prisma.article.count({ where }),
        ]);

        return { articles: articles.map(this._formatTags), total };
    }

    async findById(id) {
        const article = await prisma.article.findUnique({
            where: { id },
            select: { ...articleListSelect, content: true },
        });
        return article ? this._formatTags(article) : null;
    }

    async findBySlug(slug) {
        const article = await prisma.article.findUnique({
            where: { slug },
            select: { ...articleListSelect, content: true },
        });
        return article ? this._formatTags(article) : null;
    }

    async findPending({ limit, offset }) {
        const where = { status: 'pending' };
        const [articles, total] = await Promise.all([
            prisma.article.findMany({
                where,
                select: {
                    id: true, title: true, slug: true, excerpt: true,
                    thumbnailUrl: true, category: true, createdAt: true,
                    author: { select: { fullName: true, email: true } },
                },
                orderBy: { createdAt: 'asc' },
                take: limit,
                skip: offset,
            }),
            prisma.article.count({ where }),
        ]);
        return { articles, total };
    }

    async create(data) {
        const article = await prisma.article.create({
            data,
            select: { ...articleListSelect, content: true },
        });
        return this._formatTags(article);
    }

    async update(id, data) {
        const article = await prisma.article.update({
            where: { id },
            data,
            select: { ...articleListSelect, content: true },
        });
        return this._formatTags(article);
    }

    async delete(id) {
        return prisma.article.delete({ where: { id } });
    }

    async incrementViewCount(id) {
        return prisma.article.update({
            where: { id },
            data: { viewCount: { increment: 1 } },
        });
    }

    // ── Tags ─────────────────────────────────────────────────────
    async syncTags(articleId, tagNames) {
        // Lấy tags hiện tại trước khi xóa để recalculate sau
        const oldTags = await prisma.articleTag.findMany({
            where: { articleId },
            select: { tagId: true },
        });
        const oldTagIds = oldTags.map(t => t.tagId);

        // Xóa tất cả tags cũ
        await prisma.articleTag.deleteMany({ where: { articleId } });

        let newTagIds = [];
        if (tagNames?.length) {
            const tags = await Promise.all(
                tagNames.map(name => {
                    const slug = name.toLowerCase()
                        .replace(/\s+/g, '-')
                        .replace(/[^a-z0-9-]/g, '');
                    return prisma.tag.upsert({
                        where: { slug },
                        update: {},
                        create: { name, slug },
                    });
                })
            );

            await prisma.articleTag.createMany({
                data: tags.map(tag => ({ articleId, tagId: tag.id })),
                skipDuplicates: true,
            });

            newTagIds = tags.map(t => t.id);
        }

        // Recalculate usageCount cho các tags bị ảnh hưởng
        const affectedTagIds = [...new Set([...oldTagIds, ...newTagIds])];
        if (affectedTagIds.length) {
            await Promise.all(
                affectedTagIds.map(tagId =>
                    prisma.articleTag.count({ where: { tagId } }).then(count =>
                        prisma.tag.update({ where: { id: tagId }, data: { usageCount: count } })
                    )
                )
            );
        }
    }

    // ── Reviews ───────────────────────────────────────────────────
    async addReview({ articleId, reviewerId, action, note }) {
        return prisma.articleReview.create({
            data: { articleId, reviewerId, action, note },
        });
    }

    async getReviews(articleId) {
        return prisma.articleReview.findMany({
            where: { articleId },
            include: { reviewer: { select: { id: true, fullName: true } } },
            orderBy: { createdAt: 'asc' },
        });
    }

    // ── Related Articles ──────────────────────────────────────────
    /**
     * Tìm bài liên quan: ưu tiên cùng tag, fallback cùng category
     * Loại trừ bài hiện tại, chỉ lấy published
     */
    async findRelated(articleId, { category, tagIds = [], limit = 5 }) {
        // Bước 1: tìm bài cùng tag (ưu tiên cao nhất)
        let related = [];

        if (tagIds.length > 0) {
            related = await prisma.article.findMany({
                where: {
                    id: { not: articleId },
                    status: 'published',
                    tags: {
                        some: { tagId: { in: tagIds } },
                    },
                },
                select: articleListSelect,
                orderBy: { publishedAt: 'desc' },
                take: limit,
            });
        }

        // Bước 2: nếu chưa đủ → bổ sung bài cùng category
        if (related.length < limit) {
            const excludeIds = [articleId, ...related.map(a => a.id)];

            const byCategory = await prisma.article.findMany({
                where: {
                    id: { notIn: excludeIds },
                    status: 'published',
                    category,
                },
                select: articleListSelect,
                orderBy: { publishedAt: 'desc' },
                take: limit - related.length,
            });

            related = [...related, ...byCategory];
        }

        // Bước 3: nếu vẫn chưa đủ → bổ sung bài mới nhất bất kỳ
        if (related.length < limit) {
            const excludeIds = [articleId, ...related.map(a => a.id)];

            const latest = await prisma.article.findMany({
                where: {
                    id: { notIn: excludeIds },
                    status: 'published',
                },
                select: articleListSelect,
                orderBy: { publishedAt: 'desc' },
                take: limit - related.length,
            });

            related = [...related, ...latest];
        }

        return related.map(this._formatTags);
    }

    // ── Auto-save ─────────────────────────────────────────────────
    /**
     * Lưu nháp không thay đổi updatedAt (dùng raw để bypass Prisma @updatedAt)
     * Chỉ cho phép autosave khi bài ở trạng thái draft hoặc rejected
     */
    async autosave(id, { title, content, excerpt }) {
        const data = {};
        if (title !== undefined) data.title = title;
        if (content !== undefined) data.content = content;
        if (excerpt !== undefined) data.excerpt = excerpt;

        if (!Object.keys(data).length) return null;

        // Dùng $executeRaw để không trigger @updatedAt
        const setClauses = [];
        const values = [];
        let idx = 1;

        if (data.title) { setClauses.push(`title = $${idx++}`); values.push(data.title); }
        if (data.content) { setClauses.push(`content = $${idx++}`); values.push(data.content); }
        if (data.excerpt) { setClauses.push(`excerpt = $${idx++}`); values.push(data.excerpt); }

        values.push(id);

        await prisma.$executeRawUnsafe(
            `UPDATE articles SET ${setClauses.join(', ')} WHERE id = $${idx} AND status IN ('draft', 'rejected')`,
            ...values
        );

        return { savedAt: new Date().toISOString() };
    }

    // ── Bulk operations ───────────────────────────────────────────
    async bulkDelete(ids) {
        const result = await prisma.article.deleteMany({
            where: { id: { in: ids } },
        });
        return result.count;
    }

    async bulkUpdateStatus(ids, status) {
        const data = { status };
        if (status === 'published') data.publishedAt = new Date();

        const result = await prisma.article.updateMany({
            where: { id: { in: ids } },
            data,
        });
        return result.count;
    }

    // ── Helper ────────────────────────────────────────────────────
    _formatTags(article) {
        return {
            ...article,
            tags: article.tags?.map(at => at.tag) ?? [],
        };
    }
}

module.exports = ArticleRepository;