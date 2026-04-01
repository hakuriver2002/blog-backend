const jwt = require('jsonwebtoken');
const { jwt: jwtConfig } = require('../config/env');

const generateToken = (payload) => {
    return jwt.sign(payload, jwtConfig.secret, {
        expiresIn: jwtConfig.expiresIn,
    });
};

const verifyToken = (token) => {
    try {
        return jwt.verify(token, jwtConfig.secret);
    } catch (err) {
        return null;
    }
};

module.exports = { generateToken, verifyToken };