const prisma = require('../lib/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');


// Validation schema
const registerSchema = z.object({
    email: z.string().email("Email không hợp lệ"),
    password: z.string().min(6, "Mật khẩu phải ít nhất 6 ký tự"),
    name: z.string().min(2, "Tên phải ít nhất 2 ký tự"),
});

const loginSchema = z.object({
    email: z.string().email("Email không hợp lệ"),
    password: z.string().min(1, "Mật khẩu không được để trống"),
});

const register = async (req, res) => {
    try {
        const { email, password, name } = registerSchema.parse(req.body);

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "Email đã tồn tại" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: { email, password: hashedPassword, name },
            select: { id: true, email: true, name: true, role: true }
        });

        res.status(201).json({
            success: true,
            message: "Đăng ký thành công",
            user
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ success: false, errors: error.errors });
        }
        console.error(error);
        res.status(500).json({ success: false, message: "Lỗi server" });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = loginSchema.parse(req.body);

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ success: false, message: "Email hoặc mật khẩu không đúng" });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ success: false, message: "Email hoặc mật khẩu không đúng" });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            message: "Đăng nhập thành công",
            token,
            user: { id: user.id, email: user.email, name: user.name, role: user.role }
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ success: false, errors: error.errors });
        }
        console.error(error);
        res.status(500).json({ success: false, message: "Lỗi server" });
    }
};

module.exports = { register, login };