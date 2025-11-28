'use client';

import { useEffect, useState } from 'react';
import AssignmentManager from '@/components/admin/AssignmentManager';

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

type TeacherWithStudents = {
  id: string;
  name: string;
  email: string;
  students: Array<{
    id: string;
    name: string;
    email: string;
    usedHours: number;
    totalAllowedHours: number;
  }>;
};

export default function AssignmentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<TeacherWithStudents[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch students with their assigned teachers
  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/students');
      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }
      const data = await response.json();

      // Transform the data to include teacher info
      const studentsWithTeachers = await Promise.all(
        data.students.map(async (student: any) => {
          // Fetch teachers for this student
          const teachersResponse = await fetch(`/api/students/${student.id}/teachers`);
          let teachers: Teacher[] = [];

          if (teachersResponse.ok) {
            const teachersData = await teachersResponse.json();
            // API returns teachers array with id, name, email directly
            teachers = (teachersData.teachers || []).map((t: any) => ({
              id: t.id,
              name: t.name,
              email: t.email,
            }));
          }

          return {
            id: student.id,
            name: student.user?.name || 'Unknown',
            email: student.user?.email || '',
            governmentId: student.governmentId,
            totalAllowedHours: student.totalAllowedHours,
            usedHours: student.usedHours,
            teachers,
          };
        })
      );

      setStudents(studentsWithTeachers);
    } catch (err) {
      console.error('Error fetching students:', err);
      throw err;
    }
  };

  // Fetch teachers with their assigned students
  const fetchTeachers = async () => {
    try {
      const response = await fetch('/api/teachers');
      if (!response.ok) {
        throw new Error('Failed to fetch teachers');
      }
      const data = await response.json();

      // Transform the data to include student info
      const teachersWithStudents = await Promise.all(
        data.teachers.map(async (teacher: any) => {
          // Fetch students for this teacher
          const studentsResponse = await fetch(`/api/teachers/${teacher.id}/students`);
          let students: Array<{
            id: string;
            name: string;
            email: string;
            usedHours: number;
            totalAllowedHours: number;
          }> = [];

          if (studentsResponse.ok) {
            const studentsData = await studentsResponse.json();
            // API returns students array with student object nested
            students =
              studentsData.students?.map((s: any) => ({
                id: s.student?.id || s.id,
                name: s.student?.user?.name || 'Unknown',
                email: s.student?.user?.email || '',
                usedHours: s.student?.usedHours || 0,
                totalAllowedHours: s.student?.totalAllowedHours || 0,
              })) || [];
          }

          return {
            id: teacher.id,
            name: teacher.user?.name || 'Unknown',
            email: teacher.user?.email || '',
            students,
          };
        })
      );

      setTeachers(teachersWithStudents);
    } catch (err) {
      console.error('Error fetching teachers:', err);
      throw err;
    }
  };

  // Fetch all data
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await Promise.all([fetchStudents(), fetchTeachers()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <svg
                  className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4"
                  viewBox="0 0 24 24"
                >
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
                <p className="text-gray-600">Loading assignments...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-red-500 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Data</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={fetchData}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Student-Teacher Assignments</h1>
          <p className="mt-2 text-gray-600">
            Manage student-teacher assignments. Assign students to teachers individually or in bulk.
          </p>

          {/* Statistics */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Students</p>
                  <p className="mt-1 text-2xl font-semibold text-gray-900">{students.length}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <svg
                    className="w-6 h-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Teachers</p>
                  <p className="mt-1 text-2xl font-semibold text-gray-900">{teachers.length}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <svg
                    className="w-6 h-6 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Assigned Students</p>
                  <p className="mt-1 text-2xl font-semibold text-gray-900">
                    {students.filter((s) => s.teachers.length > 0).length}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <svg
                    className="w-6 h-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Unassigned Students</p>
                  <p className="mt-1 text-2xl font-semibold text-gray-900">
                    {students.filter((s) => s.teachers.length === 0).length}
                  </p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <svg
                    className="w-6 h-6 text-yellow-600"
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
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Assignment Manager */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <AssignmentManager
            students={students}
            teachers={teachers}
            onRefresh={fetchData}
          />
        </div>
      </div>
    </div>
  );
}
