/**
 * Booking Validation Schemas
 *
 * Zod schemas for validating booking-related data
 */

import { z } from 'zod';
import { BookingStatus } from '@prisma/client';

/**
 * Schema for validating booking ID parameter
 */
export const bookingIdParamSchema = z.object({
  id: z.string().cuid('Invalid booking ID format'),
});

/**
 * Schema for creating a new manual booking
 */
export const createBookingSchema = z.object({
  studentId: z.string().cuid('Invalid student ID format'),
  teacherId: z.string().cuid('Invalid teacher ID format'),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format',
  }).refine((val) => new Date(val) > new Date(), {
    message: 'Booking date must be in the future',
  }),
  duration: z.number()
    .int('Duration must be an integer')
    .min(1, 'Duration must be at least 1 hour')
    .max(8, 'Duration cannot exceed 8 hours'),
});

/**
 * Schema for updating a booking
 */
export const updateBookingSchema = z.object({
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format',
  }).optional(),
  duration: z.number()
    .int('Duration must be an integer')
    .min(1, 'Duration must be at least 1 hour')
    .max(8, 'Duration cannot exceed 8 hours')
    .optional(),
  status: z.nativeEnum(BookingStatus).optional(),
});

/**
 * Schema for booking query parameters
 */
export const bookingQuerySchema = z.object({
  page: z.string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .refine((val) => val > 0, { message: 'Page must be greater than 0' }),
  limit: z.string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .refine((val) => val > 0 && val <= 100, {
      message: 'Limit must be between 1 and 100',
    }),
  startDate: z.string()
    .optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: 'Invalid start date format',
    }),
  endDate: z.string()
    .optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: 'Invalid end date format',
    }),
  studentId: z.string().cuid('Invalid student ID format').optional(),
  teacherId: z.string().cuid('Invalid teacher ID format').optional(),
  status: z.nativeEnum(BookingStatus).optional(),
});
