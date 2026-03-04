const AppError = require('../domain/errors/AppError');

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new AppError('Vui lòng đăng nhập', 401));
        }
        if (!roles.includes(req.user.role)) {
            return next(new AppError('Bạn không có quyền thực hiện thao tác này', 403));
        }
        next();
    };
};

const authorizeOwnerOrAdmin = (getResourceUserId) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return next(new AppError('Vui lòng đăng nhập', 401));
            }
            if (req.user.role === 'admin') return next();

            const resourceUserId = await getResourceUserId(req);
            if (req.user.id !== resourceUserId) {
                return next(new AppError('Bạn không có quyền thực hiện thao tác này', 403));
            }
            next();
        } catch (err) {
            next(err);
        }
    };
};

module.exports = { authorize, authorizeOwnerOrAdmin };