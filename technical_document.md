# Tài liệu Kỹ thuật: CMS Karatedo Backend

## 1. Tổng quan hệ thống (Overview)
Hệ thống **CMS Karatedo Backend** được xây dựng dựa trên Node.js và Express, đóng vai trò là API Server cung cấp dữ liệu cho ứng dụng Frontend (Quản lý nội dung CLB Karatedo, Sự kiện, Bài viết, Đăng ký võ sinh...).  
Kiến trúc dự án hướng đến sự rõ ràng, dễ bảo trì với các tầng Middleware, Controller, Service/Repository (truy xuất DB thông qua Prisma ORM).

## 2. Công nghệ sử dụng (Tech Stack)
- **Runtime Environment:** Node.js
- **Framework:** Express.js
- **Cơ sở dữ liệu (Database):** PostgreSQL
- **ORM:** Prisma Client
- **Authentication & Authorization:** JWT (JSON Web Token), Passport.js
- **Bảo mật (Security):** Helmet, HPP, Express Rate Limit, Cors
- **Lưu trữ file:** Hỗ trợ tính năng Upload (Multer, Cloudinary hoặc FS cục bộ)
- **Tài liệu API (API Docs):** Swagger UI (swagger-jsdoc & swagger-ui-express)

## 3. Cấu trúc thư mục (Directory Structure)
```
/
├── prisma/             # Schema & Database Migrations (schema.prisma)
├── src/                # Mã nguồn chính
│   ├── app.js          # File cấu hình Express app chính
│   ├── config/         # Các cấu hình hệ thống (env, db, passport, swagger)
│   ├── controllers/    # Tiếp nhận Request, gọi logic layer và trả về Response
│   ├── middlewares/    # Interceptors (Auth, Role, Security, Error Handle)
│   ├── routes/         # Khai báo các endpoints (API Routing)
│   ├── services/       # Xử lý Business Logic
│   ├── repositories/   # Tương tác với Database (nếu sử dụng repository pattern)
│   └── utils/          # Các hàm hỗ trợ (Helpers, Validators)
├── .env                # Biến môi trường
├── server.js           # Entry point khởi chạy HTTP Server
└── package.json        # Định nghĩa dependencies và scripts
```

## 4. Thiết kế Cơ sở dữ liệu (Database Schema)
Dựa theo `schema.prisma`, hệ thống bao gồm các Module chính:
1. **User Management:** Quản lý User (Admin, Editor, Trainer, Member) thông qua bảng `User`, `PasswordResetToken`.
2. **Article Management:** Hệ thống bài viết/tin tức với `Article`, `ArticleImage`, `Tag`, `ArticleTag`, `ArticleReview`. Hỗ trợ luồng kiểm duyệt (Review). Tương tác qua `Comment`, `ArticleLike`, `ArticleBookmark`.
3. **Notification System:** Thông báo hệ thống qua bảng `Notification` dựa trên các hành động sinh ra events.
4. **Athlete & Achievement:** Quản lý Hồ sơ võ sinh (`AthleteProfile`), Thành tích thi đấu (`Achievement`, `AchievementImage`) và lịch sử thăng đai (`Belt`).
5. **Event Management:** Quản lý sự kiện, giải đấu (`Event`) và Đăng ký tham gia (`EventRegistration`).

## 5. Middleware & Security
- **Authentication:** `authenticate` (Passport JWT) đảm bảo người dùng hợp lệ.
- **Authorization:** `authorize(...roles)` kiểm tra quyền truy cập dựa trên bảng `Role`.
- **Rate Limit:** Áp dụng `globalLimiter` và `authLimiter` để chống Brute-force/DDoS.
- **Data Sanitization:** Chống XSS, tự tạo `sanitizeBody` và dùng `hpp` (HTTP Parameter Pollution).
- **Global Error Handling:** Mọi lỗi (Sync/Async) được bắt bởi `errorMiddleware` và định dạng trả về đồng nhất.

## 6. Luồng xử lý tiêu chuẩn (Request Flow)
1. **CORS & Security:** Helmet, Rate Limit chặn các cú hít không hợp lệ.
2. **Router:** Phân luồng URL (`/api/articles`, `/api/auth`, ...).
3. **Authentication/Role Middleware:** (Tuỳ chọn) Chặn nếu API mang tính Private.
4. **Controller:** Trích xuất Req.body, Params. Gọi xuống Service/Repository.
5. **Service/Prisma:** Xử lý nghiệp vụ, đọc ghi Database.
6. **Response:** Controller nhận kết quả và bọc bởi form JSON tiêu chuẩn `({ success: true, data: ... })`.
