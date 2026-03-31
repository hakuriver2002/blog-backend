# Danh sách công việc đã thực hiện (Task List)

Dưới đây là danh sách các tính năng và module backend đã được phân tích, thiết kế, triển khai cho dự án CMS Karatedo.

## 1. Core Framework & Architect
- `[x]` Thiết lập dự án Node.js / Express.
- `[x]` Thiết lập biến môi trường và xử lý tập trung (env).
- `[x]` Cấu hình Middleware quản lý lỗi tập trung (Error Handler).
- `[x]` Cấu hình và thiết lập các lớp bảo mật: Helmet, HPP, Body Sanitization, Rate Limiter (Chống Spam).
- `[x]` Tích hợp Swagger / OpenAPI tạo tài liệu kỹ thuật tự động theo thời gian thực.

## 2. Database & Data Model (Prisma ORM)
- `[x]` Khởi tạo kết nối với PostgreSQL qua Prisma.
- `[x]` Thiết kế Schema (ERD):
  - Model: User, Auth Token.
  - Model: Article (Tin tức), ArticleCategory, ArticleStatus.
  - Model: Tag, Comment, Like, Bookmark, Review (Duyệt bài).
  - Model: Thông báo (Notification).
  - Model: Điểm năng lực võ sinh (Athlete Profile, Achievement, Belt).
  - Model: Sự kiện/Giải đấu (Event, EventRegistration).

## 3. Module Identity & Authentication (Tài khoản)
- `[x]` RestAPI Đăng ký / Đăng nhập sử dụng JWT Token.
- `[x]` Tích hợp Passport.js xử lý Auth Bearer Token.
- `[x]` Phân quyền truy cập (Role-based access: Admin, Editor, Trainer, Member).
- `[x]` API Forget Password / Reset Password.

## 4. Module Content Management (Bài viết & Tin tức)
- `[x]` Quản lý bài viết (CRUD).
- `[x]` Hệ thống phân quyền duyệt bài viết (Draft -> Pending -> Published / Rejected).
- `[x]` Tương tác người dùng: Bình luận (Comment nhiều tầng), Like, Lưu trữ bài đọc (Bookmark).
- `[x]` Quản lý Nhãn (Tags).
- `[x]` Module Upload file (Hình ảnh bài viết / Ảnh đại diện).

## 5. Module Quản lý Sự kiện & Hồ sơ Võ Sinh
- `[x]` Định nghĩa API Quản lý danh mục sự kiện, cài đặt đóng/mở đăng ký tham gia.
- `[x]` API cho võ sinh đăng ký tham dự giải đấu (Event Registration).
- `[x]` API Quản lý hồ sơ vận động viên (Athlete Profile), cập nhật quá trình lên đai (Belt), danh sách thành tích (Achievement).

## 6. Báo cáo & Dashboard (Overview)
- `[x]` Xây dựng API Dashboard phục vụ biểu đồ: Tổng bài, User, Lượt truy cập, v.v.
- `[x]` Quản lý hệ thống Notification (đẩy thông báo khi bài viết được duyệt hoặc khi có comment mới).

## 7. Tài liệu, Đóng gói
- `[x]` Xuất API Swagger File JSON phục vụ cấu hình Postman/Frontend mapping.
- `[x]` Xuất Technical Document.
- `[x]` Sẵn sàng triển khai với Docker và CI/CD cơ bản (Có sẵn file chuẩn bị).

**(Xác nhận báo cáo chuẩn bị tích hợp với Frontend / UAT)**
