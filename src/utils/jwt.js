const jwt = require('jsonwebtoken');
const { jwt: jwtConfig } = require('../config/env');

const generateTokens = (payload) => {
    const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
        expiresIn: process.env.JWT_ACCESS_EXPIRES_IN,
    });

    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
    });

    return { accessToken, refreshToken };
};

const verifyToken = (token) => {
    try {
        return jwt.verify(token, jwtConfig.secret);
    } catch (err) {
        return null;
    }
};

module.exports = { generateToken, verifyToken };