import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

/**
 * Manual Trigger for All Cron Jobs
 * Allows admins to manually trigger all sync jobs in sequence
 * Used for testing and on-demand synchronization
 * Requires admin authentication
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify user is authenticated and is an admin
    const session = await getServerSession();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { error: 'Accès refusé - Administrateur uniquement' },
        { status: 403 }
      );
    }

    logger.info('Manual sync triggered by admin', {
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
    });

    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      return NextResponse.json(
        { error: 'Cron configuration missing' },
        { status: 500 }
      );
    }

    // Base URL for API calls
    const baseUrl = process.env.NEXTAUTH_URL || request.nextUrl.origin;

    const results = {
      bookingSync: null as any,
      governmentHoursSync: null as any,
      hoursCalculation: null as any,
      totalDuration: 0,
      overallSuccess: false,
    };

    // Step 1: Booking Sync
    logger.info('Triggering booking sync...');
    try {
      const response = await fetch(`${baseUrl}/api/cron/sync-bookings`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${cronSecret}`,
        },
      });

      results.bookingSync = await response.json();
      logger.info('Booking sync completed', {
        status: results.bookingSync.status,
        duration: results.bookingSync.duration,
      });
    } catch (error: any) {
      results.bookingSync = {
        success: false,
        error: error.message,
        status: 'FAILED',
      };
      logger.error('Booking sync failed', error);
    }

    // Small delay between jobs
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Step 2: Government Hours Sync
    logger.info('Triggering government hours sync...');
    try {
      const response = await fetch(`${baseUrl}/api/cron/sync-government-hours`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${cronSecret}`,
        },
      });

      results.governmentHoursSync = await response.json();
      logger.info('Government hours sync completed', {
        status: results.governmentHoursSync.status,
        duration: results.governmentHoursSync.duration,
      });
    } catch (error: any) {
      results.governmentHoursSync = {
        success: false,
        error: error.message,
        status: 'FAILED',
      };
      logger.error('Government hours sync failed', error);
    }

    // Small delay between jobs
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Step 3: Hours Calculation
    logger.info('Triggering hours calculation...');
    try {
      const response = await fetch(`${baseUrl}/api/cron/calculate-hours`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${cronSecret}`,
        },
      });

      results.hoursCalculation = await response.json();
      logger.info('Hours calculation completed', {
        status: results.hoursCalculation.status,
        duration: results.hoursCalculation.duration,
      });
    } catch (error: any) {
      results.hoursCalculation = {
        success: false,
        error: error.message,
        status: 'FAILED',
      };
      logger.error('Hours calculation failed', error);
    }

    // Calculate total duration
    const elapsedTime = Date.now() - startTime;
    results.totalDuration = elapsedTime;

    // Determine overall success
    results.overallSuccess =
      results.bookingSync?.success !== false &&
      results.governmentHoursSync?.success !== false &&
      results.hoursCalculation?.success !== false;

    // Create summary log
    await prisma.syncLog.create({
      data: {
        source: 'MANUAL_TRIGGER',
        status: results.overallSuccess ? 'SUCCESS' : 'FAILED',
        message: `Manual sync triggered by ${user.name} (${user.email}). Booking Sync: ${results.bookingSync?.status || 'FAILED'}, Government Sync: ${results.governmentHoursSync?.status || 'FAILED'}, Hours Calculation: ${results.hoursCalculation?.status || 'FAILED'}`,
        lastSyncTime: new Date(),
      },
    });

    const summary = {
      success: results.overallSuccess,
      triggeredBy: {
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
      },
      results: {
        bookingSync: results.bookingSync,
        governmentHoursSync: results.governmentHoursSync,
        hoursCalculation: results.hoursCalculation,
      },
      totalDuration: `${elapsedTime}ms`,
      timestamp: new Date().toISOString(),
    };

    logger.info('Manual sync completed', summary);

    return NextResponse.json(summary);
  } catch (error: any) {
    const elapsedTime = Date.now() - startTime;
    logger.error('Manual sync trigger failed', error);

    const errorSummary = {
      success: false,
      error: error.message,
      totalDuration: `${elapsedTime}ms`,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(errorSummary, { status: 500 });
  }
}

/**
 * GET method returns information about the endpoint
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession();

  if (!session || !session.user) {
    return NextResponse.json(
      { error: 'Non autorisé' },
      { status: 401 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
  });

  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    return NextResponse.json(
      { error: 'Accès refusé - Administrateur uniquement' },
      { status: 403 }
    );
  }

  return NextResponse.json({
    endpoint: '/api/cron/trigger-all',
    method: 'POST',
    description: 'Manually trigger all cron jobs in sequence',
    access: 'Admin only',
    jobs: [
      {
        name: 'Booking Sync',
        order: 1,
        description: 'Syncs bookings from external API',
      },
      {
        name: 'Government Hours Sync',
        order: 2,
        description: 'Syncs authorized hours from government API',
      },
      {
        name: 'Hours Calculation',
        order: 3,
        description: 'Calculates student used hours',
      },
    ],
    usage: {
      method: 'POST',
      authentication: 'Session-based (Admin)',
      response: 'Combined summary of all sync operations',
    },
  });
}
