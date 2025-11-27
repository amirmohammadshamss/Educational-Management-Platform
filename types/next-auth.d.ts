/**
 * NextAuth Type Extensions
 *
 * This file extends the default NextAuth types to include custom user properties
 * such as role, active status, and related IDs for teachers and students.
 */

import { Role } from '@prisma/client';
import { DefaultSession, DefaultUser } from 'next-auth';
import { DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  /**
   * Extended Session interface
   * Adds custom user properties to the session object
   */
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: Role;
      active: boolean;
      teacherId?: string; // Only present if user is a teacher
      studentId?: string; // Only present if user is a student
    } & DefaultSession['user'];
  }

  /**
   * Extended User interface
   * Adds custom properties to the user object returned from authorize
   */
  interface User extends DefaultUser {
    id: string;
    email: string;
    name: string;
    role: Role;
    active: boolean;
    teacherId?: string;
    studentId?: string;
  }
}

declare module 'next-auth/jwt' {
  /**
   * Extended JWT interface
   * Adds custom properties to the JWT token
   */
  interface JWT extends DefaultJWT {
    id: string;
    email: string;
    name: string;
    role: Role;
    active: boolean;
    teacherId?: string;
    studentId?: string;
  }
}
