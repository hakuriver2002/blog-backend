const AppError = require('../domain/errors/AppError');
const prisma = require('../config/prisma');

const canViewArticle = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = req.user;

        const article = await prisma.article.findUnique({
            where: { id },
            select: {
                id: true,
                status: true,
                category: true,
                authorId: true,
            }
        });

        if (!article) {
            return next(new AppError('Bài viết không tồn tại', 404));
        }

        const role = user?.role;
        const isAdmin = role === 'admin';
        const isEditor = role === 'editor';
        const isOwner = user && article.authorId === user.id;

        if (isAdmin || isEditor) {
            req.article = article;
            return next();
        }

        if (article.status === 'published') {
            if (article.category === 'internal' && !user) {
                return next(new AppError('Vui lòng đăng nhập để xem nội dung này', 401));
            }
            req.article = article;
            return next();
        }

        if (article.status === 'draft' || article.status === 'rejected') {
            if (!isOwner) {
                return next(new AppError('Bài viết không tồn tại', 404));
            }
            req.article = article;
            return next();
        }

        if (article.status === 'pending') {
            if (!isOwner && role !== 'trainer') {
                return next(new AppError('Bài viết không tồn tại', 404));
            }
            req.article = article;
            return next();
        }

        return next(new AppError('Bài viết không tồn tại', 404));
    } catch (err) {
        next(err);
    }
};

const canEditArticle = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = req.user;

        const article = await prisma.article.findUnique({
            where: { id },
            select: { id: true, status: true, authorId: true }
        });

        if (!article) {
            return next(new AppError('Bài viết không tồn tại', 404));
        }

        const isAdmin = user.role === 'admin';
        const isEditor = user.role === 'editor';
        const isOwner = article.authorId === user.id;

        if (isAdmin || isEditor) return next();

        if (isOwner && ['draft', 'rejected'].includes(article.status)) {
            return next();
        }

        return next(new AppError('Không có quyền chỉnh sửa bài viết này', 403));
    } catch (err) {
        next(err);
    }
};

const canDeleteArticle = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = req.user;

        const article = await prisma.article.findUnique({
            where: { id },
            select: { id: true, status: true, authorId: true }
        });

        if (!article) {
            return next(new AppError('Bài viết không tồn tại', 404));
        }

        const isAdmin = user.role === 'admin';
        const isOwner = article.authorId === user.id;

        if (isAdmin) return next();

        if (isOwner && article.status === 'draft') return next();

        return next(new AppError('Không có quyền xóa bài viết này', 403));
    } catch (err) {
        next(err);
    }
};

module.exports = { canViewArticle, canEditArticle, canDeleteArticle };