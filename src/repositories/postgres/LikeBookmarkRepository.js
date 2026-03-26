const prisma = require('../../config/prisma');

class LikeBookmarkRepository {

    // ── Like ──────────────────────────────────────────────────────

    async findLike(articleId, userId) {
        return prisma.articleLike.findUnique({
            where: { articleId_userId: { articleId, userId } },
        });
    }

    async addLike(articleId, userId) {
        return prisma.articleLike.create({
            data: { articleId, userId },
        });
    }

    async removeLike(articleId, userId) {
        return prisma.articleLike.delete({
            where: { articleId_userId: { articleId, userId } },
        });
    }

    async getLikeCount(articleId) {
        return prisma.articleLike.count({ where: { articleId } });
    }

    // ── Bookmark ──────────────────────────────────────────────────

    async findBookmark(articleId, userId) {
        return prisma.articleBookmark.findUnique({
            where: { articleId_userId: { articleId, userId } },
        });
    }

    async addBookmark(articleId, userId) {
        return prisma.articleBookmark.create({
            data: { articleId, userId },
        });
    }

    async removeBookmark(articleId, userId) {
        return prisma.articleBookmark.delete({
            where: { articleId_userId: { articleId, userId } },
        });
    }

    async getBookmarkCount(articleId) {
        return prisma.articleBookmark.count({ where: { articleId } });
    }

    async getUserBookmarks(userId, { limit, offset }) {
        const [bookmarks, total] = await Promise.all([
            prisma.articleBookmark.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset,
                select: {
                    id: true,
                    createdAt: true,
                    article: {
                        select: {
                            id: true, title: true, slug: true, excerpt: true,
                            thumbnailUrl: true, category: true, status: true,
                            viewCount: true, publishedAt: true,
                            author: { select: { id: true, fullName: true, avatarUrl: true } },
                            tags: { select: { tag: { select: { id: true, name: true, slug: true } } } },
                            _count: { select: { likes: true, comments: true } },
                        },
                    },
                },
            }),
            prisma.articleBookmark.count({ where: { userId } }),
        ]);

        return {
            bookmarks: bookmarks.map(b => ({
                bookmarkId: b.id,
                bookmarkedAt: b.createdAt,
                ...b.article,
                tags: b.article.tags?.map(t => t.tag) ?? [],
                likeCount: b.article._count.likes,
                commentCount: b.article._count.comments,
                _count: undefined,
            })),
            total,
        };
    }
}

module.exports = LikeBookmarkRepository;