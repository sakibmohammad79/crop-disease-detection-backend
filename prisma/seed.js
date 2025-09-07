import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/app/utils/bcrypt";
const prisma = new PrismaClient();
async function main() {
    console.log('🌱 Seeding database...');
    // Create admin user
    const adminPassword = await hashPassword('admin123456');
    const admin = await prisma.user.upsert({
        where: { email: 'admin@crophealth.com' },
        update: {},
        create: {
            email: 'admin@crophealth.com',
            password: adminPassword,
            name: 'System Admin',
            phone: '01700000000',
            role: 'ADMIN',
            adminProfile: {
                create: {
                    department: 'Agriculture Technology',
                    designation: 'System Administrator',
                }
            }
        },
    });
    // Create demo farmer
    const farmerPassword = await hashPassword('farmer123456');
    const farmer = await prisma.user.upsert({
        where: { email: 'farmer@example.com' },
        update: {},
        create: {
            email: 'farmer@example.com',
            password: farmerPassword,
            name: 'Demo Farmer',
            phone: '01800000000',
            role: 'FARMER',
            address: 'Chittagong, Bangladesh',
            farmerProfile: {
                create: {
                    cropTypes: ['rice', 'wheat', 'potato'],
                    farmSize: 5.5,
                    farmingExperience: 10,
                    farmLocation: 'Chittagong District',
                    soilType: 'loamy',
                    irrigationType: 'drip',
                }
            }
        },
    });
    console.log('✅ Database seeded successfully!');
    console.log('👤 Admin:', { email: admin.email, id: admin.id });
    console.log('🌾 Farmer:', { email: farmer.email, id: farmer.id });
}
main()
    .then(async () => {
    await prisma.$disconnect();
})
    .catch(async (e) => {
    console.error('❌ Seeding failed:', e);
    await prisma.$disconnect();
    process.exit(1);
});
