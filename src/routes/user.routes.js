const express = require('express');
const UserRepository = require('../repositories/postgres/UserRepository');
const UserService = require('../services/user/UserService');
const UserController = require('../controllers/user/UserController');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

const router = express.Router();
const controller = new UserController(new UserService(new UserRepository()));

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Quản lý thành viên (Admin)
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Danh sách thành viên
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [admin, editor, trainer, member]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, active, inactive, rejected]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Thành công
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/bulk',
    authenticate,
    authorize('admin'),
    controller.bulk
);

router.get('/',
    authenticate,
    authorize('admin'),
    controller.getAll
);

router.get('/pending',
    authenticate,
    authorize('admin'),
    controller.getPending
);

router.get('/:id',
    authenticate,
    controller.getById
);

/**
 * @swagger
 * /api/users/{id}/approve:
 *   patch:
 *     summary: Phê duyệt tài khoản
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Phê duyệt thành công
 *
 * /api/users/{id}/reject:
 *   patch:
 *     summary: Từ chối tài khoản
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Từ chối thành công
 *
 * /api/users/{id}/role:
 *   patch:
 *     summary: Cập nhật role
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [editor, trainer, member]
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *
 * /api/users/{id}/lock:
 *   patch:
 *     summary: Khóa tài khoản
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Đã khóa tài khoản
 *
 * /api/users/{id}/unlock:
 *   patch:
 *     summary: Mở khóa tài khoản
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Đã mở khóa tài khoản
 */
router.patch('/:id/approve',
    authenticate,
    authorize('admin'),
    controller.approve
);

router.patch('/:id/reject',
    authenticate,
    authorize('admin'),
    controller.reject
);

router.patch('/:id/role',
    authenticate,
    authorize('admin'),
    controller.updateRole
);

router.patch('/:id/lock',
    authenticate,
    authorize('admin'),
    controller.lock
);

router.patch('/:id/unlock',
    authenticate,
    authorize('admin'),
    controller.unlock
);

module.exports = router;