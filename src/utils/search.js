const prisma = require('../config/prisma');

const searchArticles = async ({
    query,
    category,
    page = 1,
    limit = 10,
    isAuthenticated = false,
}) => {
    const skip = (page - 1) * limit;

    const where = {
        status: 'published',
        ...(!isAuthenticated && {
            NOT: { category: 'internal' }
        }),
        ...(category && { category }),
        ...(query && {
            OR: [
                { title: { contains: query, mode: 'insensitive' } },
                { excerpt: { contains: query, mode: 'insensitive' } },
                { content: { contains: query, mode: 'insensitive' } },
            ]
        }),
    };

    const [articles, total] = await Promise.all([
        prisma.article.findMany({
            where,
            skip,
            take: limit,
            orderBy: { publishedAt: 'desc' },
            select: {
                id: true,
                title: true,
                slug: true,
                excerpt: true,
                thumbnailUrl: true,
                category: true,
                viewCount: true,
                publishedAt: true,
                author: { select: { id: true, fullName: true } },
            }
        }),
        prisma.article.count({ where }),
    ]);

    const highlighted = query
        ? articles.map(a => ({
            ...a,
            titleHighlighted: highlight(a.title, query),
            excerptHighlighted: highlight(a.excerpt, query),
        }))
        : articles;

    return { articles: highlighted, total };
};

const highlight = (text, query) => {
    if (!text || !query) return text;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
};

const searchUsers = async ({ query, role, status, page = 1, limit = 20 }) => {
    const skip = (page - 1) * limit;
    const where = {
        ...(role && { role }),
        ...(status && { status }),
        ...(query && {
            OR: [
                { fullName: { contains: query, mode: 'insensitive' } },
                { email: { contains: query, mode: 'insensitive' } },
            ]
        }),
    };

    const [users, total] = await Promise.all([
        prisma.user.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                status: true,
                avatarUrl: true,
                createdAt: true,
            }
        }),
        prisma.user.count({ where }),
    ]);

    return { users, total };
};

module.exports = { searchArticles, searchUsers };