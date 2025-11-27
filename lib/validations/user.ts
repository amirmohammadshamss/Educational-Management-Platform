/**
 * User Validation Schemas
 *
 * Zod schemas for validating user-related API requests.
 */

import { z } from 'zod';
import { Role } from '@prisma/client';

/**
 * Create User Schema
 */
export const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  role: z.nativeEnum(Role),
  governmentId: z
    .string()
    .optional()
    .transform((val) => (val === '' ? undefined : val)),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

/**
 * Update User Schema
 */
export const updateUserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long').optional(),
  email: z.string().email('Please enter a valid email address').toLowerCase().optional(),
  active: z.boolean().optional(),
  role: z.nativeEnum(Role).optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

/**
 * Query Parameters Schema for GET /api/users
 */
export const getUsersQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .refine((val) => val > 0, { message: 'Page must be greater than 0' }),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .refine((val) => val > 0 && val <= 100, {
      message: 'Limit must be between 1 and 100',
    }),
  role: z.nativeEnum(Role).optional(),
  search: z.string().optional(),
  active: z
    .string()
    .optional()
    .transform((val) => {
      if (val === 'true') return true;
      if (val === 'false') return false;
      return undefined;
    }),
});

export type GetUsersQuery = z.infer<typeof getUsersQuerySchema>;

/**
 * User ID Parameter Schema
 */
export const userIdParamSchema = z.object({
  id: z.string().cuid('Invalid user ID format'),
});

export type UserIdParam = z.infer<typeof userIdParamSchema>;
