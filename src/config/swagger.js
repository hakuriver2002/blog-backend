const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'CMS Karatedo API',
            version: '1.0.0',
            description: 'API documentation cho hệ thống CMS Karatedo',
            contact: {
                name: 'Karatedo CMS',
                email: 'admin@karatedo.vn',
            },
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Development server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Nhập JWT token: Bearer <token>',
                },
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        fullName: { type: 'string', example: 'Nguyễn Văn A' },
                        email: { type: 'string', format: 'email' },
                        role: { type: 'string', enum: ['admin', 'editor', 'trainer', 'member'] },
                        status: { type: 'string', enum: ['pending', 'active', 'inactive', 'rejected'] },
                        avatarUrl: { type: 'string', nullable: true },
                        createdAt: { type: 'string', format: 'date-time' },
                    }
                },
                Article: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        title: { type: 'string', example: 'Giải đấu Karatedo 2026' },
                        slug: { type: 'string', example: 'giai-dau-karatedo-2026-abc123' },
                        excerpt: { type: 'string', nullable: true },
                        content: { type: 'string' },
                        thumbnailUrl: { type: 'string', nullable: true },
                        category: { type: 'string', enum: ['club_news', 'events', 'regional_news', 'internal'] },
                        status: { type: 'string', enum: ['draft', 'pending', 'published', 'rejected', 'archived'] },
                        isFeatured: { type: 'boolean' },
                        viewCount: { type: 'integer' },
                        publishedAt: { type: 'string', format: 'date-time', nullable: true },
                        createdAt: { type: 'string', format: 'date-time' },
                        author: {
                            type: 'object',
                            properties: {
                                id: { type: 'string' },
                                fullName: { type: 'string' },
                            }
                        }
                    }
                },
                Comment: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        content: { type: 'string' },
                        status: { type: 'string', enum: ['visible', 'hidden', 'deleted'] },
                        parentId: { type: 'string', nullable: true },
                        createdAt: { type: 'string', format: 'date-time' },
                        user: {
                            type: 'object',
                            properties: {
                                id: { type: 'string' },
                                fullName: { type: 'string' },
                                avatarUrl: { type: 'string', nullable: true },
                            }
                        },
                        replies: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/Comment' },
                        }
                    }
                },
                Pagination: {
                    type: 'object',
                    properties: {
                        page: { type: 'integer', example: 1 },
                        limit: { type: 'integer', example: 10 },
                        total: { type: 'integer', example: 100 },
                        pages: { type: 'integer', example: 10 },
                    }
                },
                SuccessResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        message: { type: 'string' },
                        data: { type: 'object' },
                    }
                },
                ErrorResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: false },
                        message: { type: 'string', example: 'Lỗi xảy ra' },
                    }
                },
            },
            responses: {
                Unauthorized: {
                    description: 'Chưa đăng nhập',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ErrorResponse' },
                            example: { success: false, message: 'Vui lòng đăng nhập để tiếp tục' }
                        }
                    }
                },
                Forbidden: {
                    description: 'Không có quyền',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ErrorResponse' },
                            example: { success: false, message: 'Bạn không có quyền thực hiện thao tác này' }
                        }
                    }
                },
                NotFound: {
                    description: 'Không tìm thấy',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ErrorResponse' },
                            example: { success: false, message: 'Không tìm thấy tài nguyên' }
                        }
                    }
                },
            }
        },
        security: [{ bearerAuth: [] }],
    },
    apis: ['./src/routes/*.js', './src/controllers/**/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);
module.exports = swaggerSpec;