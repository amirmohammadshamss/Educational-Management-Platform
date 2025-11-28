'use client';

/**
 * PendingHomeworkWidget Component
 *
 * Displays pending homework submissions for a teacher
 * Shows count, recent submissions, and quick review actions
 */

import Link from 'next/link';
import { HomeworkStatus } from '@prisma/client';

/**
 * Homework submission interface
 */
export interface PendingHomework {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  status: HomeworkStatus;
  submittedAt: string;
  student: {
    id: string;
    name: string;
    email: string;
  };
}

/**
 * Component props
 */
interface PendingHomeworkWidgetProps {
  homework: PendingHomework[];
  totalPendingCount: number;
  onQuickReview?: (homeworkId: string) => void;
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
 * Format date to relative time
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days > 0) {
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  } else if (hours > 0) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  } else if (minutes > 0) {
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  } else {
    return 'Just now';
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
      return '🖼️';
    default:
      return '📎';
  }
}

/**
 * PendingHomeworkWidget Component
 */
export default function PendingHomeworkWidget({
  homework,
  totalPendingCount,
  onQuickReview,
}: PendingHomeworkWidgetProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Pending Homework Reviews
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {totalPendingCount} {totalPendingCount === 1 ? 'submission' : 'submissions'} waiting for review
            </p>
          </div>
          {totalPendingCount > 0 && (
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-red-100 text-red-700 font-bold text-lg">
              {totalPendingCount > 99 ? '99+' : totalPendingCount}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {homework.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">✅</div>
            <p className="text-gray-600 font-medium">All caught up!</p>
            <p className="text-sm text-gray-500 mt-2">
              No pending homework reviews at the moment.
            </p>
            <Link
              href="/teacher/homework"
              className="inline-block mt-4 text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              View All Homework →
            </Link>
          </div>
        ) : (
          <>
            {/* Recent submissions list */}
            <div className="space-y-3">
              {homework.map((hw) => (
                <div
                  key={hw.id}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* File info */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="text-3xl flex-shrink-0">
                        {getFileIcon(hw.fileName)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 truncate">
                          {hw.student.name}
                        </p>
                        <p className="text-sm text-gray-600 truncate mt-0.5">
                          {hw.fileName}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                          <span>{formatFileSize(hw.fileSize)}</span>
                          <span>•</span>
                          <span>{formatRelativeTime(hw.submittedAt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <a
                        href={hw.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                      >
                        Download
                      </a>
                      {onQuickReview && (
                        <button
                          onClick={() => onQuickReview(hw.id)}
                          className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          Review
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* View all link */}
            <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-between">
              <Link
                href="/teacher/homework"
                className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                View All Homework
                <svg
                  className="ml-1 w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
              {totalPendingCount > homework.length && (
                <p className="text-xs text-gray-500">
                  +{totalPendingCount - homework.length} more pending
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
