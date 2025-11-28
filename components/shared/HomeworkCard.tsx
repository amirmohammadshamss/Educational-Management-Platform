'use client';

/**
 * HomeworkCard Component
 *
 * Reusable card component for displaying homework submissions
 * Shows file info, status, metadata, and role-based actions
 */

import { HomeworkStatus } from '@prisma/client';

/**
 * Homework data interface
 */
export interface HomeworkData {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  status: HomeworkStatus;
  studentName: string;
  teacherName: string;
  submittedAt: string;
  reviewedAt?: string | null;
  feedback?: string | null;
}

/**
 * Component props
 */
interface HomeworkCardProps {
  homework: HomeworkData;
  userRole: 'STUDENT' | 'TEACHER' | 'ADMIN';
  onDelete?: (id: string) => void;
  onReview?: (id: string) => void;
  onViewFeedback?: (homework: HomeworkData) => void;
}

/**
 * Get file icon based on file type
 */
function getFileIcon(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();

  switch (ext) {
    case 'pdf':
      return '📄'; // PDF icon
    case 'doc':
    case 'docx':
      return '📝'; // Word icon
    case 'jpg':
    case 'jpeg':
    case 'png':
      return '🖼️'; // Image icon
    default:
      return '📎'; // Generic file icon
  }
}

/**
 * Get status badge color
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
 * Format date to readable string
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * HomeworkCard Component
 */
export default function HomeworkCard({
  homework,
  userRole,
  onDelete,
  onReview,
  onViewFeedback,
}: HomeworkCardProps) {
  const canDelete =
    userRole === 'ADMIN' ||
    (userRole === 'STUDENT' && homework.status === 'PENDING');
  const canReview =
    (userRole === 'TEACHER' || userRole === 'ADMIN') &&
    homework.status === 'PENDING';
  const hasFeedback = homework.feedback && homework.feedback.length > 0;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow p-6">
      {/* Header: File icon and name */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-3">
          <div className="text-4xl">{getFileIcon(homework.fileName)}</div>
          <div>
            <h3 className="font-semibold text-gray-900 break-all">
              {homework.fileName}
            </h3>
            <p className="text-sm text-gray-500">
              {formatFileSize(homework.fileSize)}
            </p>
          </div>
        </div>

        {/* Status badge */}
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
            homework.status
          )}`}
        >
          {homework.status.replace('_', ' ')}
        </span>
      </div>

      {/* Metadata */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm">
          <span className="font-medium text-gray-700 w-24">Student:</span>
          <span className="text-gray-600">{homework.studentName}</span>
        </div>
        <div className="flex items-center text-sm">
          <span className="font-medium text-gray-700 w-24">Teacher:</span>
          <span className="text-gray-600">{homework.teacherName}</span>
        </div>
        <div className="flex items-center text-sm">
          <span className="font-medium text-gray-700 w-24">Submitted:</span>
          <span className="text-gray-600">
            {formatDate(homework.submittedAt)}
          </span>
        </div>
        {homework.reviewedAt && (
          <div className="flex items-center text-sm">
            <span className="font-medium text-gray-700 w-24">Reviewed:</span>
            <span className="text-gray-600">
              {formatDate(homework.reviewedAt)}
            </span>
          </div>
        )}
      </div>

      {/* Feedback preview */}
      {hasFeedback && (
        <div className="mb-4 p-3 bg-gray-50 rounded-md border border-gray-200">
          <p className="text-sm font-medium text-gray-700 mb-1">Feedback:</p>
          <p className="text-sm text-gray-600 line-clamp-2">
            {homework.feedback}
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        {/* Download button */}
        <a
          href={homework.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Download
        </a>

        {/* View feedback button */}
        {hasFeedback && onViewFeedback && (
          <button
            onClick={() => onViewFeedback(homework)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            View Feedback
          </button>
        )}

        {/* Review button (Teacher/Admin) */}
        {canReview && onReview && (
          <button
            onClick={() => onReview(homework.id)}
            className="px-4 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            Review
          </button>
        )}

        {/* Delete button */}
        {canDelete && onDelete && (
          <button
            onClick={() => {
              if (
                confirm(
                  'Are you sure you want to delete this homework? This action cannot be undone.'
                )
              ) {
                onDelete(homework.id);
              }
            }}
            className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
