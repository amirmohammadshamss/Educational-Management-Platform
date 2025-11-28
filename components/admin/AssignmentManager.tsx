'use client';

import { useState, useMemo } from 'react';
import StudentAssignmentCard from './StudentAssignmentCard';
import TeacherAssignmentCard from './TeacherAssignmentCard';

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

type AssignmentManagerProps = {
  students: Student[];
  teachers: TeacherWithStudents[];
  onRefresh: () => Promise<void>;
};

type AssignmentAction = {
  studentId: string;
  teacherId: string;
};

export default function AssignmentManager({
  students,
  teachers,
  onRefresh,
}: AssignmentManagerProps) {
  const [activeView, setActiveView] = useState<'student' | 'teacher'>('student');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [teacherSearchQuery, setTeacherSearchQuery] = useState('');
  const [studentFilter, setStudentFilter] = useState<'all' | 'assigned' | 'unassigned'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Selected items for bulk assignment
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null);

  // Show notification helper
  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // Filter students
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      // Search filter
      const matchesSearch =
        student.name.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
        student.governmentId.toLowerCase().includes(studentSearchQuery.toLowerCase());

      // Assignment filter
      const hasTeachers = student.teachers.length > 0;
      const matchesFilter =
        studentFilter === 'all' ||
        (studentFilter === 'assigned' && hasTeachers) ||
        (studentFilter === 'unassigned' && !hasTeachers);

      return matchesSearch && matchesFilter;
    });
  }, [students, studentSearchQuery, studentFilter]);

  // Filter teachers
  const filteredTeachers = useMemo(() => {
    return teachers.filter((teacher) => {
      const matchesSearch =
        teacher.name.toLowerCase().includes(teacherSearchQuery.toLowerCase()) ||
        teacher.email.toLowerCase().includes(teacherSearchQuery.toLowerCase());

      return matchesSearch;
    });
  }, [teachers, teacherSearchQuery]);

  // Handle removing a teacher from a student
  const handleRemoveTeacher = async (studentId: string, teacherId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/students/${studentId}/teachers/${teacherId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove teacher');
      }

      showNotification('success', 'Teacher removed successfully');
      await onRefresh();
    } catch (error) {
      console.error('Error removing teacher:', error);
      showNotification('error', error instanceof Error ? error.message : 'Failed to remove teacher');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle assigning a teacher to a student
  const handleAssignTeacher = async (studentId: string, teacherId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/students/${studentId}/assign-teacher`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to assign teacher');
      }

      showNotification('success', 'Teacher assigned successfully');
      await onRefresh();
    } catch (error) {
      console.error('Error assigning teacher:', error);
      showNotification('error', error instanceof Error ? error.message : 'Failed to assign teacher');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle bulk assignment
  const handleBulkAssignment = async () => {
    if (!selectedTeacher || selectedStudents.size === 0) {
      showNotification('error', 'Please select students and a teacher');
      return;
    }

    setIsLoading(true);
    try {
      const assignments = Array.from(selectedStudents).map((studentId) => ({
        studentId,
        teacherId: selectedTeacher,
      }));

      const response = await fetch('/api/admin/assignments/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignments }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to process bulk assignments');
      }

      const result = await response.json();
      showNotification(
        'success',
        `Successfully assigned ${result.summary.successful} students. ${
          result.summary.failed > 0 ? `${result.summary.failed} failed.` : ''
        }`
      );

      // Clear selections
      setSelectedStudents(new Set());
      setSelectedTeacher(null);

      await onRefresh();
    } catch (error) {
      console.error('Error with bulk assignment:', error);
      showNotification('error', error instanceof Error ? error.message : 'Failed to process bulk assignments');
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle student selection
  const toggleStudentSelection = (studentId: string) => {
    const newSelection = new Set(selectedStudents);
    if (newSelection.has(studentId)) {
      newSelection.delete(studentId);
    } else {
      newSelection.add(studentId);
    }
    setSelectedStudents(newSelection);
  };

  // Select all filtered students
  const selectAllStudents = () => {
    const allIds = new Set(filteredStudents.map((s) => s.id));
    setSelectedStudents(allIds);
  };

  // Clear all selections
  const clearSelections = () => {
    setSelectedStudents(new Set());
    setSelectedTeacher(null);
  };

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification && (
        <div
          className={`p-4 rounded-lg ${
            notification.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{notification.message}</p>
            <button
              onClick={() => setNotification(null)}
              className="text-current hover:opacity-70"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* View Selector */}
      <div className="flex items-center justify-between">
        <div className="inline-flex rounded-lg border border-gray-300 p-1">
          <button
            onClick={() => setActiveView('student')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeView === 'student'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Student View
          </button>
          <button
            onClick={() => setActiveView('teacher')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeView === 'teacher'
                ? 'bg-purple-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Teacher View
          </button>
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Bulk Assignment Panel */}
      {selectedStudents.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <p className="text-sm font-medium text-blue-900">
                {selectedStudents.size} student{selectedStudents.size > 1 ? 's' : ''} selected
              </p>
              {selectedTeacher && (
                <p className="text-sm text-blue-700">
                  → {teachers.find((t) => t.id === selectedTeacher)?.name}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleBulkAssignment}
                disabled={!selectedTeacher || isLoading}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Assign to Teacher
              </button>
              <button
                onClick={clearSelections}
                disabled={isLoading}
                className="px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student View */}
      {activeView === 'student' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Students Panel */}
          <div>
            <div className="mb-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Students ({filteredStudents.length})
                </h2>
                {selectedStudents.size > 0 && (
                  <button
                    onClick={selectAllStudents}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Select All Visible
                  </button>
                )}
              </div>

              <input
                type="text"
                placeholder="Search students..."
                value={studentSearchQuery}
                onChange={(e) => setStudentSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />

              <div className="flex space-x-2">
                <button
                  onClick={() => setStudentFilter('all')}
                  className={`px-3 py-1 text-sm rounded-full ${
                    studentFilter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setStudentFilter('assigned')}
                  className={`px-3 py-1 text-sm rounded-full ${
                    studentFilter === 'assigned'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Assigned
                </button>
                <button
                  onClick={() => setStudentFilter('unassigned')}
                  className={`px-3 py-1 text-sm rounded-full ${
                    studentFilter === 'unassigned'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Unassigned
                </button>
              </div>
            </div>

            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {filteredStudents.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
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
                  <p className="mt-2 text-sm text-gray-500">No students found</p>
                </div>
              ) : (
                filteredStudents.map((student) => (
                  <div key={student.id} className="relative">
                    {/* Selection checkbox */}
                    <div className="absolute top-4 left-4 z-10">
                      <input
                        type="checkbox"
                        checked={selectedStudents.has(student.id)}
                        onChange={() => toggleStudentSelection(student.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </div>
                    <div className="pl-8">
                      <StudentAssignmentCard
                        student={student}
                        onRemoveTeacher={handleRemoveTeacher}
                        onAssignTeacher={(studentId) => {
                          // Simple assignment mode - select and use bulk assign
                          setSelectedStudents(new Set([studentId]));
                        }}
                        isLoading={isLoading}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Teachers Panel */}
          <div>
            <div className="mb-4 space-y-3">
              <h2 className="text-lg font-semibold text-gray-900">
                Teachers ({filteredTeachers.length})
              </h2>

              <input
                type="text"
                placeholder="Search teachers..."
                value={teacherSearchQuery}
                onChange={(e) => setTeacherSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />

              {selectedStudents.size > 0 && (
                <p className="text-sm text-gray-600 bg-blue-50 p-2 rounded">
                  Select a teacher to assign {selectedStudents.size} student
                  {selectedStudents.size > 1 ? 's' : ''}
                </p>
              )}
            </div>

            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {filteredTeachers.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
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
                  <p className="mt-2 text-sm text-gray-500">No teachers found</p>
                </div>
              ) : (
                filteredTeachers.map((teacher) => (
                  <div
                    key={teacher.id}
                    className={`cursor-pointer transition-all ${
                      selectedTeacher === teacher.id
                        ? 'ring-2 ring-purple-500 rounded-lg'
                        : ''
                    }`}
                    onClick={() => setSelectedTeacher(teacher.id)}
                  >
                    <TeacherAssignmentCard
                      teacher={teacher}
                      onAddStudents={(teacherId) => setSelectedTeacher(teacherId)}
                      onRemoveStudent={async (teacherId, studentId) => {
                        await handleRemoveTeacher(studentId, teacherId);
                      }}
                      isLoading={isLoading}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Teacher View */}
      {activeView === 'teacher' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Teachers Panel */}
          <div>
            <div className="mb-4 space-y-3">
              <h2 className="text-lg font-semibold text-gray-900">
                Teachers ({filteredTeachers.length})
              </h2>

              <input
                type="text"
                placeholder="Search teachers..."
                value={teacherSearchQuery}
                onChange={(e) => setTeacherSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {filteredTeachers.map((teacher) => (
                <div
                  key={teacher.id}
                  className={`cursor-pointer transition-all ${
                    selectedTeacher === teacher.id
                      ? 'ring-2 ring-purple-500 rounded-lg'
                      : ''
                  }`}
                  onClick={() => setSelectedTeacher(teacher.id)}
                >
                  <TeacherAssignmentCard
                    teacher={teacher}
                    onAddStudents={(teacherId) => setSelectedTeacher(teacherId)}
                    onRemoveStudent={async (teacherId, studentId) => {
                      await handleRemoveTeacher(studentId, teacherId);
                    }}
                    isLoading={isLoading}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Students Panel */}
          <div>
            <div className="mb-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Students ({filteredStudents.length})
                </h2>
                {selectedStudents.size > 0 && selectedTeacher && (
                  <button
                    onClick={selectAllStudents}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Select All Visible
                  </button>
                )}
              </div>

              <input
                type="text"
                placeholder="Search students..."
                value={studentSearchQuery}
                onChange={(e) => setStudentSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />

              <div className="flex space-x-2">
                <button
                  onClick={() => setStudentFilter('all')}
                  className={`px-3 py-1 text-sm rounded-full ${
                    studentFilter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setStudentFilter('assigned')}
                  className={`px-3 py-1 text-sm rounded-full ${
                    studentFilter === 'assigned'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Assigned
                </button>
                <button
                  onClick={() => setStudentFilter('unassigned')}
                  className={`px-3 py-1 text-sm rounded-full ${
                    studentFilter === 'unassigned'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Unassigned
                </button>
              </div>

              {selectedTeacher && (
                <p className="text-sm text-gray-600 bg-purple-50 p-2 rounded">
                  Select students to assign to {teachers.find((t) => t.id === selectedTeacher)?.name}
                </p>
              )}
            </div>

            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {filteredStudents.map((student) => (
                <div key={student.id} className="relative">
                  {/* Selection checkbox */}
                  {selectedTeacher && (
                    <div className="absolute top-4 left-4 z-10">
                      <input
                        type="checkbox"
                        checked={selectedStudents.has(student.id)}
                        onChange={() => toggleStudentSelection(student.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </div>
                  )}
                  <div className={selectedTeacher ? 'pl-8' : ''}>
                    <StudentAssignmentCard
                      student={student}
                      onRemoveTeacher={handleRemoveTeacher}
                      onAssignTeacher={(studentId) => {
                        setSelectedStudents(new Set([studentId]));
                      }}
                      isLoading={isLoading}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
