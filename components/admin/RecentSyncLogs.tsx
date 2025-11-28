/**
 * RecentSyncLogs Component
 *
 * Display recent sync log entries
 * Shows last 5 sync attempts with status indicators
 */

import Link from 'next/link';
import { SyncStatus } from '@prisma/client';

/**
 * Sync log data interface
 */
interface SyncLog {
  id: string;
  source: string;
  status: SyncStatus;
  message: string;
  lastSyncTime: string;
  createdAt: string;
}

/**
 * Component props
 */
interface RecentSyncLogsProps {
  logs: SyncLog[];
}

/**
 * Get status color
 */
function getStatusColor(status: SyncStatus): string {
  switch (status) {
    case 'SUCCESS':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'FAILED':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'IN_PROGRESS':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

/**
 * Format time relative to now
 */
function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return `${seconds} seconds ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

/**
 * Get source display name
 */
function getSourceName(source: string): string {
  switch (source) {
    case 'BOOKING_API':
      return 'Booking API';
    case 'GOVERNMENT_API':
      return 'Government API';
    default:
      return source;
  }
}

/**
 * RecentSyncLogs Component
 */
export default function RecentSyncLogs({ logs }: RecentSyncLogsProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Recent Sync Logs
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Last {logs.length} synchronization attempts
          </p>
        </div>
        <Link
          href="/admin/sync-logs"
          className="text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          View All Logs
        </Link>
      </div>

      {/* Empty state */}
      {logs.length === 0 && (
        <div className="text-center py-12 border border-gray-200 rounded-lg bg-gray-50">
          <div className="text-4xl mb-4">🔄</div>
          <p className="text-gray-600 font-medium">No sync logs</p>
          <p className="text-sm text-gray-500 mt-1">
            No synchronization attempts have been recorded
          </p>
        </div>
      )}

      {/* Sync logs list */}
      {logs.length > 0 && (
        <div className="space-y-4">
          {logs.map((log) => (
            <div
              key={log.id}
              className="flex items-start justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start space-x-4 flex-1">
                {/* Status indicator */}
                <div className="flex-shrink-0 mt-1">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      log.status === 'SUCCESS'
                        ? 'bg-green-500'
                        : log.status === 'FAILED'
                          ? 'bg-red-500'
                          : 'bg-yellow-500'
                    }`}
                  ></div>
                </div>

                {/* Log details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <p className="text-sm font-medium text-gray-900">
                      {getSourceName(log.source)}
                    </p>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getStatusColor(
                        log.status
                      )}`}
                    >
                      {log.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {log.message}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatTimeAgo(log.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* System status summary */}
      {logs.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">System Status:</span>
            <span
              className={`font-medium ${
                logs[0]?.status === 'SUCCESS'
                  ? 'text-green-600'
                  : logs[0]?.status === 'FAILED'
                    ? 'text-red-600'
                    : 'text-yellow-600'
              }`}
            >
              {logs[0]?.status === 'SUCCESS'
                ? 'All systems operational'
                : logs[0]?.status === 'FAILED'
                  ? 'Sync issues detected'
                  : 'Sync in progress'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
