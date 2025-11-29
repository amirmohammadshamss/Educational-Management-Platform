/**
 * NextAuth.js Configuration
 *
 * This file exports the authOptions configuration for NextAuth.js.
 * It's separated from the route handler to allow importing in other files.
 */

import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/auth';
import type { User } from 'next-auth';

export const authOptions: NextAuthOptions = {
  // Use JWT strategy for serverless compatibility (Vercel)
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },

  // Configure authentication providers
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: {
          label: 'Email',
          type: 'email',
          placeholder: 'your-email@example.com',
        },
        password: {
          label: 'Password',
          type: 'password',
        },
      },

      /**
       * Authorize function - validates user credentials
       */
      async authorize(credentials): Promise<User | null> {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        // Find user by email and include teacher/student relations
        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
          include: {
            teacher: true,
            student: true,
          },
        });

        // Check if user exists
        if (!user) {
          throw new Error('Invalid email or password');
        }

        // Check if user is active
        if (!user.active) {
          throw new Error('Account is inactive. Please contact an administrator.');
        }

        // Verify password
        const isPasswordValid = await verifyPassword(
          credentials.password,
          user.passwordHash
        );

        if (!isPasswordValid) {
          throw new Error('Invalid email or password');
        }

        // Return user object with custom properties
        return {
          id: user.id,
          email: user.email,
          name: user.name || user.email, // Fallback to email if name is null
          role: user.role,
          active: user.active,
          teacherId: user.teacher?.id,
          studentId: user.student?.id,
        };
      },
    }),
  ],

  // Custom pages
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },

  // Callbacks to customize JWT and session
  callbacks: {
    /**
     * JWT Callback - Add custom properties to JWT token
     * This runs whenever a JWT is created or updated
     */
    async jwt({ token, user, trigger, session }) {
      // On sign in, add user properties to token
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        token.active = user.active;
        token.teacherId = user.teacherId;
        token.studentId = user.studentId;
      }

      // Handle session updates (e.g., profile changes)
      if (trigger === 'update' && session) {
        token.name = session.user.name || session.user.email;
        token.email = session.user.email;
      }

      return token;
    },

    /**
     * Session Callback - Add custom properties to session
     * This runs whenever a session is checked
     */
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.name = token.name;
        session.user.role = token.role;
        session.user.active = token.active;
        session.user.teacherId = token.teacherId;
        session.user.studentId = token.studentId;
      }

      return session;
    },
  },

  // Security options
  secret: process.env.NEXTAUTH_SECRET,

  // Enable debug mode in development
  debug: process.env.NODE_ENV === 'development',
};
