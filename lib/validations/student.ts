/**
 * Student Validation Schemas
 *
 * Zod schemas for validating student-related API requests.
 */

import { z } from 'zod';

/**
 * Query Parameters Schema for GET /api/students
 */
export const getStudentsQuerySchema = z.object({
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

export type GetStudentsQuery = z.infer<typeof getStudentsQuerySchema>;

/**
 * Update Student Schema
 */
export const updateStudentSchema = z.object({
  governmentId: z
    .string()
    .min(1, 'Government ID is required')
    .max(50, 'Government ID is too long')
    .optional(),
  totalAllowedHours: z
    .number()
    .min(0, 'Total allowed hours must be at least 0')
    .max(10000, 'Total allowed hours is too large')
    .optional(),
});

export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;

/**
 * Assign Teacher Schema
 */
export const assignTeacherSchema = z.object({
  teacherId: z.string().cuid('Invalid teacher ID format'),
});

export type AssignTeacherInput = z.infer<typeof assignTeacherSchema>;

/**
 * Student ID Parameter Schema
 */
export const studentIdParamSchema = z.object({
  id: z.string().cuid('Invalid student ID format'),
});

export type StudentIdParam = z.infer<typeof studentIdParamSchema>;

/**
 * Teacher ID Parameter Schema
 */
export const teacherIdParamSchema = z.object({
  teacherId: z.string().cuid('Invalid teacher ID format'),
});

export type TeacherIdParam = z.infer<typeof teacherIdParamSchema>;
