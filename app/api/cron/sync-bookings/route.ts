import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { syncBookings, updateStudentUsedHours } from '@/lib/bookingApiClient';

/**
 * Booking Sync Cron Job
 * Runs daily at 2:00 AM UTC to sync bookings from external API
 * Protected by CRON_SECRET environment variable
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  // Verify request is from Vercel Cron
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error('CRON_SECRET not configured');
    return NextResponse.json(
      { error: 'Cron job not configured' },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    console.error('Unauthorized cron request');
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  console.log('Starting booking sync job...');

  let syncLogId: string | null = null;

  try {
    // Create initial sync log entry
    const syncLog = await prisma.syncLog.create({
      data: {
        source: 'BOOKING_API',
        status: 'IN_PROGRESS',
        message: 'Booking sync started',
        lastSyncTime: new Date(),
      },
    });

    syncLogId = syncLog.id;

    // Step 1: Sync bookings from API
    console.log('Fetching and syncing bookings...');
    const bookingSyncResult = await syncBookings(prisma);

    console.log('Booking sync result:', {
      processed: bookingSyncResult.bookingsProcessed,
      created: bookingSyncResult.bookingsCreated,
      updated: bookingSyncResult.bookingsUpdated,
      errors: bookingSyncResult.errors.length,
    });

    // Step 2: Update student used hours
    console.log('Updating student used hours...');
    const hoursUpdateResult = await updateStudentUsedHours(prisma);

    console.log('Hours update result:', {
      updated: hoursUpdateResult.updated,
      errors: hoursUpdateResult.errors.length,
    });

    // Combine all errors
    const allErrors = [
      ...bookingSyncResult.errors,
      ...hoursUpdateResult.errors,
    ];

    // Determine final status
    const finalStatus = allErrors.length === 0 ? 'SUCCESS' : 'FAILED';
    const elapsedTime = Date.now() - startTime;

    // Update sync log with final results
    await prisma.syncLog.update({
      where: { id: syncLogId },
      data: {
        status: finalStatus,
        message: `Booking sync completed. Processed: ${bookingSyncResult.bookingsProcessed}, Created: ${bookingSyncResult.bookingsCreated}, Updated: ${bookingSyncResult.bookingsUpdated}, Students updated: ${hoursUpdateResult.updated}, Errors: ${allErrors.length}`,
        lastSyncTime: new Date(),
      },
    });

    const summary = {
      success: true,
      status: finalStatus,
      duration: `${elapsedTime}ms`,
      bookings: {
        processed: bookingSyncResult.bookingsProcessed,
        created: bookingSyncResult.bookingsCreated,
        updated: bookingSyncResult.bookingsUpdated,
      },
      students: {
        hoursUpdated: hoursUpdateResult.updated,
      },
      errors: allErrors,
      timestamp: new Date().toISOString(),
    };

    console.log('Booking sync job completed successfully:', summary);

    // Alert if there are errors
    if (allErrors.length > 0) {
      console.error('Booking sync completed with errors:', allErrors);
      // TODO: Send email notification if needed
      // await sendAlertEmail('Booking Sync Partial Success', summary);
    }

    return NextResponse.json(summary);
  } catch (error: any) {
    const elapsedTime = Date.now() - startTime;
    console.error('Fatal error in booking sync job:', error);

    // Update sync log with error
    if (syncLogId) {
      try {
        await prisma.syncLog.update({
          where: { id: syncLogId },
          data: {
            status: 'FAILED',
            message: `Booking sync failed: ${error.message}`,
            lastSyncTime: new Date(),
          },
        });
      } catch (logError) {
        console.error('Failed to update sync log:', logError);
      }
    } else {
      // Create error log if initial log creation failed
      try {
        await prisma.syncLog.create({
          data: {
            source: 'BOOKING_API',
            status: 'FAILED',
            message: `Booking sync failed: ${error.message}`,
            lastSyncTime: new Date(),
          },
        });
      } catch (logError) {
        console.error('Failed to create error sync log:', logError);
      }
    }

    const errorSummary = {
      success: false,
      status: 'FAILED',
      duration: `${elapsedTime}ms`,
      error: error.message,
      timestamp: new Date().toISOString(),
    };

    // Alert on critical failure
    console.error('CRITICAL: Booking sync job failed:', errorSummary);
    // TODO: Send critical alert email
    // await sendAlertEmail('Booking Sync Failed', errorSummary);

    return NextResponse.json(errorSummary, { status: 500 });
  }
}

/**
 * Optional: HEAD method for health checks
 */
export async function HEAD(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return new NextResponse(null, { status: 500 });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return new NextResponse(null, { status: 401 });
  }

  return new NextResponse(null, { status: 200 });
}
