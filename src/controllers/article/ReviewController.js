const response = require('../../utils/response');

class ReviewController {
    constructor(reviewService) {
        this.reviewService = reviewService;
    }

    submit = async (req, res, next) => {
        try {
            const article = await this.reviewService.submitArticle(
                req.params.id,
                req.user.id
            );
            return response.success(res, article, 'Bài viết đã được gửi chờ duyệt');
        } catch (err) { next(err); }
    }

    approve = async (req, res, next) => {
        try {
            const note = req.body?.note || req.body?.reason || null;
            const article = await this.reviewService.approveArticle(
                req.params.id,
                req.user.id,
                note
            );
            return response.success(res, article, 'Duyệt bài viết thành công');
        } catch (err) { next(err); }
    }

    reject = async (req, res, next) => {
        try {
            const note = req.body?.reason || req.body?.note;
            const article = await this.reviewService.rejectArticle(
                req.params.id,
                req.user.id,
                note
            );
            return response.success(res, article, 'Đã từ chối bài viết');
        } catch (err) { next(err); }
    }

    getPending = async (req, res, next) => {
        try {
            const { page = 1, limit = 20 } = req.query;
            const result = await this.reviewService.getPendingArticles({ page, limit });

            return response.success(res, {
                articles: result.articles,
                pagination: {
                    page: +page,
                    limit: +limit,
                    total: result.total,
                    pages: Math.ceil(result.total / limit),
                }
            });
        } catch (err) { next(err); }
    }

    getHistory = async (req, res, next) => {
        try {
            const history = await this.reviewService.getReviewHistory(req.params.id);
            return response.success(res, history);
        } catch (err) { next(err); }
    }
}

module.exports = ReviewController;