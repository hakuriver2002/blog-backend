const prisma = require('../../config/prisma');
const IArticleRepository = require('../interfaces/IArticleRepository');

class ArticleRepository extends IArticleRepository {

    async findById(id) {
        return await prisma.article.findUnique({
            where: { id },
            include: {
                author: { select: { id: true, fullName: true, avatarUrl: true } },
                images: { orderBy: { sortOrder: 'asc' } },
                tags: { include: { tag: true } },
            }
        });
    }

    async findAll({ category, status = 'published', page = 1, limit = 10, search }) {
        const skip = (page - 1) * limit;
        const where = {
            status,
            ...(category && { category }),
            ...(search && {
                title: { contains: search, mode: 'insensitive' }
            }),
        };

        const [articles, total] = await Promise.all([
            prisma.article.findMany({
                where,
                skip,
                take: limit,
                orderBy: { publishedAt: 'desc' },
                include: {
                    author: { select: { id: true, fullName: true } },
                }
            }),
            prisma.article.count({ where }),
        ]);

        return { articles, total };
    }

    async findPending({ page = 1, limit = 20 }) {
        const skip = (page - 1) * limit;
        const where = { status: 'pending' };

        const [articles, total] = await Promise.all([
            prisma.article.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'asc' },  // FIFO
                include: {
                    author: { select: { id: true, fullName: true } },
                }
            }),
            prisma.article.count({ where }),
        ]);

        return { articles, total };
    }

    async findByAuthor(authorId) {
        return await prisma.article.findMany({
            where: { authorId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async create(data) {
        const { images, ...articleData } = data;

        return await prisma.article.create({
            data: {
                ...articleData,
                ...(images && images.length > 0 && {
                    images: {
                        create: images.map((url, idx) => ({
                            imageUrl: url,
                            sortOrder: idx,
                        }))
                    }
                })
            },
            include: {
                author: { select: { id: true, fullName: true } },
                images: true,
            }
        });
    }

    async update(id, data) {
        const { images, ...articleData } = data;

        return await prisma.article.update({
            where: { id },
            data: articleData,
            include: {
                author: { select: { id: true, fullName: true } },
                images: true,
            }
        });
    }

    async delete(id) {
        return await prisma.article.delete({ where: { id } });
    }

    async incrementViewCount(id) {
        return await prisma.article.update({
            where: { id },
            data: { viewCount: { increment: 1 } },
        });
    }

    async findByAuthorWithFilter(authorId, { status, page = 1, limit = 10 }) {
        const skip = (page - 1) * limit;
        const where = {
            authorId,
            ...(status && { status }),
        };

        const [articles, total] = await Promise.all([
            prisma.article.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    category: true,
                    status: true,
                    thumbnailUrl: true,
                    viewCount: true,
                    createdAt: true,
                    publishedAt: true,
                }
            }),
            prisma.article.count({ where }),
        ]);

        return { articles, total };
    }

    async syncTags(articleId, tagNames) {
        await prisma.articleTag.deleteMany({ where: { articleId } });
        if (!tagNames?.length) return;

        const tags = await Promise.all(
            tagNames.map(name => {
                const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
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
    }

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

    _formatTags(article) {
        return {
            ...article,
            tags: article.tags?.map(at => at.tag) ?? [],
        };
    }
}

module.exports = ArticleRepository;