/**
 * Prisma 7 Configuration File
 *
 * This file configures database connection URLs for Prisma migrations.
 * The URLs are read from environment variables.
 */

import { defineConfig } from '@prisma/client';

export default defineConfig({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
      directUrl: process.env.DIRECT_URL,
    },
  },
});
