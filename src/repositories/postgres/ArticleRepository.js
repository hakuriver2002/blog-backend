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
}

module.exports = ArticleRepository;