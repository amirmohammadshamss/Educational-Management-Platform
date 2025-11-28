'use client';

/**
 * ReviewedHomeworkList Component
 *
 * Displays reviewed homework submissions with search and filter
 */

import { useState } from 'react';
import { HomeworkStatus } from '@prisma/client';

/**
 * Homework data interface
 */
export interface HomeworkData {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  status: HomeworkStatus;
  feedback?: string | null;
  submittedAt: string;
  reviewedAt?: string | null;
}

/**
 * Component props
 */
interface ReviewedHomeworkListProps {
  homework: HomeworkData[];
  loading: boolean;
  error: string | null;
  onOpenReview: (id: string) => void;
  onRefresh: () => void;
}

/**
 * Get status color classes
 */
function getStatusColor(status: HomeworkStatus): string {
  switch (status) {
    case 'APPROVED':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'REJECTED':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'NEEDS_REVISION':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'PENDING':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

/**
 * Get file icon based on file type
 */
function getFileIcon(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();

  switch (ext) {
    case 'pdf':
      return '📄';
    case 'doc':
    case 'docx':
      return '📝';
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
      return '🖼️';
    default:
      return '📎';
  }
}

/**
 * Format file size
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Format date
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * ReviewedHomeworkList Component
 */
export default function ReviewedHomeworkList({
  homework,
  loading,
  error,
  onOpenReview,
  onRefresh,
}: ReviewedHomeworkListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  /**
   * Filter homework based on search and status filter
   */
  const filteredHomework = homework.filter((hw) => {
    const matchesSearch =
      searchTerm === '' ||
      hw.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hw.fileName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === '' || hw.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Reviewed Homework
            </h2>
            {homework.length > 0 && (
              <p className="text-sm text-gray-500 mt-1">
                {homework.length} submission{homework.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <button
            onClick={onRefresh}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Refresh
          </button>
        </div>

        {/* Search and filter */}
        <div className="flex gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by student name or file name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div className="w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">All Statuses</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="NEEDS_REVISION">Needs Revision</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex justify-center items-center py-16">
          <div className="text-gray-600">Loading homework submissions...</div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-6">
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && filteredHomework.length === 0 && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📚</div>
          <p className="text-gray-600 font-medium text-lg">
            {searchTerm || statusFilter
              ? 'No homework matches your filters'
              : 'No reviewed homework yet'}
          </p>
          {(searchTerm || statusFilter) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('');
              }}
              className="mt-4 text-sm text-blue-600 hover:text-blue-700"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Homework table */}
      {!loading && !error && filteredHomework.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  File
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reviewed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredHomework.map((hw) => (
                <tr key={hw.id} className="hover:bg-gray-50">
                  {/* Student */}
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {hw.studentName}
                      </div>
                      <div className="text-xs text-gray-500">{hw.studentEmail}</div>
                    </div>
                  </td>

                  {/* File */}
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <span className="text-2xl mr-2">{getFileIcon(hw.fileName)}</span>
                      <div>
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {hw.fileName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatFileSize(hw.fileSize)}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                        hw.status
                      )}`}
                    >
                      {hw.status.replace('_', ' ')}
                    </span>
                  </td>

                  {/* Submitted date */}
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {formatDate(hw.submittedAt)}
                  </td>

                  {/* Reviewed date */}
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {hw.reviewedAt ? formatDate(hw.reviewedAt) : '-'}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => onOpenReview(hw.id)}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        View
                      </button>
                      <a
                        href={hw.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-gray-600 hover:text-gray-800 font-medium"
                      >
                        Download
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Results summary */}
      {!loading && !error && filteredHomework.length > 0 && (
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-600">
            Showing {filteredHomework.length} of {homework.length} submission
            {homework.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
}
