'use client';

/**
 * AllStudentsList Component
 *
 * Displays all students in the system with option to assign to teacher's list
 */

import { useState } from 'react';

/**
 * Student data interface
 */
export interface AllStudent {
  id: string;
  userId: string;
  name: string;
  email: string;
  active: boolean;
  governmentId: string;
  totalAllowedHours: number;
  usedHours: number;
  remainingHours: number;
  isAssigned: boolean;
  assignedAt?: string;
}

/**
 * Component props
 */
interface AllStudentsListProps {
  students: AllStudent[];
  onAssignStudent: (studentId: string) => Promise<void>;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

/**
 * Get hours badge color
 */
function getHoursBadgeColor(remainingHours: number, totalHours: number): string {
  if (totalHours === 0) return 'text-gray-600';
  const percentage = (remainingHours / totalHours) * 100;

  if (percentage > 50) return 'text-green-600';
  if (percentage > 20) return 'text-yellow-600';
  if (percentage > 0) return 'text-red-600';
  return 'text-gray-600';
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
 * AllStudentsList Component
 */
export default function AllStudentsList({
  students,
  onAssignStudent,
  searchQuery,
  onSearchChange,
}: AllStudentsListProps) {
  const [assigningId, setAssigningId] = useState<string | null>(null);

  // Handle assign student
  const handleAssign = async (studentId: string) => {
    setAssigningId(studentId);
    try {
      await onAssignStudent(studentId);
    } catch (error) {
      console.error('Error assigning student:', error);
    } finally {
      setAssigningId(null);
    }
  };

  // Filter students
  const unassignedStudents = students.filter((s) => !s.isAssigned);

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-900">All Students</h2>
        <p className="text-sm text-gray-600 mt-1">
          {unassignedStudents.length} unassigned{' '}
          {unassignedStudents.length === 1 ? 'student' : 'students'} available
        </p>
      </div>

      {/* Search */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search students by name..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
      </div>

      {/* Students List */}
      <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
        {unassignedStudents.length === 0 ? (
          <div className="text-center py-12 px-6">
            <div className="text-6xl mb-4">👥</div>
            <p className="text-gray-600 font-medium">
              {searchQuery
                ? 'No students found matching your search'
                : 'All students are already assigned to you'}
            </p>
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="mt-4 text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          unassignedStudents.map((student) => {
            const hoursPercentage =
              student.totalAllowedHours > 0
                ? (student.remainingHours / student.totalAllowedHours) * 100
                : 0;

            return (
              <div
                key={student.id}
                className={`p-6 hover:bg-gray-50 transition-colors ${
                  !student.active ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Student Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {student.name}
                      </h3>
                      {!student.active && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-600 rounded-full">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 truncate mb-3">
                      {student.email}
                    </p>

                    {/* Hours Progress */}
                    <div className="mb-2">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-600">Training Hours</span>
                        <span
                          className={`font-semibold ${getHoursBadgeColor(
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

                    {/* Government ID */}
                    <p className="text-xs text-gray-500">
                      ID: {student.governmentId}
                    </p>
                  </div>

                  {/* Assign Button */}
                  <div className="flex-shrink-0">
                    <button
                      onClick={() => handleAssign(student.id)}
                      disabled={assigningId === student.id || !student.active}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {assigningId === student.id ? (
                        <span className="flex items-center gap-2">
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
                          Assigning...
                        </span>
                      ) : (
                        'Assign to My List'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
