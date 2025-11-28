/**
 * Teacher Validation Schemas
 *
 * Zod schemas for validating teacher-related API requests.
 */

import { z } from 'zod';

/**
 * Query Parameters Schema for GET /api/teachers
 */
export const getTeachersQuerySchema = z.object({
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

export type GetTeachersQuery = z.infer<typeof getTeachersQuerySchema>;

/**
 * Teacher ID Parameter Schema
 */
export const teacherIdParamSchema = z.object({
  id: z.string().cuid('Invalid teacher ID format'),
});

export type TeacherIdParam = z.infer<typeof teacherIdParamSchema>;

/**
 * Schedule Query Parameters Schema
 */
export const scheduleQuerySchema = z.object({
  startDate: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: 'Invalid start date format',
    }),
  endDate: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: 'Invalid end date format',
    }),
  status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).optional(),
});

export type ScheduleQuery = z.infer<typeof scheduleQuerySchema>;
