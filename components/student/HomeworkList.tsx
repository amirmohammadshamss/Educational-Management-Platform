'use client';

/**
 * HomeworkList Component
 *
 * Display list of student's submitted homework with filtering
 * Features: status filter, feedback viewing, delete pending homework
 */

import { useState, useEffect } from 'react';
import { HomeworkStatus } from '@prisma/client';
import HomeworkCard, { HomeworkData } from '@/components/shared/HomeworkCard';

/**
 * Component props
 */
interface HomeworkListProps {
  studentId: string;
}

/**
 * Feedback modal data
 */
interface FeedbackModal {
  isOpen: boolean;
  homework: HomeworkData | null;
}

/**
 * HomeworkList Component
 */
export default function HomeworkList({ studentId }: HomeworkListProps) {
  const [homework, setHomework] = useState<HomeworkData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [feedbackModal, setFeedbackModal] = useState<FeedbackModal>({
    isOpen: false,
    homework: null,
  });

  /**
   * Fetch homework submissions
   */
  const fetchHomework = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        studentId,
      });

      if (statusFilter) {
        params.append('status', statusFilter);
      }

      const response = await fetch(`/api/homework?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch homework');
      }

      const data = await response.json();
      setHomework(data.homework);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch homework on mount and when filter changes
   */
  useEffect(() => {
    fetchHomework();
  }, [studentId, statusFilter]);

  /**
   * Handle homework deletion
   */
  const handleDelete = async (homeworkId: string) => {
    try {
      const response = await fetch(`/api/homework/${homeworkId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete homework');
      }

      // Remove from list
      setHomework((prev) => prev.filter((hw) => hw.id !== homeworkId));
      alert('Homework deleted successfully');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete homework');
    }
  };

  /**
   * Handle view feedback
   */
  const handleViewFeedback = (homework: HomeworkData) => {
    setFeedbackModal({ isOpen: true, homework });
  };

  /**
   * Close feedback modal
   */
  const closeFeedbackModal = () => {
    setFeedbackModal({ isOpen: false, homework: null });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">My Homework</h2>
        <p className="mt-1 text-sm text-gray-600">
          View and manage your submitted homework
        </p>
      </div>

      {/* Filter */}
      <div className="mb-6">
        <label
          htmlFor="status-filter"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Filter by Status
        </label>
        <select
          id="status-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="NEEDS_REVISION">Needs Revision</option>
        </select>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="text-gray-600">Loading homework...</div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && homework.length === 0 && (
        <div className="text-center py-12 border border-gray-200 rounded-lg bg-gray-50">
          <div className="text-4xl mb-4">📚</div>
          <p className="text-gray-600 font-medium">No homework found</p>
          <p className="text-sm text-gray-500 mt-1">
            {statusFilter
              ? 'Try changing your filter'
              : 'Start by uploading your first homework'}
          </p>
        </div>
      )}

      {/* Homework list */}
      {!loading && !error && homework.length > 0 && (
        <div className="space-y-4">
          {homework.map((hw) => (
            <HomeworkCard
              key={hw.id}
              homework={hw}
              userRole="STUDENT"
              onDelete={handleDelete}
              onViewFeedback={handleViewFeedback}
            />
          ))}
        </div>
      )}

      {/* Feedback Modal */}
      {feedbackModal.isOpen && feedbackModal.homework && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Teacher Feedback
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {feedbackModal.homework.fileName}
                  </p>
                </div>
                <button
                  onClick={closeFeedbackModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal body */}
            <div className="p-6">
              {/* Status */}
              <div className="mb-4">
                <span className="text-sm font-medium text-gray-700">
                  Status:{' '}
                </span>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                    feedbackModal.homework.status === 'APPROVED'
                      ? 'bg-green-100 text-green-800 border-green-200'
                      : feedbackModal.homework.status === 'REJECTED'
                        ? 'bg-red-100 text-red-800 border-red-200'
                        : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                  }`}
                >
                  {feedbackModal.homework.status.replace('_', ' ')}
                </span>
              </div>

              {/* Teacher name */}
              <div className="mb-4">
                <span className="text-sm font-medium text-gray-700">
                  Teacher:{' '}
                </span>
                <span className="text-sm text-gray-600">
                  {feedbackModal.homework.teacherName}
                </span>
              </div>

              {/* Reviewed date */}
              {feedbackModal.homework.reviewedAt && (
                <div className="mb-4">
                  <span className="text-sm font-medium text-gray-700">
                    Reviewed:{' '}
                  </span>
                  <span className="text-sm text-gray-600">
                    {new Date(
                      feedbackModal.homework.reviewedAt
                    ).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              )}

              {/* Feedback */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Feedback:
                </p>
                <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">
                    {feedbackModal.homework.feedback}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={closeFeedbackModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
