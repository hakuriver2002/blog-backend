# CMS Karatedo API

A secure and scalable **RESTful CMS backend** built with **Node.js,
Express, Prisma, and PostgreSQL**. The system provides authentication,
role-based authorization, article management, comments, and search
features with API documentation via Swagger.

------------------------------------------------------------------------

## Features

-   Authentication (Login / Register / Password Reset / Google Auth)
-   Role-Based Access Control (Admin, Editor, User)
-   Article Management (CRUD)
-   Comment System
-   User Profile Management
-   Search Articles
-   Rate Limiting & Security Protection
-   API Documentation with Swagger
-   Structured Error Handling

------------------------------------------------------------------------

## Tech Stack

### Backend

-   Node.js
-   Express.js
-   Prisma ORM
-   PostgreSQL
-   Passport.js

### Security

-   Helmet
-   express-rate-limit
-   hpp

### Documentation

-   Swagger UI

------------------------------------------------------------------------

## Project Structure

    src
    │
    ├── config
    │   ├── prisma.js
    │   ├── passport.js
    │   ├── swagger.js
    │   └── env.js
    │
    ├── controllers
    │
    ├── middlewares
    │   ├── auth.middleware.js
    │   ├── role.middleware.js
    │   ├── security.middleware.js
    │   └── error.middleware.js
    │
    ├── repositories
    │
    ├── routes
    │   ├── auth.routes.js
    │   ├── article.routes.js
    │   ├── comment.routes.js
    │   ├── dashboard.routes.js
    │   ├── profile.routes.js
    │   ├── search.routes.js
    │   └── user.routes.js
    │
    ├── services
    │
    └── app.js

------------------------------------------------------------------------

## Installation

### 1. Clone repository

    git clone https://github.com/your-username/cms-karatedo-api.git
    cd cms-karatedo-api

### 2. Install dependencies

    npm install

### 3. Setup environment variables

Create `.env` file:

    
DATABASE_URL="postgresql://postgres:postgresPassword@localhost:5432/Database?schema=public"
JWT_SECRET=JWT_SECRET

NODE_ENV=development
PORT=3000

JWT_SECRET=JWT_SECRET_CODE
JWT_EXPIRES_IN=DATE

GOOGLE_CLIENT_ID=GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=GOOGLE_CLIENT_SECRET
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

MAIL_HOST=smtp.gmail.com
MAIL_PORT=MAIL_PORT
MAIL_USER=MAIL_USER
MAIL_PASS=MAIL_PASS

UPLOAD_DIR=public/uploads
MAX_FILE_SIZE=5242880
APP_URL=http://localhost:3000

### 4. Run Prisma migration

    npx prisma migrate dev

### 5. Start server

    npm run dev

Server runs at:

    http://localhost:3000

------------------------------------------------------------------------

## API Documentation

Swagger documentation:

    http://localhost:3000/api/docs

JSON spec:

    /api/docs.json

------------------------------------------------------------------------

## Example API Endpoints

  Method   Endpoint                     Description
  -------- ---------------------------- ------------------
  POST     /api/auth/login              User login
  POST     /api/auth/register           Register account
  GET      /api/articles                Get articles
  POST     /api/articles                Create article
  GET      /api/articles/:id/comments   Get comments
  POST     /api/articles/:id/comments   Add comment

------------------------------------------------------------------------

## Security Features

-   HTTP Security Headers
-   Request Rate Limiting
-   Input Sanitization
-   Role-Based Access Control
-   JWT Authentication

------------------------------------------------------------------------

## Development

Run development server:

    npm run dev

Production mode:

    npm start

------------------------------------------------------------------------

## Future Improvements

-   Redis caching
-   Image upload (Cloudinary)
-   Article tagging system
-   Full-text search
-   Refresh token authentication
-   Unit & integration testing

------------------------------------------------------------------------

## Author

**Nam Doan**

GitHub: https://github.com/hakuriver2002

------------------------------------------------------------------------

## License

MIT License
