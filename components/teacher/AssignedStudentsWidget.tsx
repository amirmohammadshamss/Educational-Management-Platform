'use client';

/**
 * AssignedStudentsWidget Component
 *
 * Displays assigned students for a teacher
 * Shows count, student list with hours remaining, and filters
 */

import { useState } from 'react';
import Link from 'next/link';

/**
 * Student data interface
 */
export interface AssignedStudent {
  id: string;
  userId: string;
  name: string;
  email: string;
  active: boolean;
  totalAllowedHours: number;
  usedHours: number;
  remainingHours: number;
  pendingHomeworkCount: number;
}

/**
 * Component props
 */
interface AssignedStudentsWidgetProps {
  students: AssignedStudent[];
  lowHoursCount: number;
  manyPendingHomeworkCount: number;
}

/**
 * Filter type
 */
type FilterType = 'all' | 'low-hours' | 'pending-homework';

/**
 * Get progress bar color based on remaining hours percentage
 */
function getProgressColor(remainingHours: number, totalHours: number): string {
  if (totalHours === 0) return 'bg-gray-300';

  const percentage = (remainingHours / totalHours) * 100;

  if (percentage > 50) {
    return 'bg-green-500';
  } else if (percentage > 20) {
    return 'bg-yellow-500';
  } else if (percentage > 0) {
    return 'bg-red-500';
  } else {
    return 'bg-gray-300';
  }
}

/**
 * Get hours badge color
 */
function getHoursBadgeColor(
  remainingHours: number,
  totalHours: number
): string {
  if (totalHours === 0) return 'bg-gray-100 text-gray-700';

  const percentage = (remainingHours / totalHours) * 100;

  if (percentage > 50) {
    return 'bg-green-100 text-green-700';
  } else if (percentage > 20) {
    return 'bg-yellow-100 text-yellow-700';
  } else if (percentage > 0) {
    return 'bg-red-100 text-red-700';
  } else {
    return 'bg-gray-100 text-gray-700';
  }
}

/**
 * AssignedStudentsWidget Component
 */
export default function AssignedStudentsWidget({
  students,
  lowHoursCount,
  manyPendingHomeworkCount,
}: AssignedStudentsWidgetProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  // Filter students based on active filter
  const filteredStudents = students.filter((student) => {
    if (activeFilter === 'low-hours') {
      return student.remainingHours < 10 && student.remainingHours > 0;
    } else if (activeFilter === 'pending-homework') {
      return student.pendingHomeworkCount >= 3;
    }
    return true;
  });

  // Sort students: active first, then by name
  const sortedStudents = [...filteredStudents].sort((a, b) => {
    if (a.active !== b.active) {
      return a.active ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Assigned Students
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {students.length} {students.length === 1 ? 'student' : 'students'} assigned to you
            </p>
          </div>
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold text-lg">
            {students.length > 99 ? '99+' : students.length}
          </span>
        </div>
      </div>

      {/* Quick filters */}
      {students.length > 0 && (
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <p className="text-xs font-medium text-gray-700 mb-2">Quick Filters</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                activeFilter === 'all'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              All ({students.length})
            </button>
            <button
              onClick={() => setActiveFilter('low-hours')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                activeFilter === 'low-hours'
                  ? 'bg-red-600 text-white border-red-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Low Hours ({lowHoursCount})
            </button>
            <button
              onClick={() => setActiveFilter('pending-homework')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                activeFilter === 'pending-homework'
                  ? 'bg-orange-600 text-white border-orange-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Many Pending ({manyPendingHomeworkCount})
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {students.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">👥</div>
            <p className="text-gray-600 font-medium">No students assigned yet</p>
            <p className="text-sm text-gray-500 mt-2">
              Students will appear here once they are assigned to you.
            </p>
          </div>
        ) : sortedStudents.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-gray-600 font-medium">No students match this filter</p>
            <button
              onClick={() => setActiveFilter('all')}
              className="mt-4 text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              Clear filter
            </button>
          </div>
        ) : (
          <>
            {/* Students list */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {sortedStudents.map((student) => {
                const hoursPercentage =
                  student.totalAllowedHours > 0
                    ? (student.remainingHours / student.totalAllowedHours) * 100
                    : 0;

                return (
                  <div
                    key={student.id}
                    className={`p-4 border rounded-lg transition-all ${
                      student.active
                        ? 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'
                        : 'bg-gray-50 border-gray-200 opacity-75'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      {/* Student info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-gray-900 truncate">
                            {student.name}
                          </p>
                          {!student.active && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-600 rounded-full">
                              Inactive
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate mb-3">
                          {student.email}
                        </p>

                        {/* Hours progress bar */}
                        <div className="mb-2">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-gray-600">Training Hours</span>
                            <span
                              className={`px-2 py-0.5 rounded-full font-medium ${getHoursBadgeColor(
                                student.remainingHours,
                                student.totalAllowedHours
                              )}`}
                            >
                              {student.remainingHours.toFixed(1)}h remaining
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-2 rounded-full transition-all ${getProgressColor(
                                student.remainingHours,
                                student.totalAllowedHours
                              )}`}
                              style={{
                                width: `${Math.min(hoursPercentage, 100)}%`,
                              }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {student.usedHours.toFixed(1)}h used of{' '}
                            {student.totalAllowedHours.toFixed(1)}h total
                          </p>
                        </div>

                        {/* Pending homework count */}
                        {student.pendingHomeworkCount > 0 && (
                          <div className="flex items-center gap-1 text-xs text-orange-600 mt-2">
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
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                              />
                            </svg>
                            <span>
                              {student.pendingHomeworkCount} pending homework{' '}
                              {student.pendingHomeworkCount === 1
                                ? 'submission'
                                : 'submissions'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* View all link */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <Link
                href="/teacher/students"
                className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                View All Students
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
            </div>
          </>
        )}
      </div>
    </div>
  );
}
