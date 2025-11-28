'use client';

/**
 * HomeworkReviewQueue Component
 *
 * Displays pending homework submissions in a queue format
 * Features: batch selection, quick review, mark as reviewed without feedback
 */

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
  submittedAt: string;
}

/**
 * Component props
 */
interface HomeworkReviewQueueProps {
  homework: HomeworkData[];
  loading: boolean;
  error: string | null;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onOpenReview: (id: string) => void;
  onRefresh: () => void;
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
 * Format file size to human-readable string
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Format date to relative time string
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

/**
 * Get file type label
 */
function getFileType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  return ext.toUpperCase();
}

/**
 * HomeworkReviewQueue Component
 */
export default function HomeworkReviewQueue({
  homework,
  loading,
  error,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onOpenReview,
  onRefresh,
}: HomeworkReviewQueueProps) {
  const allSelected = homework.length > 0 && selectedIds.size === homework.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < homework.length;

  /**
   * Handle quick approve (mark as reviewed without opening modal)
   */
  const handleQuickApprove = async (homeworkId: string) => {
    if (!confirm('Mark this homework as approved without detailed feedback?')) {
      return;
    }

    try {
      const response = await fetch(`/api/homework/${homeworkId}/review`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'APPROVED',
          feedback: 'Approved',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to approve homework');
      }

      onRefresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to approve homework');
    }
  };

  /**
   * Handle bulk approve
   */
  const handleBulkApprove = async () => {
    if (selectedIds.size === 0) return;

    if (
      !confirm(
        `Mark ${selectedIds.size} homework submission${
          selectedIds.size > 1 ? 's' : ''
        } as approved without detailed feedback?`
      )
    ) {
      return;
    }

    try {
      const promises = Array.from(selectedIds).map((id) =>
        fetch(`/api/homework/${id}/review`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'APPROVED',
            feedback: 'Approved',
          }),
        })
      );

      await Promise.all(promises);
      onRefresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to approve homework');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header with bulk actions */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Pending Review Queue
            </h2>
            {homework.length > 0 && (
              <span className="text-sm text-gray-500">
                {homework.length} submission{homework.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Bulk actions */}
          {selectedIds.size > 0 && (
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600">
                {selectedIds.size} selected
              </span>
              <button
                onClick={handleBulkApprove}
                className="px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Bulk Approve
              </button>
            </div>
          )}
        </div>

        {/* Select all checkbox */}
        {homework.length > 0 && (
          <div className="mt-3">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(input) => {
                  if (input) {
                    input.indeterminate = someSelected;
                  }
                }}
                onChange={onToggleSelectAll}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">
                {allSelected ? 'Deselect all' : 'Select all'}
              </span>
            </label>
          </div>
        )}
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
      {!loading && !error && homework.length === 0 && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🎉</div>
          <p className="text-gray-600 font-medium text-lg">No pending homework</p>
          <p className="text-sm text-gray-500 mt-1">
            All homework has been reviewed!
          </p>
        </div>
      )}

      {/* Homework cards */}
      {!loading && !error && homework.length > 0 && (
        <div className="divide-y divide-gray-200">
          {homework.map((hw) => (
            <div
              key={hw.id}
              className={`p-6 hover:bg-gray-50 transition-colors ${
                selectedIds.has(hw.id) ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-start space-x-4">
                {/* Checkbox */}
                <div className="flex-shrink-0 pt-1">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(hw.id)}
                    onChange={() => onToggleSelect(hw.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>

                {/* File icon */}
                <div className="flex-shrink-0 text-4xl">{getFileIcon(hw.fileName)}</div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Student info and time */}
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">
                        {hw.studentName}
                      </h3>
                      <p className="text-sm text-gray-500">{hw.studentEmail}</p>
                    </div>
                    <span className="text-sm text-gray-500 whitespace-nowrap ml-4">
                      {formatRelativeTime(hw.submittedAt)}
                    </span>
                  </div>

                  {/* File info */}
                  <div className="flex items-center space-x-4 mb-3">
                    <p className="text-sm text-gray-900 font-medium truncate">
                      {hw.fileName}
                    </p>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                      {getFileType(hw.fileName)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatFileSize(hw.fileSize)}
                    </span>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => onOpenReview(hw.id)}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Review
                    </button>
                    <button
                      onClick={() => handleQuickApprove(hw.id)}
                      className="px-4 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      Quick Approve
                    </button>
                    <a
                      href={hw.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      Download
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
