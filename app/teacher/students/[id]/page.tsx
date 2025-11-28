'use client';

/**
 * Teacher Student Detail Page
 *
 * Detailed view of a specific student with complete information
 */

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookingStatus, HomeworkStatus } from '@prisma/client';
import StudentHoursChart from '@/components/teacher/StudentHoursChart';

/**
 * Student detail interface
 */
interface StudentDetail {
  id: string;
  userId: string;
  name: string;
  email: string;
  active: boolean;
  governmentId: string;
  createdAt: string;
  totalAllowedHours: number;
  usedHours: number;
  remainingHours: number;
  isAssigned: boolean;
  assignedAt?: string;
  statistics: {
    bookings: {
      total: number;
      completed: number;
      upcoming: number;
      cancelled: number;
      noShow: number;
    };
    homework: {
      total: number;
      pending: number;
      approved: number;
      rejected: number;
      needsRevision: number;
    };
  };
  bookings: Array<{
    id: string;
    date: string;
    duration: number;
    status: BookingStatus;
    source: string;
    createdAt: string;
  }>;
  homework: Array<{
    id: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    status: HomeworkStatus;
    feedback: string | null;
    submittedAt: string;
    reviewedAt: string | null;
  }>;
}

/**
 * Format date
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format date and time
 */
function formatDateTime(dateString: string): string {
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
 * Get status badge color
 */
function getStatusColor(status: BookingStatus | HomeworkStatus): string {
  switch (status) {
    case 'COMPLETED':
    case 'APPROVED':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'CANCELLED':
    case 'REJECTED':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'NO_SHOW':
    case 'NEEDS_REVISION':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'SCHEDULED':
    case 'PENDING':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

/**
 * Teacher Student Detail Page
 */
export default function TeacherStudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params?.id as string;

  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch student details
  useEffect(() => {
    async function fetchStudent() {
      if (!studentId) return;

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/teacher/students/${studentId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch student details');
        }

        const result = await response.json();
        setStudent(result.data);
      } catch (err) {
        console.error('Error fetching student:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchStudent();
  }, [studentId]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading student details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !student) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center max-w-md">
          <p className="text-red-800 font-medium text-lg mb-2">
            Error loading student
          </p>
          <p className="text-red-600 text-sm mb-4">{error || 'Student not found'}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Go Back
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            href="/teacher/students"
            className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Students
          </Link>
        </div>

        {/* Header */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">
                  {student.name}
                </h1>
                {!student.active && (
                  <span className="px-3 py-1 text-sm font-medium bg-gray-200 text-gray-600 rounded-full">
                    Inactive
                  </span>
                )}
                {!student.isAssigned && (
                  <span className="px-3 py-1 text-sm font-medium bg-yellow-100 text-yellow-800 rounded-full">
                    Not Assigned
                  </span>
                )}
              </div>
              <p className="text-gray-600 mb-4">{student.email}</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Government ID:</span>
                  <p className="text-gray-900">{student.governmentId}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Member since:</span>
                  <p className="text-gray-900">{formatDate(student.createdAt)}</p>
                </div>
                {student.assignedAt && (
                  <div>
                    <span className="font-medium text-gray-700">
                      Assigned to you:
                    </span>
                    <p className="text-gray-900">
                      {formatDate(student.assignedAt)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Hours Chart */}
        <div className="mb-8">
          <StudentHoursChart
            totalAllowedHours={student.totalAllowedHours}
            usedHours={student.usedHours}
            remainingHours={student.remainingHours}
            studentName={student.name}
          />
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 text-center">
            <p className="text-sm font-medium text-gray-600 mb-2">
              Total Bookings
            </p>
            <p className="text-3xl font-bold text-gray-900">
              {student.statistics.bookings.total}
            </p>
          </div>
          <div className="bg-green-50 rounded-lg border border-green-200 p-6 text-center">
            <p className="text-sm font-medium text-green-700 mb-2">Completed</p>
            <p className="text-3xl font-bold text-green-900">
              {student.statistics.bookings.completed}
            </p>
          </div>
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-6 text-center">
            <p className="text-sm font-medium text-blue-700 mb-2">Upcoming</p>
            <p className="text-3xl font-bold text-blue-900">
              {student.statistics.bookings.upcoming}
            </p>
          </div>
          <div className="bg-purple-50 rounded-lg border border-purple-200 p-6 text-center">
            <p className="text-sm font-medium text-purple-700 mb-2">
              Pending HW
            </p>
            <p className="text-3xl font-bold text-purple-900">
              {student.statistics.homework.pending}
            </p>
          </div>
        </div>

        {/* Booking History */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Booking History
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {student.bookings.length} total{' '}
              {student.bookings.length === 1 ? 'booking' : 'bookings'}
            </p>
          </div>
          <div className="p-6">
            {student.bookings.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No bookings found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Source
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {student.bookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {formatDateTime(booking.date)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {booking.duration}{' '}
                          {booking.duration === 1 ? 'hour' : 'hours'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium border rounded-full ${getStatusColor(
                              booking.status
                            )}`}
                          >
                            {booking.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {booking.source}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Homework Submissions */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Homework Submissions
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {student.homework.length} total{' '}
              {student.homework.length === 1 ? 'submission' : 'submissions'}
            </p>
          </div>
          <div className="p-6">
            {student.homework.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No homework submissions found
              </div>
            ) : (
              <div className="space-y-4">
                {student.homework.map((hw) => (
                  <div
                    key={hw.id}
                    className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {hw.fileName}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          Submitted: {formatDateTime(hw.submittedAt)}
                        </p>
                        {hw.reviewedAt && (
                          <p className="text-sm text-gray-600">
                            Reviewed: {formatDateTime(hw.reviewedAt)}
                          </p>
                        )}
                        {hw.feedback && (
                          <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                            <strong className="text-gray-700">Feedback:</strong>
                            <p className="text-gray-600 mt-1">{hw.feedback}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span
                          className={`inline-flex px-3 py-1 text-xs font-medium border rounded-full ${getStatusColor(
                            hw.status
                          )}`}
                        >
                          {hw.status.replace('_', ' ')}
                        </span>
                        <a
                          href={hw.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Download
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
