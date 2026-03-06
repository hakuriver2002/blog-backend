const response = require('../../utils/response');

class CommentController {
    constructor(commentService) {
        this.commentService = commentService;
    }

    getByArticle = async (req, res, next) => {
        try {
            const { id } = req.params;
            const { page = 1, limit = 20 } = req.query;

            const result = await this.commentService.getComments(
                id, { page, limit }, req.user
            );

            return response.success(res, {
                comments: result.comments,
                pagination: {
                    page: +page,
                    limit: +limit,
                    total: result.total,
                    pages: Math.ceil(result.total / limit),
                }
            });
        } catch (err) { next(err); }
    }

    create = async (req, res, next) => {
        try {
            const { content, parentId } = req.body || {};
            const comment = await this.commentService.createComment({
                articleId: req.params.id,
                userId: req.user.id,
                content,
                parentId,
            });
            return response.created(res, comment, 'Bình luận thành công');
        } catch (err) { next(err); }
    }

    hide = async (req, res, next) => {
        try {
            const { reason } = req.body || {};
            const comment = await this.commentService.hideComment(
                req.params.commentId,
                req.user.id,
                reason
            );
            return response.success(res, comment, 'Đã ẩn bình luận');
        } catch (err) { next(err); }
    }

    show = async (req, res, next) => {
        try {
            const comment = await this.commentService.showComment(
                req.params.commentId
            );
            return response.success(res, comment, 'Đã hiện lại bình luận');
        } catch (err) { next(err); }
    }

    remove = async (req, res, next) => {
        try {
            await this.commentService.deleteComment(
                req.params.commentId,
                req.user.id,
                req.user.role
            );
            return response.success(res, null, 'Xóa bình luận thành công');
        } catch (err) { next(err); }
    }
}

module.exports = CommentController;