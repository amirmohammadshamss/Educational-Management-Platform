'use client';

/**
 * HomeworkReviewModal Component
 *
 * Full-screen modal for reviewing homework submissions
 * Features: file preview, review form, navigation between submissions
 */

import { useState, useEffect } from 'react';
import { HomeworkStatus } from '@prisma/client';
import { Document, Page, pdfjs } from 'react-pdf';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

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
interface HomeworkReviewModalProps {
  homework: HomeworkData;
  isOpen: boolean;
  onClose: () => void;
  onReviewSubmit: () => void;
  onNavigate: (direction: 'next' | 'prev') => void;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * Get file type from filename
 */
function getFileType(fileName: string): 'pdf' | 'image' | 'other' {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  if (ext === 'pdf') return 'pdf';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
  return 'other';
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
 * HomeworkReviewModal Component
 */
export default function HomeworkReviewModal({
  homework,
  isOpen,
  onClose,
  onReviewSubmit,
  onNavigate,
  hasNext,
  hasPrevious,
}: HomeworkReviewModalProps) {
  const [reviewStatus, setReviewStatus] = useState<
    'APPROVED' | 'REJECTED' | 'NEEDS_REVISION'
  >('APPROVED');
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // PDF viewer state
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const fileType = getFileType(homework.fileName);
  const isPending = homework.status === 'PENDING';

  /**
   * Reset form when homework changes
   */
  useEffect(() => {
    setReviewStatus('APPROVED');
    setFeedback(homework.feedback || '');
    setPageNumber(1);
    setPdfError(null);
  }, [homework.id]);

  /**
   * Handle PDF document load success
   */
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPdfError(null);
  };

  /**
   * Handle PDF document load error
   */
  const onDocumentLoadError = (error: Error) => {
    console.error('PDF load error:', error);
    setPdfError('Failed to load PDF. You can still download and review it.');
  };

  /**
   * Handle review submission
   */
  const handleSubmit = async () => {
    if (!feedback.trim()) {
      alert('Please provide feedback for the student');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`/api/homework/${homework.id}/review`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: reviewStatus,
          feedback: feedback.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit review');
      }

      onReviewSubmit();
      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Handle keyboard navigation
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' && hasNext) {
        onNavigate('next');
      } else if (e.key === 'ArrowLeft' && hasPrevious) {
        onNavigate('prev');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, hasNext, hasPrevious, onNavigate, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full h-full max-w-7xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0 mr-4">
              <h2 className="text-xl font-bold text-gray-900 truncate">
                {homework.fileName}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Student: {homework.studentName} | Submitted:{' '}
                {new Date(homework.submittedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>

            {/* Navigation and close */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onNavigate('prev')}
                disabled={!hasPrevious}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-md disabled:opacity-40 disabled:cursor-not-allowed"
                title="Previous (←)"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => onNavigate('next')}
                disabled={!hasNext}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-md disabled:opacity-40 disabled:cursor-not-allowed"
                title="Next (→)"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"
                title="Close (Esc)"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 flex overflow-hidden">
          {/* File preview area */}
          <div className="flex-1 overflow-auto bg-gray-100 p-6">
            <div className="max-w-4xl mx-auto">
              {/* PDF Preview */}
              {fileType === 'pdf' && (
                <div className="bg-white rounded-lg shadow-sm">
                  {pdfError ? (
                    <div className="p-8 text-center">
                      <p className="text-red-600 mb-4">{pdfError}</p>
                      <a
                        href={homework.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100"
                      >
                        Download PDF
                      </a>
                    </div>
                  ) : (
                    <>
                      <Document
                        file={homework.fileUrl}
                        onLoadSuccess={onDocumentLoadSuccess}
                        onLoadError={onDocumentLoadError}
                        loading={
                          <div className="p-8 text-center text-gray-600">
                            Loading PDF...
                          </div>
                        }
                      >
                        <Page pageNumber={pageNumber} width={800} />
                      </Document>

                      {/* PDF navigation */}
                      {numPages && numPages > 1 && (
                        <div className="p-4 border-t border-gray-200 flex items-center justify-center space-x-4">
                          <button
                            onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                            disabled={pageNumber <= 1}
                            className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Previous
                          </button>
                          <span className="text-sm text-gray-600">
                            Page {pageNumber} of {numPages}
                          </span>
                          <button
                            onClick={() => setPageNumber((p) => Math.min(numPages, p + 1))}
                            disabled={pageNumber >= numPages}
                            className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Next
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Image Preview */}
              {fileType === 'image' && (
                <div className="bg-white rounded-lg shadow-sm p-4">
                  <img
                    src={homework.fileUrl}
                    alt={homework.fileName}
                    className="max-w-full h-auto mx-auto"
                  />
                </div>
              )}

              {/* Other file types */}
              {fileType === 'other' && (
                <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                  <div className="text-6xl mb-4">📎</div>
                  <p className="text-gray-600 mb-4">
                    Preview not available for this file type
                  </p>
                  <a
                    href={homework.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download File
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Review sidebar */}
          <div className="w-96 border-l border-gray-200 bg-white flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Student information */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Student Information
                </h3>
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">Name:</span>
                    <span className="ml-2 text-gray-600">{homework.studentName}</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">Email:</span>
                    <span className="ml-2 text-gray-600">{homework.studentEmail}</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">File Size:</span>
                    <span className="ml-2 text-gray-600">
                      {formatFileSize(homework.fileSize)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Review form or feedback display */}
              {isPending ? (
                <>
                  {/* Status selection */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      Review Status <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-2">
                      {[
                        {
                          value: 'APPROVED',
                          label: 'Approved',
                          description: 'Homework meets all requirements',
                          color: 'green',
                        },
                        {
                          value: 'NEEDS_REVISION',
                          label: 'Needs Revision',
                          description: 'Student should revise and resubmit',
                          color: 'yellow',
                        },
                        {
                          value: 'REJECTED',
                          label: 'Rejected',
                          description: 'Homework does not meet requirements',
                          color: 'red',
                        },
                      ].map((option) => (
                        <label
                          key={option.value}
                          className={`flex items-start p-3 border rounded-md cursor-pointer transition-colors ${
                            reviewStatus === option.value
                              ? `border-${option.color}-500 bg-${option.color}-50`
                              : 'border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="status"
                            value={option.value}
                            checked={reviewStatus === option.value}
                            onChange={(e) =>
                              setReviewStatus(
                                e.target.value as 'APPROVED' | 'REJECTED' | 'NEEDS_REVISION'
                              )
                            }
                            className="mt-0.5 mr-3 h-4 w-4"
                          />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {option.label}
                            </div>
                            <div className="text-xs text-gray-500">{option.description}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Feedback textarea */}
                  <div>
                    <label
                      htmlFor="feedback"
                      className="block text-sm font-semibold text-gray-900 mb-2"
                    >
                      Feedback <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="feedback"
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      rows={10}
                      maxLength={2000}
                      placeholder="Provide detailed feedback for the student..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      {feedback.length} / 2000 characters
                    </p>
                  </div>
                </>
              ) : (
                /* Display existing feedback */
                <div>
                  <div className="mb-3">
                    <span className="text-sm font-semibold text-gray-900">Status:</span>
                    <span
                      className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        homework.status === 'APPROVED'
                          ? 'bg-green-100 text-green-800'
                          : homework.status === 'REJECTED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {homework.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 mb-2">Feedback:</p>
                    <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">
                        {homework.feedback}
                      </p>
                    </div>
                  </div>
                  {homework.reviewedAt && (
                    <p className="text-xs text-gray-500 mt-2">
                      Reviewed on{' '}
                      {new Date(homework.reviewedAt).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="p-6 border-t border-gray-200 flex-shrink-0">
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isPending ? 'Cancel' : 'Close'}
                </button>

                {isPending && (
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || !feedback.trim()}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
