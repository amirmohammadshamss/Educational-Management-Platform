'use client';

/**
 * Teacher Students Page
 *
 * Allows teachers to view all students and manage their assigned students
 */

import { useState, useEffect } from 'react';
import AllStudentsList from '@/components/teacher/AllStudentsList';
import MyStudentsList from '@/components/teacher/MyStudentsList';
import type { AllStudent } from '@/components/teacher/AllStudentsList';
import type { MyStudent } from '@/components/teacher/MyStudentsList';

/**
 * Teacher Students Page
 */
export default function TeacherStudentsPage() {
  // State
  const [allStudents, setAllStudents] = useState<AllStudent[]>([]);
  const [myStudents, setMyStudents] = useState<MyStudent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all students
  const fetchAllStudents = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`/api/teacher/students?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }

      const result = await response.json();
      setAllStudents(result.data || []);
    } catch (err) {
      console.error('Error fetching all students:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  // Fetch assigned students
  const fetchMyStudents = async () => {
    try {
      const response = await fetch('/api/teacher/students?assigned=true');

      if (!response.ok) {
        throw new Error('Failed to fetch assigned students');
      }

      const result = await response.json();
      setMyStudents(result.data || []);
    } catch (err) {
      console.error('Error fetching assigned students:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  // Initial load
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        await Promise.all([fetchAllStudents(), fetchMyStudents()]);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Fetch all students when search changes
  useEffect(() => {
    if (!loading) {
      fetchAllStudents();
    }
  }, [searchQuery]);

  // Handle assign student
  const handleAssignStudent = async (studentId: string) => {
    try {
      const response = await fetch('/api/teacher/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ studentId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to assign student');
      }

      // Refresh both lists
      await Promise.all([fetchAllStudents(), fetchMyStudents()]);
    } catch (err) {
      console.error('Error assigning student:', err);
      alert(err instanceof Error ? err.message : 'Failed to assign student');
      throw err;
    }
  };

  // Handle remove student
  const handleRemoveStudent = async (studentId: string) => {
    try {
      const response = await fetch(
        `/api/teacher/students?studentId=${studentId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove student');
      }

      // Refresh both lists
      await Promise.all([fetchAllStudents(), fetchMyStudents()]);
    } catch (err) {
      console.error('Error removing student:', err);
      alert(err instanceof Error ? err.message : 'Failed to remove student');
      throw err;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Students</h1>
          <p className="mt-2 text-gray-600">
            Manage your assigned students and view all available students
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Loading students...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center mb-8">
            <p className="text-red-800 font-medium">Error loading students</p>
            <p className="text-red-600 text-sm mt-2">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              Retry
            </button>
          </div>
        )}

        {/* Content */}
        {!loading && !error && (
          <div className="space-y-8">
            {/* My Students Section */}
            <div>
              <MyStudentsList
                students={myStudents}
                onRemoveStudent={handleRemoveStudent}
              />
            </div>

            {/* All Students Section */}
            <div>
              <AllStudentsList
                students={allStudents}
                onAssignStudent={handleAssignStudent}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />
            </div>

            {/* Help Section */}
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">
                💡 Quick Tips
              </h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>
                    <strong>Assign students</strong> to your list to track their
                    progress and manage their homework
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>
                    <strong>Monitor hours</strong> closely - students with low
                    remaining hours are highlighted
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>
                    <strong>Click "View Details"</strong> to see complete student
                    information, booking history, and homework submissions
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>
                    <strong>Remove students</strong> from your list at any time -
                    you can always add them back later
                  </span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
