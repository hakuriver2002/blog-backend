const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
    // Create Admin
    const passwordHash = await bcrypt.hash('AdminServer!123', 10);

    const admin = await prisma.user.upsert({
        where: { email: 'admin@karatedo.vn' },
        update: {},
        create: {
            fullName: 'Super Admin',
            email: 'admin@karatedo.vn',
            passwordHash,
            role: 'admin',
            status: 'active',
            approvedAt: new Date(),
        },
    });

    // Tạo Tags mẫu
    const tags = ['Karatedo', 'Giải đấu', 'Kỹ thuật', 'Truyền cảm hứng', 'Câu lạc bộ'];
    for (const name of tags) {
        await prisma.tag.upsert({
            where: { slug: name.toLowerCase().replace(/ /g, '-') },
            update: {},
            create: {
                name,
                slug: name.toLowerCase().replace(/ /g, '-'),
            },
        });
    }

    console.log('Seed data thành công!');
    console.log(`Admin: admin@karatedo.vn / AdminServer!123`);
}

main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());

module.exports = prisma;