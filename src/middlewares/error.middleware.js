const AppError = require('../domain/errors/AppError');

const errorMiddleware = (err, req, res, next) => {
    // Error normal
    if (err.isOperational) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
        });
    }

    // Error Prisma — record not found
    if (err.code === 'P2025') {
        return res.status(404).json({
            success: false,
            message: 'Không tìm thấy dữ liệu',
        });
    }

    // Error Prisma — unique constraint
    if (err.code === 'P2002') {
        return res.status(400).json({
            success: false,
            message: `Dữ liệu đã tồn tại: ${err.meta?.target?.join(', ')}`,
        });
    }

    // Unexpected Error
    console.error('Unexpected Error:', err);
    return res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống, vui lòng thử lại sau',
    });
};

module.exports = errorMiddleware;