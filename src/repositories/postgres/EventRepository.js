const prisma = require('../../config/prisma');

const eventSelect = {
    id: true, title: true, slug: true, description: true, thumbnailUrl: true,
    category: true, level: true, status: true,
    startDate: true, endDate: true, registrationDeadline: true,
    location: true, address: true, city: true,
    divisions: true, registrationUrl: true,
    maxParticipants: true, fee: true, feeDescription: true,
    organizer: true, contactEmail: true, contactPhone: true,
    isPublic: true, isFeatured: true, viewCount: true,
    createdAt: true, updatedAt: true,
    createdBy: { select: { id: true, fullName: true, avatarUrl: true } },
    _count: { select: { registrations: true } },
};

class EventRepository {

    // ── Events ────────────────────────────────────────────────────
    async findAll({ status, category, level, city, upcoming, featured, search, isPublic, limit, offset }) {
        const now = new Date();
        const where = {
            ...(status && { status }),
            ...(category && { category }),
            ...(level && { level }),
            ...(city && { city: { contains: city, mode: 'insensitive' } }),
            ...(isPublic !== undefined && { isPublic }),
            ...(featured && { isFeatured: true }),
            // Chỉ lấy sự kiện sắp diễn ra (startDate >= hôm nay)
            ...(upcoming && { startDate: { gte: now } }),
            ...(search && {
                OR: [
                    { title: { contains: search, mode: 'insensitive' } },
                    { location: { contains: search, mode: 'insensitive' } },
                    { organizer: { contains: search, mode: 'insensitive' } },
                ],
            }),
        };

        const [events, total] = await Promise.all([
            prisma.event.findMany({
                where,
                select: eventSelect,
                orderBy: { startDate: 'asc' },
                take: limit,
                skip: offset,
            }),
            prisma.event.count({ where }),
        ]);

        return { events: events.map(this._format), total };
    }

    async findById(id) {
        const event = await prisma.event.findUnique({
            where: { id },
            select: eventSelect,
        });
        return event ? this._format(event) : null;
    }

    async findBySlug(slug) {
        const event = await prisma.event.findUnique({
            where: { slug },
            select: eventSelect,
        });
        return event ? this._format(event) : null;
    }

    // Calendar view: lấy events trong khoảng tháng
    async findByMonth({ year, month, isPublic }) {
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 0, 23, 59, 59);

        const where = {
            ...(isPublic !== undefined && { isPublic }),
            OR: [
                { startDate: { gte: start, lte: end } },  // bắt đầu trong tháng
                { endDate: { gte: start, lte: end } },  // kết thúc trong tháng
                { AND: [{ startDate: { lte: start } }, { endDate: { gte: end } }] }, // kéo dài qua tháng
            ],
        };

        const events = await prisma.event.findMany({
            where,
            select: {
                id: true, title: true, slug: true, category: true, level: true,
                status: true, startDate: true, endDate: true, location: true,
                city: true, isFeatured: true, isPublic: true, thumbnailUrl: true,
                _count: { select: { registrations: true } },
            },
            orderBy: { startDate: 'asc' },
        });

        return events;
    }

    async create(data) {
        const event = await prisma.event.create({
            data,
            select: eventSelect,
        });
        return this._format(event);
    }

    async update(id, data) {
        const event = await prisma.event.update({
            where: { id },
            data,
            select: eventSelect,
        });
        return this._format(event);
    }

    async delete(id) {
        return prisma.event.delete({ where: { id } });
    }

    async incrementViewCount(id) {
        return prisma.event.update({
            where: { id },
            data: { viewCount: { increment: 1 } },
        });
    }

    // ── Registrations ─────────────────────────────────────────────
    async findRegistration(eventId, userId) {
        return prisma.eventRegistration.findUnique({
            where: { eventId_userId: { eventId, userId } },
        });
    }

    async findRegistrations(eventId, { status, limit, offset }) {
        const where = {
            eventId,
            ...(status && { status }),
        };

        const [registrations, total] = await Promise.all([
            prisma.eventRegistration.findMany({
                where,
                include: {
                    user: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
                },
                orderBy: { registeredAt: 'asc' },
                take: limit,
                skip: offset,
            }),
            prisma.eventRegistration.count({ where }),
        ]);

        return { registrations, total };
    }

    async findUserRegistrations(userId, { upcoming, limit, offset }) {
        const now = new Date();
        const where = {
            userId,
            ...(upcoming && { event: { startDate: { gte: now } } }),
        };

        const [registrations, total] = await Promise.all([
            prisma.eventRegistration.findMany({
                where,
                include: {
                    event: {
                        select: {
                            id: true, title: true, slug: true, category: true, level: true,
                            status: true, startDate: true, endDate: true, location: true,
                            city: true, thumbnailUrl: true,
                        },
                    },
                },
                orderBy: { event: { startDate: 'asc' } },
                take: limit,
                skip: offset,
            }),
            prisma.eventRegistration.count({ where }),
        ]);

        return { registrations, total };
    }

    async createRegistration({ eventId, userId, division, note }) {
        return prisma.eventRegistration.create({
            data: { eventId, userId, division: division || null, note: note || null },
            include: {
                user: { select: { id: true, fullName: true, email: true } },
                event: { select: { id: true, title: true, startDate: true, location: true } },
            },
        });
    }

    async updateRegistrationStatus(eventId, userId, status) {
        return prisma.eventRegistration.update({
            where: { eventId_userId: { eventId, userId } },
            data: { status },
        });
    }

    async deleteRegistration(eventId, userId) {
        return prisma.eventRegistration.delete({
            where: { eventId_userId: { eventId, userId } },
        });
    }

    async countRegistrations(eventId) {
        return prisma.eventRegistration.count({ where: { eventId } });
    }

    // ── Stats ─────────────────────────────────────────────────────
    async getStats() {
        const now = new Date();

        const [total, upcoming, byCategory, byLevel, byStatus, featured] = await Promise.all([
            prisma.event.count(),
            prisma.event.count({ where: { startDate: { gte: now }, status: 'published' } }),
            prisma.event.groupBy({ by: ['category'], _count: true, where: { status: 'published' } }),
            prisma.event.groupBy({ by: ['level'], _count: true, where: { status: 'published' } }),
            prisma.event.groupBy({ by: ['status'], _count: true }),
            prisma.event.findMany({
                where: { isFeatured: true, status: 'published', startDate: { gte: now } },
                select: { id: true, title: true, startDate: true, location: true, category: true },
                orderBy: { startDate: 'asc' },
                take: 5,
            }),
        ]);

        return { total, upcoming, byCategory, byLevel, byStatus, featured };
    }

    // ── Helper ────────────────────────────────────────────────────
    _format(event) {
        return {
            ...event,
            // Parse divisions JSON string → array
            divisions: event.divisions ? JSON.parse(event.divisions) : [],
            registrationCount: event._count?.registrations ?? 0,
            _count: undefined,
        };
    }
}

module.exports = EventRepository;