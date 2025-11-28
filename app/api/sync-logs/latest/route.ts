/**
 * Latest Sync Status API Route
 *
 * GET /api/sync-logs/latest - Get latest sync status for each source
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { isAdmin } from '@/lib/rbac';
import { getAllSyncStatuses } from '@/lib/sync-logger';

/**
 * GET /api/sync-logs/latest
 *
 * Get latest sync status for each source (BOOKING_API, GOVERNMENT_API)
 * - Admin only access
 * - Used for dashboard display
 * - Returns status, last sync time, and time since last sync
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication - Admin only
    const session = await requireAuth();

    if (!isAdmin(session.user.role)) {
      return NextResponse.json(
        { error: 'Only administrators can view sync status' },
        { status: 403 }
      );
    }

    // Get status for all sync sources
    const statuses = await getAllSyncStatuses();

    // Calculate human-readable time since last sync
    const statusesWithFormattedTime = statuses.map((status) => {
      let timeSinceLastSyncFormatted = 'Never';

      if (status.timeSinceLastSync !== null) {
        const seconds = Math.floor(status.timeSinceLastSync / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) {
          timeSinceLastSyncFormatted = `${days} day${days > 1 ? 's' : ''} ago`;
        } else if (hours > 0) {
          timeSinceLastSyncFormatted = `${hours} hour${hours > 1 ? 's' : ''} ago`;
        } else if (minutes > 0) {
          timeSinceLastSyncFormatted = `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        } else {
          timeSinceLastSyncFormatted = `${seconds} second${seconds !== 1 ? 's' : ''} ago`;
        }
      }

      return {
        ...status,
        timeSinceLastSyncFormatted,
      };
    });

    return NextResponse.json({
      statuses: statusesWithFormattedTime,
    });
  } catch (error) {
    console.error('Error fetching latest sync status:', error);

    if (error instanceof Error) {
      if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: 'An error occurred while fetching sync status' },
      { status: 500 }
    );
  }
}
