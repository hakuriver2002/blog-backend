const response = require('../../utils/response');

class LikeController {
    constructor(likeService) {
        this.service = likeService;
    }

    toggleLike = async (req, res, next) => {
        try {
            const result = await this.service.toggleLike(req.params.id, req.user.id);
            return response.success(res, result, result.liked ? 'Đã thích bài viết' : 'Đã bỏ thích');
        } catch (err) { next(err); }
    };
}

module.exports = LikeController;
