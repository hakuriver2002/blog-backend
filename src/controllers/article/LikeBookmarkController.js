const response = require('../../utils/response');

class LikeBookmarkController {
    constructor(likeBookmarkService) {
        this.service = likeBookmarkService;
    }

    // POST /api/articles/:id/like
    toggleLike = async (req, res, next) => {
        try {
            const result = await this.service.toggleLike(req.params.id, req.user.id);
            return response.success(res, result, result.liked ? 'Đã thích bài viết' : 'Đã bỏ thích');
        } catch (err) { next(err); }
    };

    // POST /api/articles/:id/bookmark
    toggleBookmark = async (req, res, next) => {
        try {
            const result = await this.service.toggleBookmark(req.params.id, req.user.id);
            return response.success(res, result, result.bookmarked ? 'Đã lưu bài viết' : 'Đã bỏ lưu');
        } catch (err) { next(err); }
    };

    // GET /api/profile/bookmarks
    getBookmarks = async (req, res, next) => {
        try {
            const { page, limit } = req.query;
            const result = await this.service.getUserBookmarks(req.user.id, { page, limit });
            return response.success(res, result);
        } catch (err) { next(err); }
    };
}

module.exports = LikeBookmarkController;