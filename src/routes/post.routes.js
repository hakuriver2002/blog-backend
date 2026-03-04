const express = require('express');
const { authenticate } = require('../middlewares/auth.middleware');
const {
    getAllPosts,
    getPostBySlug,
    createPost,
    updatePost,
    deletePost
} = require('../controllers/post.controller');

const router = express.Router();

// Public routes
router.get('/', getAllPosts);
router.get('/:slug', getPostBySlug);

// Protected routes
router.post('/', authenticate, createPost);
router.put('/:id', authenticate, updatePost);
router.delete('/:id', authenticate, deletePost);

module.exports = router;