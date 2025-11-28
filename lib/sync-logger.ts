/**
 * Sync Logger Utilities
 *
 * Centralized logging functions for API synchronization operations
 */

import { prisma } from '@/lib/prisma';
import { SyncStatus } from '@prisma/client';

/**
 * Sync source types
 */
export type SyncSource = 'BOOKING_API' | 'GOVERNMENT_API';

/**
 * Sync log details for starting a sync
 */
export interface SyncStartDetails {
  message?: string;
  metadata?: Record<string, any>;
}

/**
 * Sync summary for successful completion
 */
export interface SyncSummary {
  totalProcessed: number;
  created?: number;
  updated?: number;
  skipped?: number;
  notFound?: number;
  noChange?: number;
  errors?: number;
  duration?: number;
  [key: string]: any; // Allow additional fields
}

/**
 * Sync status information
 */
export interface SyncStatusInfo {
  source: SyncSource;
  status: SyncStatus | null;
  lastSyncTime: Date | null;
  message: string | null;
  timeSinceLastSync: number | null; // milliseconds
}

/**
 * Log the start of a sync operation
 *
 * @param source - The sync source (BOOKING_API or GOVERNMENT_API)
 * @param details - Optional details about the sync operation
 * @returns Promise<SyncLog> - The created sync log entry
 */
export async function logSyncStart(
  source: SyncSource,
  details?: SyncStartDetails
): Promise<any> {
  try {
    const message = details?.message || `Starting ${source} sync...`;

    const syncLog = await prisma.syncLog.create({
      data: {
        source,
        status: SyncStatus.IN_PROGRESS,
        message,
        lastSyncTime: new Date(),
      },
    });

    console.log(`[${source}] Sync started: ${message}`);
    return syncLog;
  } catch (error) {
    console.error(`Failed to log sync start for ${source}:`, error);
    throw error;
  }
}

/**
 * Log successful completion of a sync operation
 *
 * @param source - The sync source
 * @param summary - Summary of sync results
 * @returns Promise<SyncLog> - The created sync log entry
 */
export async function logSyncSuccess(
  source: SyncSource,
  summary: SyncSummary
): Promise<any> {
  try {
    // Build detailed message from summary
    const messageParts: string[] = [`Processed ${summary.totalProcessed} records`];

    if (summary.created !== undefined) {
      messageParts.push(`${summary.created} created`);
    }
    if (summary.updated !== undefined) {
      messageParts.push(`${summary.updated} updated`);
    }
    if (summary.noChange !== undefined) {
      messageParts.push(`${summary.noChange} unchanged`);
    }
    if (summary.skipped !== undefined) {
      messageParts.push(`${summary.skipped} skipped`);
    }
    if (summary.notFound !== undefined) {
      messageParts.push(`${summary.notFound} not found`);
    }
    if (summary.errors !== undefined && summary.errors > 0) {
      messageParts.push(`${summary.errors} errors`);
    }
    if (summary.duration !== undefined) {
      messageParts.push(`Duration: ${summary.duration}ms`);
    }

    const message = messageParts.join(', ');

    const syncLog = await prisma.syncLog.create({
      data: {
        source,
        status: summary.errors && summary.errors > 0 ? SyncStatus.FAILED : SyncStatus.SUCCESS,
        message,
        lastSyncTime: new Date(),
      },
    });

    console.log(`[${source}] Sync completed successfully: ${message}`);
    return syncLog;
  } catch (error) {
    console.error(`Failed to log sync success for ${source}:`, error);
    throw error;
  }
}

/**
 * Log a sync error
 *
 * @param source - The sync source
 * @param error - The error that occurred
 * @returns Promise<SyncLog> - The created sync log entry
 */
export async function logSyncError(
  source: SyncSource,
  error: Error | string
): Promise<any> {
  try {
    const errorMessage = error instanceof Error ? error.message : error;
    const message = `Sync failed: ${errorMessage}`;

    const syncLog = await prisma.syncLog.create({
      data: {
        source,
        status: SyncStatus.FAILED,
        message,
        lastSyncTime: new Date(),
      },
    });

    console.error(`[${source}] ${message}`);
    return syncLog;
  } catch (logError) {
    console.error(`Failed to log sync error for ${source}:`, logError);
    throw logError;
  }
}

/**
 * Get the current sync status for a source
 *
 * @param source - The sync source to check
 * @returns Promise<SyncStatusInfo> - Current sync status information
 */
export async function getSyncStatus(source: SyncSource): Promise<SyncStatusInfo> {
  try {
    const latestLog = await prisma.syncLog.findFirst({
      where: { source },
      orderBy: { createdAt: 'desc' },
      select: {
        source: true,
        status: true,
        message: true,
        lastSyncTime: true,
      },
    });

    if (!latestLog) {
      return {
        source,
        status: null,
        lastSyncTime: null,
        message: 'No sync has been performed yet',
        timeSinceLastSync: null,
      };
    }

    const timeSinceLastSync = latestLog.lastSyncTime
      ? Date.now() - latestLog.lastSyncTime.getTime()
      : null;

    return {
      source: latestLog.source as SyncSource,
      status: latestLog.status,
      lastSyncTime: latestLog.lastSyncTime,
      message: latestLog.message,
      timeSinceLastSync,
    };
  } catch (error) {
    console.error(`Failed to get sync status for ${source}:`, error);
    throw error;
  }
}

/**
 * Get sync status for all sources
 *
 * @returns Promise<SyncStatusInfo[]> - Array of sync status for all sources
 */
export async function getAllSyncStatuses(): Promise<SyncStatusInfo[]> {
  const sources: SyncSource[] = ['BOOKING_API', 'GOVERNMENT_API'];

  const statuses = await Promise.all(
    sources.map((source) => getSyncStatus(source))
  );

  return statuses;
}

/**
 * Check if a sync is currently in progress
 *
 * @param source - The sync source to check
 * @returns Promise<boolean> - True if sync is in progress
 */
export async function isSyncInProgress(source: SyncSource): Promise<boolean> {
  const status = await getSyncStatus(source);
  return status.status === SyncStatus.IN_PROGRESS;
}

/**
 * Get the last successful sync time
 *
 * @param source - The sync source
 * @returns Promise<Date | null> - Last successful sync time or null
 */
export async function getLastSuccessfulSync(source: SyncSource): Promise<Date | null> {
  const latestSuccessLog = await prisma.syncLog.findFirst({
    where: {
      source,
      status: SyncStatus.SUCCESS,
    },
    orderBy: { lastSyncTime: 'desc' },
    select: { lastSyncTime: true },
  });

  return latestSuccessLog?.lastSyncTime || null;
}

/**
 * Get sync statistics for a time period
 *
 * @param source - The sync source
 * @param startDate - Start of period
 * @param endDate - End of period
 * @returns Promise<object> - Sync statistics
 */
export async function getSyncStatistics(
  source: SyncSource,
  startDate: Date,
  endDate: Date
): Promise<{
  total: number;
  successful: number;
  failed: number;
  inProgress: number;
  successRate: number;
}> {
  const logs = await prisma.syncLog.findMany({
    where: {
      source,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: { status: true },
  });

  const total = logs.length;
  const successful = logs.filter((log) => log.status === SyncStatus.SUCCESS).length;
  const failed = logs.filter((log) => log.status === SyncStatus.FAILED).length;
  const inProgress = logs.filter((log) => log.status === SyncStatus.IN_PROGRESS).length;
  const successRate = total > 0 ? (successful / total) * 100 : 0;

  return {
    total,
    successful,
    failed,
    inProgress,
    successRate,
  };
}
