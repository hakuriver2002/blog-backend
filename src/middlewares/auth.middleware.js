const { verifyAccessToken } = require('../utils/jwt');
const AppError = require('../domain/errors/AppError');
const prisma = require('../config/prisma');

const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AppError('Vui lòng đăng nhập để tiếp tục', 401);
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyAccessToken(token);
        if (!decoded) {
            throw new AppError('Token không hợp lệ hoặc đã hết hạn', 401);
        }

        // Lấy user mới nhất từ DB
        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                status: true,
            }
        });

        if (!user) throw new AppError('Tài khoản không tồn tại', 401);
        if (user.status !== 'active') throw new AppError('Tài khoản chưa được kích hoạt hoặc đã bị khóa', 403);

        req.user = user;
        next();
    } catch (err) {
        next(err);
    }
};

const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            req.user = null;
            return next();
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);
        if (!decoded) {
            req.user = null;
            return next();
        }

        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: { id: true, fullName: true, email: true, role: true, status: true }
        });

        req.user = (user && user.status === 'active') ? user : null;
        next();
    } catch (err) {
        req.user = null;
        next();
    }
};

module.exports = { authenticate, optionalAuth };