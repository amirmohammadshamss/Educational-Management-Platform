import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { syncGovernmentHours } from '@/lib/governmentApiClient';
import { logger } from '@/lib/logger';
import { sendCronFailureAlert, sendCronPartialSuccessAlert } from '@/lib/emailAlerts';

/**
 * Government Hours Sync Cron Job
 * Runs daily at 3:00 AM UTC to sync authorized hours from Government API
 * Scheduled after booking sync to ensure hours are calculated correctly
 * Protected by CRON_SECRET environment variable
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  // Verify request is from Vercel Cron
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    logger.error('CRON_SECRET not configured');
    return NextResponse.json(
      { error: 'Cron job not configured' },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    logger.error('Unauthorized cron request');
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Check for dry-run mode
  const { searchParams } = new URL(request.url);
  const dryRun = searchParams.get('dryRun') === 'true';

  if (dryRun) {
    logger.info('Running government hours sync in DRY RUN mode');
  } else {
    logger.cronStart('sync-government-hours');
  }

  let syncLogId: string | null = null;

  try {
    // Create initial sync log entry (skip for dry run)
    if (!dryRun) {
      const syncLog = await prisma.syncLog.create({
        data: {
          source: 'GOVERNMENT_API',
          status: 'IN_PROGRESS',
          message: 'Government hours sync started',
          lastSyncTime: new Date(),
        },
      });

      syncLogId = syncLog.id;
    }

    // Sync government hours
    logger.info('Fetching and syncing government hours...');
    const syncResult = await syncGovernmentHours(prisma, dryRun);

    logger.info('Government hours sync result:', {
      processed: syncResult.studentsProcessed,
      updated: syncResult.studentsUpdated,
      skipped: syncResult.studentsSkipped,
      notFound: syncResult.studentsNotFound,
      errors: syncResult.errors.length,
      anomalies: syncResult.anomalies.length,
      dryRun,
    });

    // Determine final status
    let finalStatus: string;
    if (syncResult.errors.length === 0 && syncResult.studentsNotFound === 0) {
      finalStatus = 'SUCCESS';
    } else if (syncResult.studentsUpdated > 0) {
      finalStatus = 'PARTIAL_SUCCESS';
    } else {
      finalStatus = 'FAILED';
    }

    const elapsedTime = Date.now() - startTime;

    // Update sync log with final results (skip for dry run)
    if (!dryRun && syncLogId) {
      await prisma.syncLog.update({
        where: { id: syncLogId },
        data: {
          status: finalStatus,
          message: `Government hours sync completed. Processed: ${syncResult.studentsProcessed}, Updated: ${syncResult.studentsUpdated}, Skipped: ${syncResult.studentsSkipped}, Not Found: ${syncResult.studentsNotFound}, Errors: ${syncResult.errors.length}, Anomalies: ${syncResult.anomalies.length}`,
          lastSyncTime: new Date(),
        },
      });
    }

    const summary = {
      success: syncResult.success,
      status: finalStatus,
      dryRun,
      duration: `${elapsedTime}ms`,
      students: {
        processed: syncResult.studentsProcessed,
        updated: syncResult.studentsUpdated,
        skipped: syncResult.studentsSkipped,
        notFound: syncResult.studentsNotFound,
      },
      changes: syncResult.changes,
      errors: syncResult.errors,
      anomalies: syncResult.anomalies,
      timestamp: new Date().toISOString(),
    };

    if (!dryRun) {
      logger.cronSuccess('sync-government-hours', elapsedTime, summary);
    }

    // Send alerts if needed
    if (!dryRun) {
      if (finalStatus === 'FAILED') {
        await sendCronFailureAlert(
          'Government Hours Sync',
          'Failed to sync government hours',
          summary
        );
      } else if (finalStatus === 'PARTIAL_SUCCESS') {
        await sendCronPartialSuccessAlert('Government Hours Sync', summary);
      }
    }

    return NextResponse.json(summary);
  } catch (error: any) {
    const elapsedTime = Date.now() - startTime;
    logger.cronError('sync-government-hours', error, elapsedTime);

    // Update sync log with error (skip for dry run)
    if (!dryRun) {
      if (syncLogId) {
        try {
          await prisma.syncLog.update({
            where: { id: syncLogId },
            data: {
              status: 'FAILED',
              message: `Government hours sync failed: ${error.message}`,
              lastSyncTime: new Date(),
            },
          });
        } catch (logError) {
          logger.error('Failed to update sync log', logError);
        }
      } else {
        // Create error log if initial log creation failed
        try {
          await prisma.syncLog.create({
            data: {
              source: 'GOVERNMENT_API',
              status: 'FAILED',
              message: `Government hours sync failed: ${error.message}`,
              lastSyncTime: new Date(),
            },
          });
        } catch (logError) {
          logger.error('Failed to create error sync log', logError);
        }
      }

      // Send critical alert
      await sendCronFailureAlert(
        'Government Hours Sync',
        error.message,
        { error: error.message, duration: `${elapsedTime}ms` }
      );
    }

    const errorSummary = {
      success: false,
      status: 'FAILED',
      dryRun,
      duration: `${elapsedTime}ms`,
      error: error.message,
      timestamp: new Date().toISOString(),
    };

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
