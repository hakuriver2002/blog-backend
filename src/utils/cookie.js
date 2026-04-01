const env = require('../config/env');

const REFRESH_COOKIE_NAME = 'refreshToken';

const REFRESH_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: env.env === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/api/auth',
};

const setRefreshCookie = (res, token) => {
    res.cookie(REFRESH_COOKIE_NAME, token, REFRESH_COOKIE_OPTIONS);
};

const clearRefreshCookie = (res) => {
    res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' });
};

module.exports = { REFRESH_COOKIE_NAME, setRefreshCookie, clearRefreshCookie };