/**
 * Sync Log Validation Schemas
 *
 * Zod schemas for validating sync log query parameters
 */

import { z } from 'zod';
import { SyncStatus } from '@prisma/client';

/**
 * Schema for sync log query parameters
 */
export const syncLogQuerySchema = z.object({
  page: z.string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .refine((val) => val > 0, { message: 'Page must be greater than 0' }),
  limit: z.string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .refine((val) => val > 0 && val <= 100, {
      message: 'Limit must be between 1 and 100',
    }),
  source: z.enum(['BOOKING_API', 'GOVERNMENT_API']).optional(),
  status: z.nativeEnum(SyncStatus).optional(),
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
});
