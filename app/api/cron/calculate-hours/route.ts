import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateStudentHoursBatch, sendHoursWarningNotifications } from '@/lib/hoursCalculator';
import { logger } from '@/lib/logger';
import { sendCronFailureAlert } from '@/lib/emailAlerts';

/**
 * Hours Calculation Cron Job
 * Runs daily at 4:00 AM UTC to calculate student used hours
 * Scheduled after both booking and government syncs
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

  logger.cronStart('calculate-hours');

  let syncLogId: string | null = null;

  try {
    // Create initial sync log entry
    const syncLog = await prisma.syncLog.create({
      data: {
        source: 'HOURS_CALCULATION',
        status: 'IN_PROGRESS',
        message: 'Hours calculation started',
        lastSyncTime: new Date(),
      },
    });

    syncLogId = syncLog.id;

    // Calculate student hours using efficient batch method
    logger.info('Calculating student hours...');
    const calculationResult = await calculateStudentHoursBatch(prisma);

    logger.info('Hours calculation result:', {
      processed: calculationResult.studentsProcessed,
      updated: calculationResult.studentsUpdated,
      lowHours: calculationResult.studentsWithLowHours.length,
      overLimit: calculationResult.studentsOverLimit.length,
      totalHours: calculationResult.totalHoursCalculated,
      errors: calculationResult.errors.length,
    });

    // Send warning notifications if needed
    if (
      calculationResult.studentsWithLowHours.length > 0 ||
      calculationResult.studentsOverLimit.length > 0
    ) {
      await sendHoursWarningNotifications(
        calculationResult.studentsWithLowHours,
        calculationResult.studentsOverLimit
      );
    }

    // Determine final status
    const finalStatus = calculationResult.errors.length === 0 ? 'SUCCESS' : 'FAILED';
    const elapsedTime = Date.now() - startTime;

    // Check if execution took too long (warning threshold: 30 seconds)
    const executionWarning = elapsedTime > 30000 ? 'Execution time exceeded 30 seconds' : null;

    if (executionWarning) {
      logger.warn('Hours calculation took too long', {
        duration: `${elapsedTime}ms`,
        threshold: '30000ms',
      });
    }

    // Update sync log with final results
    await prisma.syncLog.update({
      where: { id: syncLogId },
      data: {
        status: finalStatus,
        message: `Hours calculation completed. Processed: ${calculationResult.studentsProcessed}, Updated: ${calculationResult.studentsUpdated}, Low Hours: ${calculationResult.studentsWithLowHours.length}, Over Limit: ${calculationResult.studentsOverLimit.length}, Errors: ${calculationResult.errors.length}${executionWarning ? `. ${executionWarning}` : ''}`,
        lastSyncTime: new Date(),
      },
    });

    const summary = {
      success: calculationResult.success,
      status: finalStatus,
      duration: `${elapsedTime}ms`,
      students: {
        processed: calculationResult.studentsProcessed,
        updated: calculationResult.studentsUpdated,
        totalHoursCalculated: calculationResult.totalHoursCalculated,
      },
      warnings: {
        lowHours: calculationResult.studentsWithLowHours.map((s) => ({
          studentId: s.studentId,
          remainingHours: s.remainingHours,
          percentageRemaining: Math.round(s.percentageRemaining * 100) / 100,
        })),
        overLimit: calculationResult.studentsOverLimit.map((s) => ({
          studentId: s.studentId,
          usedHours: s.usedHours,
          allowedHours: s.totalAllowedHours,
          overage: s.usedHours - s.totalAllowedHours,
        })),
      },
      errors: calculationResult.errors,
      executionWarning,
      timestamp: new Date().toISOString(),
    };

    logger.cronSuccess('calculate-hours', elapsedTime, summary);

    // Send alert if there are critical issues
    if (calculationResult.errors.length > 0 || executionWarning) {
      await sendCronFailureAlert(
        'Hours Calculation',
        executionWarning || 'Calculation completed with errors',
        summary
      );
    }

    return NextResponse.json(summary);
  } catch (error: any) {
    const elapsedTime = Date.now() - startTime;
    logger.cronError('calculate-hours', error, elapsedTime);

    // Update sync log with error
    if (syncLogId) {
      try {
        await prisma.syncLog.update({
          where: { id: syncLogId },
          data: {
            status: 'FAILED',
            message: `Hours calculation failed: ${error.message}`,
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
            source: 'HOURS_CALCULATION',
            status: 'FAILED',
            message: `Hours calculation failed: ${error.message}`,
            lastSyncTime: new Date(),
          },
        });
      } catch (logError) {
        logger.error('Failed to create error sync log', logError);
      }
    }

    // Send critical alert
    await sendCronFailureAlert(
      'Hours Calculation',
      error.message,
      { error: error.message, duration: `${elapsedTime}ms` }
    );

    const errorSummary = {
      success: false,
      status: 'FAILED',
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
