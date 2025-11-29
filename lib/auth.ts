/**
 * Authentication Helper Functions
 *
 * This file provides utility functions for authentication, including:
 * - Password hashing and verification
 * - Session management
 * - User authentication helpers
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import bcrypt from 'bcryptjs';
import type { Session } from 'next-auth';

/**
 * Get the current user session
 * This is a server-side only function
 *
 * @returns The current session or null if not authenticated
 */
export async function getCurrentUser(): Promise<Session | null> {
  const session = await getServerSession(authOptions);
  return session;
}

/**
 * Get the current user session or throw an error if not authenticated
 *
 * @throws Error if user is not authenticated
 * @returns The current session
 */
export async function requireAuth(): Promise<Session> {
  const session = await getCurrentUser();

  if (!session || !session.user) {
    throw new Error('Unauthorized - Authentication required');
  }

  return session;
}

/**
 * Check if the current user has one of the specified roles
 *
 * @param allowedRoles - Array of roles that are allowed
 * @returns True if user has one of the allowed roles
 */
export async function hasRole(allowedRoles: string[]): Promise<boolean> {
  const session = await getCurrentUser();

  if (!session || !session.user) {
    return false;
  }

  return allowedRoles.includes(session.user.role);
}

/**
 * Require that the current user has one of the specified roles
 *
 * @param allowedRoles - Array of roles that are allowed
 * @throws Error if user doesn't have the required role
 * @returns The current session
 */
export async function requireRole(allowedRoles: string[]): Promise<Session> {
  const session = await requireAuth();

  if (!allowedRoles.includes(session.user.role)) {
    throw new Error('Forbidden - Insufficient permissions');
  }

  return session;
}

/**
 * Hash a password using bcrypt
 *
 * @param password - Plain text password to hash
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  return hashedPassword;
}

/**
 * Verify a password against a hash
 *
 * @param password - Plain text password to verify
 * @param hashedPassword - Hashed password to compare against
 * @returns True if password matches, false otherwise
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  const isValid = await bcrypt.compare(password, hashedPassword);
  return isValid;
}

/**
 * Check if a user account is active
 *
 * @returns True if the current user is active
 */
export async function isUserActive(): Promise<boolean> {
  const session = await getCurrentUser();

  if (!session || !session.user) {
    return false;
  }

  return session.user.active;
}
