# Backend Structure Template (Dành cho tái sử dụng)

Đây là tài liệu hướng dẫn cấu trúc dự án chuẩn để có thể sao chép và áp dụng cho các website tương tự (CMS, E-commerce, Corporate Web).

## 1. Triết lý kiến trúc (Architecture Philosophy)
Sử dụng kiến trúc chia tầng (Layered Architecture) hoặc MVC mở rộng:
- **Routes:** Chỉ định tuyến.
- **Controllers:** Chỉ xử lý Request/Response (Không chứa business logic phức tạp).
- **Services:** Chứa logic nghiệp vụ cốt lõi (Business Logic).
- **Repositories:** Lớp giao tiếp trực tiếp với ORM (Prisma/Mongoose/TypeORM).

## 2. Khởi tạo dự án mẫu (Boilerplate Structure)
Bạn có thể copy các thư mục sau cho dự án mới:

```text
new-project/
├── .env.example
├── .gitignore
├── docker-compose.yml       # Tùy chọn cho DB local
├── package.json
├── prisma/
│   └── schema.prisma        # Sửa lại Entity phù hợp nghiệp vụ
└── src/
    ├── app.js               # Sao chép nguyên tệp
    ├── server.js            # Sao chép nguyên tệp
    ├── config/
    │   ├── env.js           # Validate cấu hình môi trường
    │   ├── passport.js      # Giữ nguyên cấu hình JWT Auth
    │   └── swagger.js       # Thay đổi metadata info
    ├── middlewares/         
    │   ├── auth.middleware.js # Giữ nguyên phân quyền
    │   ├── error.middleware.js# Xử lý lỗi tập trung
    │   └── security.middleware.js
    ├── utils/
        ├── response.js      # Định dạng HTTP Response
        └── logger.js        # File log (Winston/Pino)
```

## 3. Các bước thiết lập Backend mới
1. **Init Dự án:** `npm init -y` hoặc copy `package.json` cài lại các package (`express, prisma, cors, dotenv, jsonwebtoken, passport, ...`).
2. **Thiết kế DB:** Định nghĩa vào `prisma/schema.prisma`.
3. **Migration DB:** `npx prisma migrate dev --name init`.
4. **Viết CRUD cơ bản:** 
   - Tạo File Route: `src/routes/item.routes.js`
   - Tạo File Controller: `src/controllers/item.controller.js`
   - Nhúng Route vào `src/app.js` (`app.use('/api/items', itemRoutes)`)
5. **Swagger Documentation:** Gắn JSDoc vào trên các hàm Route để `swagger-jsdoc` tự động compile.

## 4. Lợi ích khi dùng cấu trúc này
- **Scale dễ dàng:** Tách biệt rõ Role, Router, Logic.
- **Bảo mật sẵn có:** Helmet, RateLimiter, HPP đã được nhúng từ mức App.
- **Bảo trì:** Prisma sinh ra kiểu định dạng rõ ràng (Type-safety), dễ truy vết lỗi.
