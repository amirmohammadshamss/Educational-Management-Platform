/**
 * Prisma Client Singleton
 *
 * This file implements the singleton pattern for Prisma Client to prevent
 * multiple instances from being created during development (hot reloading).
 *
 * In production, this creates a single instance.
 * In development, it reuses the instance stored in globalThis to survive hot reloads.
 *
 * For Prisma 7, database connection URLs are configured in prisma/prisma.config.ts
 * and passed to the PrismaClient constructor.
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasourceUrl: process.env.DATABASE_URL,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
