const prisma = require('../lib/prisma');
const slugify = require('slugify');


// Get all posts (public)
const getAllPosts = async (req, res) => {
    try {
        const { page = 1, limit = 10, published } = req.query;
        const skip = (page - 1) * limit;

        const where = published === 'true' ? { published: true } : {};

        const [posts, total] = await Promise.all([
            prisma.post.findMany({
                where,
                skip: parseInt(skip),
                take: parseInt(limit),
                include: {
                    author: { select: { name: true, email: true } },
                    categories: true,
                    tags: true
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.post.count({ where })
        ]);

        res.json({
            success: true,
            data: posts,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Lỗi server" });
    }
};

// Get post by slug (public)
const getPostBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        const post = await prisma.post.findUnique({
            where: { slug },
            include: {
                author: { select: { name: true } },
                categories: true,
                tags: true,
                comments: {
                    include: { author: { select: { name: true } } },
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!post) {
            return res.status(404).json({ success: false, message: "Không tìm thấy bài viết" });
        }

        res.json({ success: true, data: post });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Lỗi server" });
    }
};

// Create post (protected)
const createPost = async (req, res) => {
    try {
        const { title, excerpt, content, published = false, categoryIds = [], tagIds = [] } = req.body;

        const slug = slugify(title, { lower: true, strict: true });

        const post = await prisma.post.create({
            data: {
                title,
                slug,
                excerpt,
                content,
                published,
                authorId: req.user.id,
                categories: { connect: categoryIds.map(id => ({ id: parseInt(id) })) },
                tags: { connect: tagIds.map(id => ({ id: parseInt(id) })) }
            },
            include: { categories: true, tags: true }
        });

        res.status(201).json({ success: true, data: post });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Lỗi server" });
    }
};

// Update post (protected - chỉ author)
const updatePost = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, excerpt, content, published } = req.body;

        // Kiểm tra quyền
        const post = await prisma.post.findUnique({ where: { id: parseInt(id) } });
        if (!post || post.authorId !== req.user.id) {
            return res.status(403).json({ success: false, message: "Không có quyền chỉnh sửa" });
        }

        const updatedPost = await prisma.post.update({
            where: { id: parseInt(id) },
            data: { title, excerpt, content, published, slug: title ? slugify(title, { lower: true, strict: true }) : undefined }
        });

        res.json({ success: true, data: updatedPost });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Lỗi server" });
    }
};

// Delete post (protected)
const deletePost = async (req, res) => {
    try {
        const { id } = req.params;

        const post = await prisma.post.findUnique({ where: { id: parseInt(id) } });
        if (!post || post.authorId !== req.user.id) {
            return res.status(403).json({ success: false, message: "Không có quyền xóa" });
        }

        await prisma.post.delete({ where: { id: parseInt(id) } });

        res.json({ success: true, message: "Xóa bài viết thành công" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Lỗi server" });
    }
};

module.exports = {
    getAllPosts,
    getPostBySlug,
    createPost,
    updatePost,
    deletePost
};