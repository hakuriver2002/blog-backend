const AppError = require('../../domain/errors/AppError');
const { slugifyUnique } = require('../../utils/slugify');

class ArticleService {
    constructor(articleRepository) {
        this.articleRepo = articleRepository;
    }
    async getArticles({ category, page, limit, search, isAuthenticated }) {
        const result = await this.articleRepo.findAll({
            category, page: +page, limit: +limit, search, status: 'published'
        });

        if (!isAuthenticated) {
            result.articles = result.articles.filter(a => a.category !== 'internal');
            result.total = result.articles.length;
        }

        return result;
    }
    async getArticleById(id, isAuthenticated) {
        const article = await this.articleRepo.findById(id);
        if (!article) throw new AppError('Bài viết không tồn tại', 404);

        if (article.status !== 'published') {
            throw new AppError('Bài viết không tồn tại', 404);
        }
        if (article.category === 'internal' && !isAuthenticated) {
            throw new AppError('Vui lòng đăng nhập để xem nội dung này', 401);
        }

        if (article.status === 'published') {
            await this.articleRepo.incrementViewCount(id);
        }

        return article;
    }
    async createArticle({ title, content, excerpt, category, thumbnailUrl, imageUrls, isFeatured }, authorId) {
        if (!title || !content || !category) {
            throw new AppError('Vui lòng điền đầy đủ tiêu đề, nội dung và danh mục', 400);
        }

        const validCategories = ['club_news', 'events', 'regional_news', 'internal'];
        if (!validCategories.includes(category)) {
            throw new AppError('Danh mục không hợp lệ', 400);
        }

        const slug = slugifyUnique(title);

        return await this.articleRepo.create({
            title,
            slug,
            content,
            excerpt,
            category,
            thumbnailUrl: thumbnailUrl || null,
            isFeatured: isFeatured === 'true' || isFeatured === true,
            authorId,
            status: 'draft',
            images: imageUrls || [],
        });
    }
    async updateArticle(id, data, userId, userRole) {
        const article = await this.articleRepo.findById(id);
        if (!article) throw new AppError('Bài viết không tồn tại', 404);

        const isOwner = article.authorId === userId;
        const isEditor = ['admin', 'editor'].includes(userRole);

        if (!isOwner && !isEditor) {
            throw new AppError('Không có quyền chỉnh sửa bài viết này', 403);
        }
        if (isOwner && !isEditor && !['draft', 'rejected'].includes(article.status)) {
            throw new AppError('Không thể chỉnh sửa bài viết đang chờ duyệt hoặc đã published', 403);
        }

        const updateData = {};
        if (data.title) { updateData.title = data.title; updateData.slug = slugifyUnique(data.title); }
        if (data.content) updateData.content = data.content;
        if (data.excerpt) updateData.excerpt = data.excerpt;
        if (data.category) updateData.category = data.category;
        if (data.thumbnailUrl) updateData.thumbnailUrl = data.thumbnailUrl;
        if (data.isFeatured !== undefined) updateData.isFeatured = data.isFeatured === 'true' || data.isFeatured === true;

        return await this.articleRepo.update(id, updateData);
    }
    async deleteArticle(id, userId, userRole) {
        const article = await this.articleRepo.findById(id);
        if (!article) throw new AppError('Bài viết không tồn tại', 404);

        const isOwner = article.authorId === userId;
        const isAdmin = userRole === 'admin';

        if (!isOwner && !isAdmin) {
            throw new AppError('Không có quyền xóa bài viết này', 403);
        }
        if (isOwner && !isAdmin && article.status !== 'draft') {
            throw new AppError('Chỉ có thể xóa bài viết ở trạng thái nháp', 403);
        }

        await this.articleRepo.delete(id);
    }
    async getMyArticles(authorId, { status, page = 1, limit = 10 } = {}) {
        const where = {
            authorId,
            ...(status && { status }),
        };

        const [articles, total] = await Promise.all([
            this.articleRepo.findByAuthorWithFilter(authorId, { status, page: +page, limit: +limit }),
        ]);

        return articles;
    }
}

module.exports = ArticleService;