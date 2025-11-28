/**
 * Government API Sync Integration Route
 *
 * GET /api/integrations/government-sync - Sync authorized hours from French Government API
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  fetchAllStudentHours,
  validateStudentHours,
  type ExternalStudentHours,
} from '@/lib/integrations/government-api';
import { SyncStatus } from '@prisma/client';

/**
 * Sync result for individual student
 */
interface StudentSyncResult {
  governmentId: string;
  action: 'updated' | 'not_found' | 'no_change' | 'error';
  previousHours?: number;
  newHours?: number;
  message?: string;
}

/**
 * Overall sync summary
 */
interface SyncSummary {
  totalProcessed: number;
  updated: number;
  notFound: number;
  noChange: number;
  errors: number;
  results: StudentSyncResult[];
  startTime: Date;
  endTime: Date;
  duration: number;
}

/**
 * GET /api/integrations/government-sync
 *
 * Sync authorized training hours from French Government API
 * - Protected endpoint (requires authentication)
 * - Fetches all student hours from government API
 * - Updates student totalAllowedHours in database
 * - Creates sync log entry
 */
export async function GET(request: NextRequest) {
  const startTime = new Date();

  try {
    // Verify this is an authenticated request from cron or admin
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Allow access if it's from cron job or if no cron secret is set (development)
    const isAuthorized = !cronSecret || authHeader === `Bearer ${cronSecret}`;

    if (!isAuthorized) {
      // Create failed sync log
      await prisma.syncLog.create({
        data: {
          source: 'GOVERNMENT_API',
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

    console.log('Starting government hours sync...');

    // Fetch student hours from government API
    let externalStudentHours: ExternalStudentHours[];
    try {
      externalStudentHours = await fetchAllStudentHours();
      console.log(`Fetched ${externalStudentHours.length} student records from government API`);
    } catch (error) {
      console.error('Failed to fetch student hours from government API:', error);

      // Create failed sync log
      await prisma.syncLog.create({
        data: {
          source: 'GOVERNMENT_API',
          status: SyncStatus.FAILED,
          message: `Failed to fetch student hours: ${error instanceof Error ? error.message : 'Unknown error'}`,
          lastSyncTime: startTime,
        },
      });

      return NextResponse.json(
        {
          error: 'Failed to fetch student hours from government API',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }

    // Get all students from our database who have a governmentId
    const studentsInDatabase = await prisma.student.findMany({
      where: {
        governmentId: {
          not: '',
        },
      },
      select: {
        id: true,
        governmentId: true,
        totalAllowedHours: true,
        user: {
          select: {
            active: true,
          },
        },
      },
    });

    console.log(`Found ${studentsInDatabase.length} students in database with government IDs`);

    // Create a map for quick lookup
    type StudentWithUser = typeof studentsInDatabase[number];
    const studentMap = new Map<string, StudentWithUser>(
      studentsInDatabase.map((s) => [s.governmentId, s])
    );

    // Process each student from government API
    const results: StudentSyncResult[] = [];
    let updated = 0;
    let notFound = 0;
    let noChange = 0;
    let errors = 0;

    for (const externalStudent of externalStudentHours) {
      try {
        // Validate external student data
        const validation = validateStudentHours(externalStudent);
        if (!validation.valid) {
          errors++;
          results.push({
            governmentId: externalStudent.governmentId,
            action: 'error',
            message: `Validation failed: ${validation.errors.join(', ')}`,
          });
          console.warn(`Skipping invalid student ${externalStudent.governmentId}:`, validation.errors);
          continue;
        }

        // Find student in our database
        const student = studentMap.get(externalStudent.governmentId);

        if (!student) {
          notFound++;
          results.push({
            governmentId: externalStudent.governmentId,
            action: 'not_found',
            message: 'Student not found in local database',
            newHours: externalStudent.authorizedHours,
          });
          console.warn(`Student not found in database: ${externalStudent.governmentId}`);
          continue;
        }

        // Skip inactive students
        if (!student.user.active) {
          notFound++;
          results.push({
            governmentId: externalStudent.governmentId,
            action: 'not_found',
            message: 'Student is inactive',
          });
          continue;
        }

        // Check if hours have changed
        if (student.totalAllowedHours === externalStudent.authorizedHours) {
          noChange++;
          results.push({
            governmentId: externalStudent.governmentId,
            action: 'no_change',
            previousHours: student.totalAllowedHours,
            newHours: externalStudent.authorizedHours,
          });
          continue;
        }

        // Update student's authorized hours
        await prisma.student.update({
          where: { id: student.id },
          data: {
            totalAllowedHours: externalStudent.authorizedHours,
          },
        });

        updated++;
        results.push({
          governmentId: externalStudent.governmentId,
          action: 'updated',
          previousHours: student.totalAllowedHours,
          newHours: externalStudent.authorizedHours,
        });

        console.log(
          `Updated student ${externalStudent.governmentId}: ${student.totalAllowedHours} → ${externalStudent.authorizedHours} hours`
        );
      } catch (error) {
        errors++;
        results.push({
          governmentId: externalStudent.governmentId,
          action: 'error',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
        console.error(`Error processing student ${externalStudent.governmentId}:`, error);
      }
    }

    // Check for students in our database that weren't in the government API response
    const governmentIds = new Set(externalStudentHours.map((s) => s.governmentId));
    const missingFromGovernment = studentsInDatabase.filter(
      (s) => s.governmentId && !governmentIds.has(s.governmentId)
    );

    if (missingFromGovernment.length > 0) {
      console.warn(
        `${missingFromGovernment.length} students in database not found in government API response:`,
        missingFromGovernment.map((s) => s.governmentId)
      );
    }

    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();

    const summary: SyncSummary = {
      totalProcessed: externalStudentHours.length,
      updated,
      notFound,
      noChange,
      errors,
      results,
      startTime,
      endTime,
      duration,
    };

    // Create sync log
    const syncStatus = errors === 0 ? SyncStatus.SUCCESS : SyncStatus.FAILED;
    await prisma.syncLog.create({
      data: {
        source: 'GOVERNMENT_API',
        status: syncStatus,
        message: `Processed ${summary.totalProcessed} students: ${updated} updated, ${noChange} unchanged, ${notFound} not found, ${errors} errors. Duration: ${duration}ms`,
        lastSyncTime: startTime,
      },
    });

    console.log('Government hours sync completed:', summary);

    return NextResponse.json({
      success: true,
      summary: {
        totalProcessed: summary.totalProcessed,
        updated: summary.updated,
        noChange: summary.noChange,
        notFound: summary.notFound,
        errors: summary.errors,
        duration: summary.duration,
        missingFromGovernment: missingFromGovernment.length,
      },
      details: summary.results,
      warnings: missingFromGovernment.length > 0 ? {
        missingStudents: missingFromGovernment.map((s) => ({
          governmentId: s.governmentId,
          currentHours: s.totalAllowedHours,
        })),
      } : undefined,
    });
  } catch (error) {
    console.error('Government hours sync failed:', error);

    const endTime = new Date();

    // Create failed sync log
    try {
      await prisma.syncLog.create({
        data: {
          source: 'GOVERNMENT_API',
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
        error: 'Government hours sync failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        duration: endTime.getTime() - startTime.getTime(),
      },
      { status: 500 }
    );
  }
}
