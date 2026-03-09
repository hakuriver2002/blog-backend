const { searchArticles, searchUsers } = require('../utils/search');
const response = require('../utils/response');

class SearchController {

    articles = async (req, res, next) => {
        try {
            const {
                q,
                category,
                page = 1,
                limit = 10,
            } = req.query;

            if (!q || q.trim().length < 2) {
                return response.error(
                    res,
                    'Từ khóa tìm kiếm phải có ít nhất 2 ký tự',
                    400
                );
            }

            const result = await searchArticles({
                query: q.trim(),
                category,
                page: +page,
                limit: +limit,
                isAuthenticated: !!req.user,
            });

            return response.success(res, {
                query: q.trim(),
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

    users = async (req, res, next) => {
        try {
            const {
                q,
                role,
                status,
                page = 1,
                limit = 20,
            } = req.query;

            const result = await searchUsers({
                query: q?.trim(),
                role,
                status,
                page: +page,
                limit: +limit,
            });

            return response.success(res, {
                query: q?.trim(),
                users: result.users,
                pagination: {
                    page: +page,
                    limit: +limit,
                    total: result.total,
                    pages: Math.ceil(result.total / limit),
                }
            });
        } catch (err) { next(err); }
    }
}

module.exports = SearchController;