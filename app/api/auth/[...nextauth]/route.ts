/**
 * NextAuth.js Route Handler
 *
 * This file sets up the NextAuth.js API route for authentication.
 * The configuration is imported from lib/auth-options.ts to avoid
 * TypeScript errors with Next.js route exports.
 */

import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth-options';

// Export NextAuth handler for App Router
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
