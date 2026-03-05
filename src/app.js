require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const errorMiddleware = require('./middlewares/error.middleware');
const passport = require('./config/passport');
const { isDev } = require('./config/env');

const { authenticate } = require('./middlewares/auth.middleware');
const { authorize } = require('./middlewares/role.middleware');

const authRoutes = require('./routes/auth.routes');
const articleRoutes = require('./routes/article.routes');

const app = express();

app.use(cors({
    origin: isDev
        ? ['http://127.0.0.1:5500', 'http://localhost:5500']
        : process.env.ALLOWED_ORIGINS?.split(',') || [],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));

app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

app.use('/api/auth', authRoutes);
app.use('/api/articles', articleRoutes);

app.get('/test/admin',
    authenticate,
    authorize('admin'),
    (req, res) => res.json({ success: true, message: `Xin chào Admin: ${req.user.fullName}` })
);

app.get('/test/editor',
    authenticate,
    authorize('admin', 'editor'),
    (req, res) => res.json({ success: true, message: `Xin chào Editor: ${req.user.fullName}` })
);


app.use(errorMiddleware);

module.exports = app;