const prisma = require('../../config/prisma');
const ICommentRepository = require('../interfaces/ICommentRepository');

class CommentRepository extends ICommentRepository {

    async findByArticle(articleId, { page = 1, limit = 20, isAdmin = false }) {
        const skip = (page - 1) * limit;

        const where = {
            articleId,
            parentId: null,
            ...(!isAdmin && { status: 'visible' }),
        };

        const [comments, total] = await Promise.all([
            prisma.comment.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'asc' },
                include: {
                    user: { select: { id: true, fullName: true, avatarUrl: true } },
                    replies: {
                        where: !isAdmin ? { status: 'visible' } : {},
                        orderBy: { createdAt: 'asc' },
                        include: {
                            user: { select: { id: true, fullName: true, avatarUrl: true } }
                        }
                    }
                }
            }),
            prisma.comment.count({ where }),
        ]);

        return { comments, total };
    }

    async findById(id) {
        return await prisma.comment.findUnique({
            where: { id },
            include: { user: { select: { id: true, fullName: true } } }
        });
    }

    async create({ articleId, userId, content, parentId }) {
        return await prisma.comment.create({
            data: {
                articleId,
                userId,
                content,
                parentId: parentId || null,
                status: 'visible',
            },
            include: {
                user: { select: { id: true, fullName: true, avatarUrl: true } }
            }
        });
    }

    async hide(id, hiddenById, reason) {
        return await prisma.comment.update({
            where: { id },
            data: {
                status: 'hidden',
                hiddenById,
                hiddenAt: new Date(),
                hiddenReason: reason || null,
            }
        });
    }

    async show(id) {
        return await prisma.comment.update({
            where: { id },
            data: {
                status: 'visible',
                hiddenById: null,
                hiddenAt: null,
                hiddenReason: null,
            }
        });
    }

    async delete(id) {
        return await prisma.comment.update({
            where: { id },
            data: { status: 'deleted' }
        });
    }
}

module.exports = CommentRepository;