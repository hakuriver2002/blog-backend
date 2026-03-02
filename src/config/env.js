require('dotenv').config();

const required = ['DATABASE_URL', 'JWT_SECRET'];
required.forEach(key => {
    if (!process.env[key]) throw new Error(`Thiếu biến môi trường: ${key}`);
});

module.exports = {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT) || 3000,
    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    },
    google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackUrl: process.env.GOOGLE_CALLBACK_URL,
    },
    mail: {
        host: process.env.MAIL_HOST,
        port: parseInt(process.env.MAIL_PORT) || 587,
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    },
    upload: {
        dir: process.env.UPLOAD_DIR || 'public/uploads',
        maxSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880,
    },
    appUrl: process.env.APP_URL || 'http://localhost:3000',
};
