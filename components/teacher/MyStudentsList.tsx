'use client';

/**
 * MyStudentsList Component
 *
 * Displays teacher's assigned students with detailed information
 */

import { useState } from 'react';
import Link from 'next/link';

/**
 * Student data interface
 */
export interface MyStudent {
  id: string;
  userId: string;
  name: string;
  email: string;
  active: boolean;
  totalAllowedHours: number;
  usedHours: number;
  remainingHours: number;
  recentBookingsCount: number;
  pendingHomeworkCount: number;
  assignedAt?: string;
}

/**
 * Component props
 */
interface MyStudentsListProps {
  students: MyStudent[];
  onRemoveStudent?: (studentId: string) => Promise<void>;
}

/**
 * Get hours badge color
 */
function getHoursBadgeColor(remainingHours: number, totalHours: number): string {
  if (totalHours === 0) return 'bg-gray-100 text-gray-700';
  const percentage = (remainingHours / totalHours) * 100;

  if (percentage > 50) return 'bg-green-100 text-green-700';
  if (percentage > 20) return 'bg-yellow-100 text-yellow-700';
  if (percentage > 0) return 'bg-red-100 text-red-700';
  return 'bg-gray-100 text-gray-700';
}

/**
 * Get progress bar color
 */
function getProgressColor(remainingHours: number, totalHours: number): string {
  if (totalHours === 0) return 'bg-gray-300';
  const percentage = (remainingHours / totalHours) * 100;

  if (percentage > 50) return 'bg-green-500';
  if (percentage > 20) return 'bg-yellow-500';
  if (percentage > 0) return 'bg-red-500';
  return 'bg-gray-300';
}

/**
 * Format date to relative time
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  if (months > 0) {
    return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  } else if (weeks > 0) {
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  } else if (days > 0) {
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  } else {
    return 'Today';
  }
}

/**
 * MyStudentsList Component
 */
export default function MyStudentsList({
  students,
  onRemoveStudent,
}: MyStudentsListProps) {
  const [removingId, setRemovingId] = useState<string | null>(null);

  // Handle remove student
  const handleRemove = async (studentId: string, studentName: string) => {
    if (!onRemoveStudent) return;

    if (
      !confirm(
        `Are you sure you want to remove ${studentName} from your list? You can always add them back later.`
      )
    ) {
      return;
    }

    setRemovingId(studentId);
    try {
      await onRemoveStudent(studentId);
    } catch (error) {
      console.error('Error removing student:', error);
      alert('Failed to remove student. Please try again.');
    } finally {
      setRemovingId(null);
    }
  };

  // Sort students: active first, then by remaining hours
  const sortedStudents = [...students].sort((a, b) => {
    if (a.active !== b.active) {
      return a.active ? -1 : 1;
    }
    return a.remainingHours - b.remainingHours;
  });

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-900">My Students</h2>
        <p className="text-sm text-gray-600 mt-1">
          {students.length} {students.length === 1 ? 'student' : 'students'} assigned to you
        </p>
      </div>

      {/* Students Grid */}
      <div className="p-6">
        {students.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👥</div>
            <p className="text-gray-600 font-medium">No students assigned yet</p>
            <p className="text-sm text-gray-500 mt-2">
              Start by assigning students from the "All Students" section above.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedStudents.map((student) => {
              const hoursPercentage =
                student.totalAllowedHours > 0
                  ? (student.remainingHours / student.totalAllowedHours) * 100
                  : 0;

              return (
                <div
                  key={student.id}
                  className={`bg-white border-2 border-gray-200 rounded-lg p-5 hover:shadow-lg transition-all ${
                    !student.active ? 'opacity-60' : ''
                  }`}
                >
                  {/* Student Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-gray-900 truncate">
                          {student.name}
                        </h3>
                        {!student.active && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-600 rounded-full">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 truncate">
                        {student.email}
                      </p>
                      {student.assignedAt && (
                        <p className="text-xs text-gray-500 mt-1">
                          Assigned {formatRelativeTime(student.assignedAt)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Hours Progress */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-semibold text-gray-700">
                        Training Hours
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full font-semibold ${getHoursBadgeColor(
                          student.remainingHours,
                          student.totalAllowedHours
                        )}`}
                      >
                        {student.remainingHours.toFixed(1)}h left
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden mb-2">
                      <div
                        className={`h-3 rounded-full transition-all ${getProgressColor(
                          student.remainingHours,
                          student.totalAllowedHours
                        )}`}
                        style={{
                          width: `${Math.min(hoursPercentage, 100)}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>{student.usedHours.toFixed(1)}h used</span>
                      <span>{student.totalAllowedHours.toFixed(1)}h total</span>
                    </div>
                  </div>

                  {/* Statistics */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                      <p className="text-xs text-blue-700 font-medium mb-1">
                        Recent Bookings
                      </p>
                      <p className="text-2xl font-bold text-blue-900">
                        {student.recentBookingsCount}
                      </p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
                      <p className="text-xs text-purple-700 font-medium mb-1">
                        Pending HW
                      </p>
                      <p className="text-2xl font-bold text-purple-900">
                        {student.pendingHomeworkCount}
                      </p>
                    </div>
                  </div>

                  {/* Warnings */}
                  {student.remainingHours < student.totalAllowedHours * 0.2 &&
                    student.remainingHours > 0 && (
                      <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                        <strong>⚠️ Low hours:</strong> Less than 20% remaining
                      </div>
                    )}

                  {student.remainingHours <= 0 && (
                    <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800">
                      <strong>❌ No hours:</strong> All hours have been used
                    </div>
                  )}

                  {student.pendingHomeworkCount >= 3 && (
                    <div className="mb-4 p-2 bg-orange-50 border border-orange-200 rounded text-xs text-orange-800">
                      <strong>📝 Action needed:</strong> Multiple pending homework
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Link
                      href={`/teacher/students/${student.id}`}
                      className="flex-1 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center transition-colors"
                    >
                      View Details
                    </Link>
                    {onRemoveStudent && (
                      <button
                        onClick={() => handleRemove(student.id, student.name)}
                        disabled={removingId === student.id}
                        className="px-3 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Remove from my list"
                      >
                        {removingId === student.id ? (
                          <svg
                            className="animate-spin h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                        ) : (
                          <svg
                            className="w-4 h-4"
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
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
