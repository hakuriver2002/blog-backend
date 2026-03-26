const prisma = require('../../config/prisma');

const profileSelect = {
    id: true, userId: true, dateOfBirth: true, gender: true,
    height: true, weight: true, nationality: true, hometown: true, club: true,
    discipline: true, startYear: true, currentBelt: true, coachName: true,
    bio: true, isPublic: true, createdAt: true, updatedAt: true,
    user: { select: { id: true, fullName: true, avatarUrl: true, role: true, email: true } },
};

const achievementSelect = {
    id: true, athleteId: true, tournamentName: true, discipline: true,
    level: true, medal: true, year: true, location: true,
    weightCategory: true, kataName: true, description: true,
    createdAt: true, updatedAt: true,
    images: { orderBy: { sortOrder: 'asc' }, select: { id: true, imageUrl: true, caption: true, sortOrder: true } },
};

class AthleteRepository {
    async findProfileByUserId(userId) {
        return prisma.athleteProfile.findUnique({
            where: { userId },
            select: {
                ...profileSelect,
                achievements: {
                    select: achievementSelect,
                    orderBy: [{ year: 'desc' }, { medal: 'asc' }],
                },
                beltHistory: {
                    orderBy: { achievedAt: 'asc' },
                },
            },
        });
    }

    async findProfileById(id) {
        return prisma.athleteProfile.findUnique({
            where: { id },
            select: {
                ...profileSelect,
                achievements: {
                    select: achievementSelect,
                    orderBy: [{ year: 'desc' }, { medal: 'asc' }],
                },
                beltHistory: {
                    orderBy: { achievedAt: 'asc' },
                },
            },
        });
    }

    async findAllProfiles({ discipline, belt, club, search, isPublic, limit, offset }) {
        const where = {
            ...(isPublic !== undefined && { isPublic }),
            ...(discipline && { discipline }),
            ...(belt && { currentBelt: belt }),
            ...(club && { club: { contains: club, mode: 'insensitive' } }),
            ...(search && {
                user: { fullName: { contains: search, mode: 'insensitive' } },
            }),
        };

        const [profiles, total] = await Promise.all([
            prisma.athleteProfile.findMany({
                where,
                select: {
                    ...profileSelect,
                    _count: { select: { achievements: true } },
                },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset,
            }),
            prisma.athleteProfile.count({ where }),
        ]);

        return { profiles, total };
    }

    async createProfile(userId, data) {
        return prisma.athleteProfile.create({
            data: { userId, ...data },
            select: profileSelect,
        });
    }

    async updateProfile(userId, data) {
        return prisma.athleteProfile.update({
            where: { userId },
            data,
            select: profileSelect,
        });
    }

    async deleteProfile(userId) {
        return prisma.athleteProfile.delete({ where: { userId } });
    }

    async findAchievements(athleteId, { level, medal, year, limit, offset }) {
        const where = {
            athleteId,
            ...(level && { level }),
            ...(medal && { medal }),
            ...(year && { year: +year }),
        };

        const [achievements, total] = await Promise.all([
            prisma.achievement.findMany({
                where,
                select: achievementSelect,
                orderBy: [{ year: 'desc' }, { level: 'asc' }, { medal: 'asc' }],
                take: limit,
                skip: offset,
            }),
            prisma.achievement.count({ where }),
        ]);

        return { achievements, total };
    }

    async findAchievementById(id) {
        return prisma.achievement.findUnique({
            where: { id },
            select: { ...achievementSelect, athlete: { select: { userId: true } } },
        });
    }

    async createAchievement(athleteId, data) {
        return prisma.achievement.create({
            data: { athleteId, ...data },
            select: achievementSelect,
        });
    }

    async updateAchievement(id, data) {
        return prisma.achievement.update({
            where: { id },
            data,
            select: achievementSelect,
        });
    }

    async deleteAchievement(id) {
        return prisma.achievement.delete({ where: { id } });
    }

    async addImages(achievementId, images) {
        return prisma.achievementImage.createMany({
            data: images.map((img, idx) => ({
                achievementId,
                imageUrl: img.url,
                caption: img.caption || null,
                sortOrder: img.sortOrder ?? idx,
            })),
        });
    }

    async deleteImage(id) {
        return prisma.achievementImage.delete({ where: { id } });
    }

    async reorderImages(achievementId, imageIds) {
        return Promise.all(
            imageIds.map((id, idx) =>
                prisma.achievementImage.update({
                    where: { id },
                    data: { sortOrder: idx },
                })
            )
        );
    }

    async findBeltHistory(athleteId) {
        return prisma.belt.findMany({
            where: { athleteId },
            orderBy: { achievedAt: 'asc' },
        });
    }

    async addBelt(athleteId, data) {
        const belt = await prisma.belt.create({
            data: { athleteId, ...data },
        });

        await prisma.athleteProfile.update({
            where: { id: athleteId },
            data: { currentBelt: data.belt },
        });

        return belt;
    }

    async deleteBelt(id, athleteId) {
        await prisma.belt.delete({ where: { id } });

        const latest = await prisma.belt.findFirst({
            where: { athleteId },
            orderBy: { achievedAt: 'desc' },
        });

        if (latest) {
            await prisma.athleteProfile.update({
                where: { id: athleteId },
                data: { currentBelt: latest.belt },
            });
        }
    }

    async getStats() {
        const [
            totalAthletes,
            totalAchievements,
            byMedal,
            byLevel,
            byDiscipline,
            topAthletes,
        ] = await Promise.all([
            prisma.athleteProfile.count(),
            prisma.achievement.count(),
            prisma.achievement.groupBy({ by: ['medal'], _count: true }),
            prisma.achievement.groupBy({ by: ['level'], _count: true }),
            prisma.athleteProfile.groupBy({ by: ['discipline'], _count: true }),
            // Top 5 VĐV có nhiều thành tích nhất
            prisma.athleteProfile.findMany({
                take: 5,
                select: {
                    id: true,
                    user: { select: { fullName: true, avatarUrl: true } },
                    currentBelt: true,
                    club: true,
                    _count: { select: { achievements: true } },
                },
                orderBy: { achievements: { _count: 'desc' } },
            }),
        ]);

        return { totalAthletes, totalAchievements, byMedal, byLevel, byDiscipline, topAthletes };
    }
}

module.exports = AthleteRepository;