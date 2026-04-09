const response = require('../../utils/response');

class ArticleController {
    constructor(articleService) {
        this.articleService = articleService;
    }

    getAll = async (req, res, next) => {
        try {
            const { category, page = 1, limit = 10, search } = req.query;
            const isAuthenticated = !!req.user;

            const result = await this.articleService.getArticles({
                category, page, limit, search, isAuthenticated
            });

            return response.success(res, {
                articles: result.articles,
                pagination: {
                    page: +page,
                    limit: +limit,
                    total: result.total,
                    totalPages: Math.ceil(result.total / limit),
                }
            });
        } catch (err) { next(err); }
    }

    getById = async (req, res, next) => {
        try {
            const article = await this.articleService.getArticleById(
                req.params.id,
                !!req.user,
                req.article
            );
            return response.success(res, article);
        } catch (err) { next(err); }
    }

    create = async (req, res, next) => {
        try {
            const article = await this.articleService.createArticle(
                {
                    ...req.body,
                    thumbnailUrl: req.thumbnailUrl || null,
                    imageUrls: req.imageUrls || [],
                },
                req.user.id
            );
            return response.created(res, article, 'Tạo bài viết thành công');
        } catch (err) { next(err); }
    }

    update = async (req, res, next) => {
        try {
            const article = await this.articleService.updateArticle(
                req.params.id,
                { ...req.body, thumbnailUrl: req.thumbnailUrl },
                req.user.id,
                req.user.role
            );
            return response.success(res, article, 'Cập nhật bài viết thành công');
        } catch (err) { next(err); }
    }

    remove = async (req, res, next) => {
        try {
            await this.articleService.deleteArticle(
                req.params.id,
                req.user.id,
                req.user.role
            );
            return response.success(res, null, 'Xóa bài viết thành công');
        } catch (err) { next(err); }
    }

    getMyArticles = async (req, res, next) => {
        try {
            const articles = await this.articleService.getMyArticles(req.user.id);
            return response.success(res, articles);
        } catch (err) { next(err); }
    }

    getRelated = async (req, res, next) => {
        try {
            const { limit } = req.query;
            const articles = await this.articleService.getRelated(req.params.id, { limit });
            return response.success(res, articles);
        } catch (err) { next(err); }
    }

    autosave = async (req, res, next) => {
        try {
            const { title, content, excerpt } = req.body || {};
            const result = await this.articleService.autosave(
                req.params.id, req.user.id, { title, content, excerpt }
            );
            return response.success(res, result, 'Đã lưu nháp tự động');
        } catch (err) { next(err); }
    }

    bulk = async (req, res, next) => {
        try {
            const { ids, action } = req.body || {};
            if (!action) return response.error(res, 'Vui lòng cung cấp action', 400);

            const result = await this.articleService.bulkAction(ids, action, req.user.role);
            return response.success(res, result, `Đã ${action} ${result.affected} bài viết`);
        } catch (err) { next(err); }
    }
}

module.exports = ArticleController;