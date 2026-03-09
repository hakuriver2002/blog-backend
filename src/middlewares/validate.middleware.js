const AppError = require('../domain/errors/AppError');

// Validate email format 
const isValidEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Validate password strength
const isStrongPassword = (password) =>
    password.length >= 8;

// Validate UUID
const isValidUUID = (id) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

// Middleware validate UUID params
const validateUUID = (...params) => {
    return (req, res, next) => {
        for (const param of params) {
            const value = req.params[param];
            if (value && !isValidUUID(value)) {
                return next(new AppError(`${param} không hợp lệ`, 400));
            }
        }
        next();
    };
};

// Middleware validate register 
const validateRegister = (req, res, next) => {
    const { fullName, email, password } = req.body || {};
    const errors = [];

    if (!fullName || fullName.trim().length < 2) {
        errors.push('Họ và tên phải có ít nhất 2 ký tự');
    }
    if (!email || !isValidEmail(email)) {
        errors.push('Email không hợp lệ');
    }
    if (!password || !isStrongPassword(password)) {
        errors.push('Mật khẩu phải có ít nhất 8 ký tự');
    }

    if (errors.length > 0) {
        return next(new AppError(errors.join('. '), 400));
    }
    next();
};

// Middleware validate login 
const validateLogin = (req, res, next) => {
    const { email, password } = req.body || {};
    const errors = [];

    if (!email || !isValidEmail(email)) {
        errors.push('Email không hợp lệ');
    }
    if (!password || password.length === 0) {
        errors.push('Vui lòng nhập mật khẩu');
    }

    if (errors.length > 0) {
        return next(new AppError(errors.join('. '), 400));
    }
    next();
};

// Middleware validate article 
const validateArticle = (req, res, next) => {
    const { title, content, category } = req.body || {};
    const validCategories = ['club_news', 'events', 'regional_news', 'internal'];
    const errors = [];

    if (!title || title.trim().length < 5) {
        errors.push('Tiêu đề phải có ít nhất 5 ký tự');
    }
    if (title && title.trim().length > 300) {
        errors.push('Tiêu đề không được vượt quá 300 ký tự');
    }
    if (!content || content.trim().length < 10) {
        errors.push('Nội dung phải có ít nhất 10 ký tự');
    }
    if (!category || !validCategories.includes(category)) {
        errors.push(`Danh mục không hợp lệ. Chọn: ${validCategories.join(', ')}`);
    }

    if (errors.length > 0) {
        return next(new AppError(errors.join('. '), 400));
    }
    next();
};

module.exports = {
    validateUUID,
    validateRegister,
    validateLogin,
    validateArticle,
};