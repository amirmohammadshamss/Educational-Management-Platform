/**
 * Homework Validation Schemas
 *
 * Zod schemas for validating homework operations
 */

import { z } from 'zod';
import { HomeworkStatus } from '@prisma/client';

/**
 * Schema for homework upload
 */
export const homeworkUploadSchema = z.object({
  studentId: z.string().cuid('Invalid student ID format'),
  teacherId: z.string().cuid('Invalid teacher ID format'),
});

/**
 * Schema for homework query parameters
 */
export const homeworkQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .refine((val) => val > 0, { message: 'Page must be greater than 0' }),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .refine((val) => val > 0 && val <= 100, {
      message: 'Limit must be between 1 and 100',
    }),
  studentId: z.string().cuid('Invalid student ID format').optional(),
  teacherId: z.string().cuid('Invalid teacher ID format').optional(),
  status: z.nativeEnum(HomeworkStatus).optional(),
});

/**
 * Schema for homework review
 */
export const homeworkReviewSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'NEEDS_REVISION']),
  feedback: z
    .string()
    .max(2000, 'Feedback must not exceed 2000 characters')
    .optional(),
});
