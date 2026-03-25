const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
    // Create Admin
    const adminPasswordHash = await bcrypt.hash('AdminServer!123', 10);

    const admin = await prisma.user.upsert({
        where: { email: 'admin@karatedo.vn' },
        update: {},
        create: {
            fullName: 'Super Admin',
            email: 'admin@karatedo.vn',
            passwordHash: adminPasswordHash,
            role: 'admin',
            status: 'active',
            approvedAt: new Date(),
        },
    });

    // Create Editor
    const editorPasswordHash = await bcrypt.hash('Editor!123', 10);

    const editor = await prisma.user.upsert({
        where: { email: 'editor@karatedo.vn' },
        update: {},
        create: {
            fullName: 'Editor Member',
            email: 'editor@karatedo.vn',
            passwordHash: editorPasswordHash,
            role: 'editor',
            status: 'active',
            approvedAt: new Date(),
        },
    });

    // Create Trainer
    // const trainerPasswordHash = await bcrypt.hash('Trainer@123', 10);

    // const trainer = await prisma.user.upsert({
    //     where: { email: 'trainer@karatedo.vn' },
    //     update: {},
    //     create: {
    //         fullName: 'Trainer Member',
    //         email: 'trainer@karatedo.vn',
    //         passwordHash: trainerPasswordHash,
    //         role: 'trainer',
    //         status: 'active',
    //         approvedAt: new Date(),
    //     },
    // });

    // Create Member
    const memberPasswordHash = await bcrypt.hash('Member@123', 10);

    const member = await prisma.user.upsert({
        where: { email: 'member@karatedo.vn' },
        update: {},
        create: {
            fullName: 'Member',
            email: 'member@karatedo.vn',
            passwordHash: memberPasswordHash,
            role: 'member',
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
    console.log(`Editor: editor@karatedo.vn / Editor!123`);
    // console.log(`Trainer: trainer@karatedo.vn / Trainer@123`);
    console.log(`Member: member@karatedo.vn / Member@123`);
}

main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());

module.exports = prisma;