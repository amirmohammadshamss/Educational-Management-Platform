/**
 * Database Seed Script
 *
 * Creates initial super admin user for development and testing
 */

import 'dotenv/config';
import { PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

console.log('Database URL:', process.env.DATABASE_URL);

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create Prisma adapter
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting database seed...');

  // Super Admin credentials
  const superAdminEmail = 'admin@educational-platform.com';
  const superAdminPassword = 'Admin@2024';
  const superAdminName = 'Super Administrator';

  // Check if super admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: superAdminEmail },
  });

  if (existingAdmin) {
    console.log('Super admin user already exists.');
    console.log('Email:', superAdminEmail);
    return;
  }

  // Hash password
  const passwordHash = await bcrypt.hash(superAdminPassword, 10);

  // Create super admin user
  const superAdmin = await prisma.user.create({
    data: {
      email: superAdminEmail,
      name: superAdminName,
      passwordHash,
      role: Role.SUPER_ADMIN,
      active: true,
    },
  });

  console.log('✓ Super admin user created successfully!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Email:    ', superAdminEmail);
  console.log('Password: ', superAdminPassword);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('⚠️  Please change the password after first login!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
    console.error('Error seeding database:', e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
