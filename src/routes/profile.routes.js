const express = require('express');
const UserRepository = require('../repositories/postgres/UserRepository');
const ArticleRepository = require('../repositories/postgres/ArticleRepository');
const EventRepository = require('../repositories/postgres/EventRepository');
const bookmarkRepository = require('../repositories/postgres/BookmarkRepository');
const UserService = require('../services/user/UserService');
const ArticleService = require('../services/article/ArticleService');
const bookmarkService = require('../services/article/BookmarkService');
const EventService = require('../services/event/EventService');
const ProfileController = require('../controllers/user/ProfileController');
const EventController = require('../controllers/event/EventController');
const bookmarkController = require('../controllers/article/BookmarkController');
const { authenticate } = require('../middlewares/auth.middleware');
const { uploadThumbnail } = require('../middlewares/upload.middleware');

const router = express.Router();
const profileCtrl = new ProfileController(
    new UserService(new UserRepository()),
    new ArticleService(new ArticleRepository())
);

const bookmarkCtrl = new bookmarkController(
    new bookmarkService(new bookmarkRepository())
);

const eventCtrl = new EventController(
    new EventService(new EventRepository())
);

router.use(authenticate);

router.get('/', profileCtrl.getMe);
router.put('/', uploadThumbnail, profileCtrl.updateMe);
router.patch('/change-password', profileCtrl.changePassword);
router.delete('/', profileCtrl.deleteAccount);
router.get('/articles', profileCtrl.getMyArticles);
router.get('/bookmarks', bookmarkCtrl.getBookmarks);

router.get('/events', eventCtrl.getMyRegistrations);
module.exports = router;