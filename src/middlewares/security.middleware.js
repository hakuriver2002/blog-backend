const rateLimit = require('express-rate-limit');
const xss = require('xss');
const hpp = require('hpp');
const helmet = require('helmet');

// Rate Limiting 

// Giới hạn chung — toàn bộ API
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 phút
    max: 200,             // 200 request / 15 phút
    message: {
        success: false,
        message: 'Quá nhiều request, vui lòng thử lại sau 15 phút',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Giới hạn nghiêm ngặt — Auth routes (chống brute force)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 phút
    max: 10,              // 10 lần đăng nhập / 15 phút
    message: {
        success: false,
        message: 'Quá nhiều lần thử, vui lòng thử lại sau 15 phút',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Không đếm request thành công
});

// Giới hạn upload
const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 giờ
    max: 50,              // 50 lần upload / giờ
    message: {
        success: false,
        message: 'Vượt quá giới hạn upload, vui lòng thử lại sau',
    },
});

// Giới hạn search
const searchLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 phút
    max: 30,         // 30 lần search / phút
    message: {
        success: false,
        message: 'Quá nhiều request tìm kiếm, vui lòng chờ một chút',
    },
});

// XSS Protection 
const xssOptions = {
    whiteList: {
        // Cho phép các tag HTML cơ bản trong content bài viết
        p: [],
        br: [],
        strong: [],
        em: [],
        u: [],
        s: [],
        h1: [],
        h2: [],
        h3: [],
        h4: [],
        ul: [],
        ol: [],
        li: [],
        blockquote: [],
        a: ['href', 'title', 'target'],
        img: ['src', 'alt', 'width', 'height'],
        table: [],
        thead: [],
        tbody: [],
        tr: [],
        th: [],
        td: [],
    },
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script', 'style'],
};

// Sanitize toàn bộ req.body
const sanitizeBody = (req, res, next) => {
    if (!req.body) return next();

    const sanitize = (obj) => {
        if (typeof obj === 'string') return xss(obj, xssOptions);
        if (Array.isArray(obj)) return obj.map(sanitize);
        if (typeof obj === 'object' && obj !== null) {
            return Object.fromEntries(
                Object.entries(obj).map(([k, v]) => [k, sanitize(v)])
            );
        }
        return obj;
    };

    req.body = sanitize(req.body);
    next();
};

// Helmet Config
const helmetConfig = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
        },
    },
    crossOriginEmbedderPolicy: false, // Tắt để load Google Fonts
});

// HPP — HTTP Parameter Pollution 
const hppConfig = hpp({
    whitelist: ['category', 'status', 'role'], // Cho phép array ở các params này
});

module.exports = {
    globalLimiter,
    authLimiter,
    uploadLimiter,
    searchLimiter,
    sanitizeBody,
    helmetConfig,
    hppConfig,
};