'use client';

/**
 * Sync Logs Table Component
 *
 * Displays API sync logs in a table with filtering and pagination
 * Color-coded by status (green=success, red=failed, yellow=in progress)
 */

import { useState, useEffect } from 'react';
import { SyncStatus } from '@prisma/client';

/**
 * Sync log data structure
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
 * Pagination information
 */
interface Pagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Component props
 */
interface SyncLogsTableProps {
  initialPage?: number;
  initialLimit?: number;
}

/**
 * SyncLogsTable Component
 */
export default function SyncLogsTable({
  initialPage = 1,
  initialLimit = 20
}: SyncLogsTableProps) {
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [sourceFilter, setSourceFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);

  /**
   * Fetch sync logs from API
   */
  const fetchLogs = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (sourceFilter) {
        params.append('source', sourceFilter);
      }
      if (statusFilter) {
        params.append('status', statusFilter);
      }

      const response = await fetch(`/api/sync-logs?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch sync logs');
      }

      const data = await response.json();
      setLogs(data.logs);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch logs on component mount and when filters change
   */
  useEffect(() => {
    fetchLogs();
  }, [page, limit, sourceFilter, statusFilter]);

  /**
   * Get status badge color
   */
  const getStatusColor = (status: SyncStatus): string => {
    switch (status) {
      case SyncStatus.SUCCESS:
        return 'bg-green-100 text-green-800 border-green-200';
      case SyncStatus.FAILED:
        return 'bg-red-100 text-red-800 border-red-200';
      case SyncStatus.IN_PROGRESS:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  /**
   * Format date to readable string
   */
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  /**
   * Handle page change
   */
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  /**
   * Reset filters
   */
  const resetFilters = () => {
    setSourceFilter('');
    setStatusFilter('');
    setPage(1);
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Sync Logs</h2>
        <p className="mt-1 text-sm text-gray-600">
          View API synchronization logs and monitor system health
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label htmlFor="source-filter" className="block text-sm font-medium text-gray-700 mb-1">
            Source
          </label>
          <select
            id="source-filter"
            value={sourceFilter}
            onChange={(e) => {
              setSourceFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Sources</option>
            <option value="BOOKING_API">Booking API</option>
            <option value="GOVERNMENT_API">Government API</option>
          </select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="SUCCESS">Success</option>
            <option value="FAILED">Failed</option>
            <option value="IN_PROGRESS">In Progress</option>
          </select>
        </div>

        <div className="flex gap-2">
          <button
            onClick={resetFilters}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Reset
          </button>
          <button
            onClick={fetchLogs}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="text-gray-600">Loading sync logs...</div>
        </div>
      )}

      {/* Table */}
      {!loading && logs.length > 0 && (
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Source
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Message
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sync Time
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {log.source === 'BOOKING_API' ? 'Booking API' : 'Government API'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(log.status)}`}
                    >
                      {log.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 max-w-md truncate" title={log.message}>
                    {log.message}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(log.lastSyncTime)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty state */}
      {!loading && logs.length === 0 && (
        <div className="text-center py-12 border border-gray-200 rounded-lg bg-gray-50">
          <p className="text-gray-600">No sync logs found</p>
          <p className="text-sm text-gray-500 mt-1">Try adjusting your filters</p>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing page {pagination.page} of {pagination.totalPages} ({pagination.totalCount} total logs)
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={!pagination.hasPreviousPage}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={!pagination.hasNextPage}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
