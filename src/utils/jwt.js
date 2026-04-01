const jwt = require('jsonwebtoken');
const env = require('../config/env');

const generateAccessToken = (payload) =>
    jwt.sign(payload, env.accessTokenSecret, { expiresIn: env.accessTokenExpiresIn });

const generateRefreshToken = (payload) =>
    jwt.sign(payload, env.refreshTokenSecret, { expiresIn: env.refreshTokenExpiresIn });

const verifyAccessToken = (token) =>
    jwt.verify(token, env.accessTokenSecret);

const verifyRefreshToken = (token) =>
    jwt.verify(token, env.refreshTokenSecret);

module.exports = { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken };