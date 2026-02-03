import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Hash password
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@miniemystery.com' },
    update: {},
    create: {
      email: 'admin@minimystery.com',
      name: 'Admin User',
      password: hashedPassword,
    },
  });
  
  console.log('✓ Created admin user:', admin.email);
  console.log('  Password: admin123');
  console.log('  ⚠️  CHANGE THIS PASSWORD AFTER FIRST LOGIN!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
  