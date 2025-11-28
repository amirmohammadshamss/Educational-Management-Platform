/**
 * Booking API Sync Integration Route
 *
 * GET /api/integrations/booking-sync - Sync bookings from external API
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  fetchAllBookings,
  validateExternalBooking,
  transformBookingStatus,
  type ExternalBooking,
} from '@/lib/integrations/booking-api';
import { SyncStatus, BookingStatus } from '@prisma/client';

/**
 * Sync result for individual booking
 */
interface BookingSyncResult {
  bookingId: string;
  action: 'created' | 'updated' | 'skipped' | 'error';
  message?: string;
}

/**
 * Overall sync summary
 */
interface SyncSummary {
  totalProcessed: number;
  created: number;
  updated: number;
  skipped: number;
  errors: number;
  results: BookingSyncResult[];
  startTime: Date;
  endTime: Date;
  duration: number;
}

/**
 * GET /api/integrations/booking-sync
 *
 * Sync bookings from external Booking API
 * - Protected endpoint (requires authentication)
 * - Fetches all bookings from external API
 * - Upserts bookings to database
 * - Updates student used hours
 * - Creates sync log entry
 */
export async function GET(request: NextRequest) {
  const startTime = new Date();

  try {
    // Verify this is an authenticated request from cron or admin
    // For now, we'll add basic protection - this will be enhanced in Task 9.1
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Allow access if it's from cron job or if no cron secret is set (development)
    const isAuthorized = !cronSecret || authHeader === `Bearer ${cronSecret}`;

    if (!isAuthorized) {
      // Create failed sync log
      await prisma.syncLog.create({
        data: {
          source: 'BOOKING_API',
          status: SyncStatus.FAILED,
          message: 'Unauthorized sync attempt',
          lastSyncTime: startTime,
        },
      });

      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Starting booking sync...');

    // Fetch bookings from external API
    let externalBookings: ExternalBooking[];
    try {
      externalBookings = await fetchAllBookings();
      console.log(`Fetched ${externalBookings.length} bookings from external API`);
    } catch (error) {
      console.error('Failed to fetch bookings from external API:', error);

      // Create failed sync log
      await prisma.syncLog.create({
        data: {
          source: 'BOOKING_API',
          status: SyncStatus.FAILED,
          message: `Failed to fetch bookings: ${error instanceof Error ? error.message : 'Unknown error'}`,
          lastSyncTime: startTime,
        },
      });

      return NextResponse.json(
        {
          error: 'Failed to fetch bookings from external API',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }

    // Process each booking
    const results: BookingSyncResult[] = [];
    let created = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const externalBooking of externalBookings) {
      try {
        // Validate external booking data
        const validation = validateExternalBooking(externalBooking);
        if (!validation.valid) {
          errors++;
          results.push({
            bookingId: externalBooking.bookingId,
            action: 'error',
            message: `Validation failed: ${validation.errors.join(', ')}`,
          });
          console.warn(`Skipping invalid booking ${externalBooking.bookingId}:`, validation.errors);
          continue;
        }

        // Find student by government ID
        const student = await prisma.student.findFirst({
          where: {
            governmentId: externalBooking.studentGovernmentId,
          },
          select: {
            id: true,
            user: {
              select: {
                active: true,
              },
            },
          },
        });

        if (!student) {
          skipped++;
          results.push({
            bookingId: externalBooking.bookingId,
            action: 'skipped',
            message: `Student not found with government ID: ${externalBooking.studentGovernmentId}`,
          });
          console.warn(`Student not found: ${externalBooking.studentGovernmentId}`);
          continue;
        }

        if (!student.user.active) {
          skipped++;
          results.push({
            bookingId: externalBooking.bookingId,
            action: 'skipped',
            message: 'Student is inactive',
          });
          continue;
        }

        // Find teacher by email
        const teacher = await prisma.teacher.findFirst({
          where: {
            user: {
              email: externalBooking.teacherEmail,
            },
          },
          select: {
            id: true,
            user: {
              select: {
                active: true,
              },
            },
          },
        });

        if (!teacher) {
          skipped++;
          results.push({
            bookingId: externalBooking.bookingId,
            action: 'skipped',
            message: `Teacher not found with email: ${externalBooking.teacherEmail}`,
          });
          console.warn(`Teacher not found: ${externalBooking.teacherEmail}`);
          continue;
        }

        if (!teacher.user.active) {
          skipped++;
          results.push({
            bookingId: externalBooking.bookingId,
            action: 'skipped',
            message: 'Teacher is inactive',
          });
          continue;
        }

        // Check if booking already exists (using external bookingId in source field)
        const existingBooking = await prisma.booking.findFirst({
          where: {
            source: `booking_api:${externalBooking.bookingId}`,
          },
        });

        const bookingData = {
          studentId: student.id,
          teacherId: teacher.id,
          date: new Date(externalBooking.scheduledDate),
          duration: externalBooking.durationHours,
          status: transformBookingStatus(externalBooking.status),
          source: `booking_api:${externalBooking.bookingId}`,
        };

        if (existingBooking) {
          // Update existing booking
          await prisma.booking.update({
            where: { id: existingBooking.id },
            data: bookingData,
          });

          updated++;
          results.push({
            bookingId: externalBooking.bookingId,
            action: 'updated',
          });
        } else {
          // Create new booking
          await prisma.booking.create({
            data: bookingData,
          });

          created++;
          results.push({
            bookingId: externalBooking.bookingId,
            action: 'created',
          });
        }
      } catch (error) {
        errors++;
        results.push({
          bookingId: externalBooking.bookingId,
          action: 'error',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
        console.error(`Error processing booking ${externalBooking.bookingId}:`, error);
      }
    }

    // Recalculate used hours for all students who had bookings synced
    const studentsToUpdate = new Set<string>();
    for (const result of results) {
      if (result.action === 'created' || result.action === 'updated') {
        // Find the booking to get the student ID
        const booking = await prisma.booking.findFirst({
          where: {
            source: `booking_api:${result.bookingId}`,
          },
          select: {
            studentId: true,
          },
        });
        if (booking) {
          studentsToUpdate.add(booking.studentId);
        }
      }
    }

    // Update used hours for each affected student
    for (const studentId of studentsToUpdate) {
      const completedBookings = await prisma.booking.findMany({
        where: {
          studentId,
          status: BookingStatus.COMPLETED,
        },
        select: {
          duration: true,
        },
      });

      const totalUsedHours = completedBookings.reduce((sum, b) => sum + b.duration, 0);

      await prisma.student.update({
        where: { id: studentId },
        data: {
          usedHours: totalUsedHours,
        },
      });
    }

    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();

    const summary: SyncSummary = {
      totalProcessed: externalBookings.length,
      created,
      updated,
      skipped,
      errors,
      results,
      startTime,
      endTime,
      duration,
    };

    // Create successful sync log
    await prisma.syncLog.create({
      data: {
        source: 'BOOKING_API',
        status: errors === 0 ? SyncStatus.SUCCESS : SyncStatus.FAILED,
        message: `Processed ${summary.totalProcessed} bookings: ${created} created, ${updated} updated, ${skipped} skipped, ${errors} errors. Duration: ${duration}ms`,
        lastSyncTime: startTime,
      },
    });

    console.log('Booking sync completed:', summary);

    return NextResponse.json({
      success: true,
      summary: {
        totalProcessed: summary.totalProcessed,
        created: summary.created,
        updated: summary.updated,
        skipped: summary.skipped,
        errors: summary.errors,
        duration: summary.duration,
        studentsUpdated: studentsToUpdate.size,
      },
      details: summary.results,
    });
  } catch (error) {
    console.error('Booking sync failed:', error);

    const endTime = new Date();

    // Create failed sync log
    try {
      await prisma.syncLog.create({
        data: {
          source: 'BOOKING_API',
          status: SyncStatus.FAILED,
          message: `Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          lastSyncTime: startTime,
        },
      });
    } catch (logError) {
      console.error('Failed to create sync log:', logError);
    }

    return NextResponse.json(
      {
        error: 'Booking sync failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        duration: endTime.getTime() - startTime.getTime(),
      },
      { status: 500 }
    );
  }
}
