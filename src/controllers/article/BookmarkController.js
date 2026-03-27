const response = require('../../utils/response');

class BookmarkController {
    constructor(bookmarkService) {
        this.service = bookmarkService;
    }

    toggleBookmark = async (req, res, next) => {
        try {
            const result = await this.service.toggleBookmark(req.params.id, req.user.id);
            return response.success(res, result, result.bookmarked ? 'Đã lưu bài viết' : 'Đã bỏ lưu');
        } catch (err) { next(err); }
    };

    getBookmarks = async (req, res, next) => {
        try {
            const { page, limit } = req.query;
            const result = await this.service.getUserBookmarks(req.user.id, { page, limit });
            return response.success(res, result);
        } catch (err) { next(err); }
    };
}

module.exports = BookmarkController;
