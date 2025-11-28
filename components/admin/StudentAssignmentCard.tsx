'use client';

import { useState } from 'react';

type Teacher = {
  id: string;
  name: string;
  email: string;
};

type Student = {
  id: string;
  name: string;
  email: string;
  governmentId: string;
  totalAllowedHours: number;
  usedHours: number;
  teachers: Teacher[];
};

type StudentAssignmentCardProps = {
  student: Student;
  onRemoveTeacher: (studentId: string, teacherId: string) => Promise<void>;
  onAssignTeacher: (studentId: string) => void;
  isLoading?: boolean;
};

export default function StudentAssignmentCard({
  student,
  onRemoveTeacher,
  onAssignTeacher,
  isLoading = false,
}: StudentAssignmentCardProps) {
  const [removingTeacherId, setRemovingTeacherId] = useState<string | null>(null);

  const handleRemoveTeacher = async (teacherId: string) => {
    if (isLoading || removingTeacherId) return;

    const confirmRemove = window.confirm(
      `Are you sure you want to remove this teacher assignment from ${student.name}?`
    );

    if (!confirmRemove) return;

    setRemovingTeacherId(teacherId);
    try {
      await onRemoveTeacher(student.id, teacherId);
    } catch (error) {
      console.error('Error removing teacher:', error);
    } finally {
      setRemovingTeacherId(null);
    }
  };

  const remainingHours = student.totalAllowedHours - student.usedHours;
  const usagePercentage = student.totalAllowedHours > 0
    ? (student.usedHours / student.totalAllowedHours) * 100
    : 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      {/* Student Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{student.name}</h3>
          <p className="text-sm text-gray-500">{student.email}</p>
          <p className="text-xs text-gray-400 mt-1">ID: {student.governmentId}</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {student.teachers.length} {student.teachers.length === 1 ? 'Teacher' : 'Teachers'}
          </span>
        </div>
      </div>

      {/* Hours Usage */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Training Hours</span>
          <span className="text-sm text-gray-600">
            {student.usedHours.toFixed(1)} / {student.totalAllowedHours.toFixed(1)} hours
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              usagePercentage >= 90
                ? 'bg-red-500'
                : usagePercentage >= 70
                ? 'bg-yellow-500'
                : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(usagePercentage, 100)}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {remainingHours.toFixed(1)} hours remaining
        </p>
      </div>

      {/* Assigned Teachers */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Assigned Teachers</h4>
        {student.teachers.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No teachers assigned</p>
        ) : (
          <div className="space-y-2">
            {student.teachers.map((teacher) => (
              <div
                key={teacher.id}
                className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{teacher.name}</p>
                  <p className="text-xs text-gray-500 truncate">{teacher.email}</p>
                </div>
                <button
                  onClick={() => handleRemoveTeacher(teacher.id)}
                  disabled={isLoading || removingTeacherId === teacher.id}
                  className="ml-2 p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Remove teacher"
                >
                  {removingTeacherId === teacher.id ? (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
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
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Button */}
      <button
        onClick={() => onAssignTeacher(student.id)}
        disabled={isLoading}
        className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
        <span>Assign New Teacher</span>
      </button>
    </div>
  );
}
