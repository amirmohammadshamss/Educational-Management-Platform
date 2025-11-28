'use client';

/**
 * HomeworkReviewPanel Component
 *
 * Teacher interface for reviewing homework submissions
 * Features: filtering, file preview, review form, feedback submission
 */

import { useState, useEffect } from 'react';
import { HomeworkStatus } from '@prisma/client';
import HomeworkCard, { HomeworkData } from '@/components/shared/HomeworkCard';

/**
 * Component props
 */
interface HomeworkReviewPanelProps {
  teacherId: string;
}

/**
 * Review modal data
 */
interface ReviewModal {
  isOpen: boolean;
  homework: HomeworkData | null;
}

/**
 * HomeworkReviewPanel Component
 */
export default function HomeworkReviewPanel({
  teacherId,
}: HomeworkReviewPanelProps) {
  const [homework, setHomework] = useState<HomeworkData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [studentFilter, setStudentFilter] = useState<string>('');

  // Review modal
  const [reviewModal, setReviewModal] = useState<ReviewModal>({
    isOpen: false,
    homework: null,
  });
  const [reviewStatus, setReviewStatus] = useState<
    'APPROVED' | 'REJECTED' | 'NEEDS_REVISION'
  >('APPROVED');
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  /**
   * Fetch homework submissions
   */
  const fetchHomework = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        teacherId,
      });

      if (statusFilter) {
        params.append('status', statusFilter);
      }

      if (studentFilter) {
        params.append('studentId', studentFilter);
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
   * Fetch homework on mount and when filters change
   */
  useEffect(() => {
    fetchHomework();
  }, [teacherId, statusFilter, studentFilter]);

  /**
   * Open review modal
   */
  const handleReview = (homeworkId: string) => {
    const hw = homework.find((h) => h.id === homeworkId);
    if (hw) {
      setReviewModal({ isOpen: true, homework: hw });
      setReviewStatus('APPROVED');
      setFeedback('');
    }
  };

  /**
   * Close review modal
   */
  const closeReviewModal = () => {
    setReviewModal({ isOpen: false, homework: null });
    setReviewStatus('APPROVED');
    setFeedback('');
  };

  /**
   * Submit review
   */
  const handleSubmitReview = async () => {
    if (!reviewModal.homework) return;

    if (!feedback.trim()) {
      alert('Please provide feedback for the student');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(
        `/api/homework/${reviewModal.homework.id}/review`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: reviewStatus,
            feedback: feedback.trim(),
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit review');
      }

      // Update homework list
      await fetchHomework();

      alert('Review submitted successfully');
      closeReviewModal();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Handle view feedback
   */
  const handleViewFeedback = (homework: HomeworkData) => {
    // Open modal in view-only mode
    setReviewModal({ isOpen: true, homework });
    setReviewStatus(homework.status as 'APPROVED' | 'REJECTED' | 'NEEDS_REVISION');
    setFeedback(homework.feedback || '');
  };

  // Get unique students for filter
  const uniqueStudents = Array.from(
    new Set(homework.map((hw) => JSON.stringify({ id: hw.studentName, name: hw.studentName })))
  ).map((str) => JSON.parse(str));

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Homework Submissions
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Review and provide feedback on student homework
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        {/* Status filter */}
        <div className="flex-1 min-w-[200px]">
          <label
            htmlFor="status-filter"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Status
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="NEEDS_REVISION">Needs Revision</option>
          </select>
        </div>

        {/* Refresh button */}
        <div className="flex items-end">
          <button
            onClick={fetchHomework}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="text-gray-600">Loading homework submissions...</div>
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
          <div className="text-4xl mb-4">📋</div>
          <p className="text-gray-600 font-medium">No homework submissions</p>
          <p className="text-sm text-gray-500 mt-1">
            {statusFilter
              ? 'Try changing your filter'
              : 'No students have submitted homework yet'}
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
              userRole="TEACHER"
              onReview={handleReview}
              onViewFeedback={handleViewFeedback}
            />
          ))}
        </div>
      )}

      {/* Review Modal */}
      {reviewModal.isOpen && reviewModal.homework && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Review Homework
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {reviewModal.homework.fileName}
                  </p>
                </div>
                <button
                  onClick={closeReviewModal}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={submitting}
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
            <div className="p-6 space-y-6">
              {/* Student information */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">
                  Student Information
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <span className="font-medium text-gray-700 w-32">
                      Name:
                    </span>
                    <span className="text-gray-600">
                      {reviewModal.homework.studentName}
                    </span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="font-medium text-gray-700 w-32">
                      Submitted:
                    </span>
                    <span className="text-gray-600">
                      {new Date(
                        reviewModal.homework.submittedAt
                      ).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="font-medium text-gray-700 w-32">
                      File Size:
                    </span>
                    <span className="text-gray-600">
                      {(reviewModal.homework.fileSize / 1024 / 1024).toFixed(2)}{' '}
                      MB
                    </span>
                  </div>
                </div>
              </div>

              {/* File preview/download */}
              <div>
                <a
                  href={reviewModal.homework.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <svg
                    className="w-5 h-5 mr-2"
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
                  Download and View File
                </a>
              </div>

              {/* Review form - only show if pending */}
              {reviewModal.homework.status === 'PENDING' && (
                <>
                  {/* Status selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Review Status <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="status"
                          value="APPROVED"
                          checked={reviewStatus === 'APPROVED'}
                          onChange={(e) =>
                            setReviewStatus(
                              e.target.value as 'APPROVED' | 'REJECTED' | 'NEEDS_REVISION'
                            )
                          }
                          className="mr-3"
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            Approved
                          </div>
                          <div className="text-xs text-gray-500">
                            Homework meets all requirements
                          </div>
                        </div>
                      </label>

                      <label className="flex items-center p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="status"
                          value="NEEDS_REVISION"
                          checked={reviewStatus === 'NEEDS_REVISION'}
                          onChange={(e) =>
                            setReviewStatus(
                              e.target.value as 'APPROVED' | 'REJECTED' | 'NEEDS_REVISION'
                            )
                          }
                          className="mr-3"
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            Needs Revision
                          </div>
                          <div className="text-xs text-gray-500">
                            Student should revise and resubmit
                          </div>
                        </div>
                      </label>

                      <label className="flex items-center p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="status"
                          value="REJECTED"
                          checked={reviewStatus === 'REJECTED'}
                          onChange={(e) =>
                            setReviewStatus(
                              e.target.value as 'APPROVED' | 'REJECTED' | 'NEEDS_REVISION'
                            )
                          }
                          className="mr-3"
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            Rejected
                          </div>
                          <div className="text-xs text-gray-500">
                            Homework does not meet requirements
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Feedback textarea */}
                  <div>
                    <label
                      htmlFor="feedback"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Feedback <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="feedback"
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      rows={6}
                      maxLength={2000}
                      placeholder="Provide detailed feedback for the student..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      {feedback.length} / 2000 characters
                    </p>
                  </div>
                </>
              )}

              {/* Show existing feedback if already reviewed */}
              {reviewModal.homework.status !== 'PENDING' && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Previously Submitted Feedback:
                  </p>
                  <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">
                      {reviewModal.homework.feedback}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={closeReviewModal}
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Cancel
              </button>

              {reviewModal.homework.status === 'PENDING' && (
                <button
                  onClick={handleSubmitReview}
                  disabled={submitting || !feedback.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
