require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const errorMiddleware = require('./middlewares/error.middleware');
const passport = require('./config/passport');
const { isDev } = require('./config/env');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const { authenticate } = require('./middlewares/auth.middleware');
const { authorize } = require('./middlewares/role.middleware');

const {
    globalLimiter,
    authLimiter,
    sanitizeBody,
    helmetConfig,
    hppConfig,
} = require('./middlewares/security.middleware');

const authRoutes = require('./routes/auth.routes');
const articleRoutes = require('./routes/article.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const commentRoutes = require('./routes/comment.routes');
const userRoutes = require('./routes/user.routes');
const profileRoutes = require('./routes/profile.routes');
const searchRoutes = require('./routes/search.routes');
const notificationsRoutes = require('./routes/notification.routes');
const uploadRoutes = require('./routes/upload.routes');
const athletesRoutes = require('./routes/athlete.routes');
const achievementsRoutes = require('./routes/achievement.routes');

const app = express();

// Security
app.use(helmetConfig);
app.use(hppConfig);
app.use(globalLimiter);

app.use(cors({
    origin: isDev
        ? ['http://127.0.0.1:5500', 'http://localhost:5500']
        : process.env.ALLOWED_ORIGINS?.split(',') || [],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));

app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(sanitizeBody);
app.use(express.static(path.join(__dirname, '../public')));
app.use(passport.initialize());

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/articles/:id/comments', commentRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/athletes', athletesRoutes);
app.use('/api/achievements', achievementsRoutes);

// Swagger Docs 
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'CMS Karatedo API Docs',
    customCss: `
    .topbar { background-color: #0D1B2A !important; }
    .topbar-wrapper img { display: none; }
    .topbar-wrapper::after {
      content: 'CMS Karatedo API';
      color: white;
      font-size: 18px;
      font-weight: bold;
    }
  `,
    swaggerOptions: {
        persistAuthorization: true,
    },
}));
// Endpoint trả về JSON spec (dùng cho Postman import)
app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

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

app.get('/favicon.ico', (req, res) => res.status(204).end());

app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Không tìm thấy endpoint này' });
});

app.use(errorMiddleware);

module.exports = app;