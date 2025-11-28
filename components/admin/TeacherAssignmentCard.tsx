'use client';

type Student = {
  id: string;
  name: string;
  email: string;
  usedHours: number;
  totalAllowedHours: number;
};

type Teacher = {
  id: string;
  name: string;
  email: string;
  students: Student[];
};

type TeacherAssignmentCardProps = {
  teacher: Teacher;
  onAddStudents: (teacherId: string) => void;
  onRemoveStudent: (teacherId: string, studentId: string) => Promise<void>;
  isLoading?: boolean;
};

export default function TeacherAssignmentCard({
  teacher,
  onAddStudents,
  onRemoveStudent,
  isLoading = false,
}: TeacherAssignmentCardProps) {
  const handleRemoveStudent = async (studentId: string) => {
    if (isLoading) return;

    const student = teacher.students.find((s) => s.id === studentId);
    const confirmRemove = window.confirm(
      `Are you sure you want to remove ${student?.name || 'this student'} from ${teacher.name}?`
    );

    if (!confirmRemove) return;

    try {
      await onRemoveStudent(teacher.id, studentId);
    } catch (error) {
      console.error('Error removing student:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      {/* Teacher Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{teacher.name}</h3>
          <p className="text-sm text-gray-500">{teacher.email}</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            {teacher.students.length} {teacher.students.length === 1 ? 'Student' : 'Students'}
          </span>
        </div>
      </div>

      {/* Assigned Students */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Assigned Students</h4>
        {teacher.students.length === 0 ? (
          <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
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
            <p className="mt-2 text-sm text-gray-500 italic">No students assigned</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {teacher.students.map((student) => {
              const remainingHours = student.totalAllowedHours - student.usedHours;
              const usagePercentage = student.totalAllowedHours > 0
                ? (student.usedHours / student.totalAllowedHours) * 100
                : 0;

              return (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {student.name}
                      </p>
                      <span
                        className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          usagePercentage >= 90
                            ? 'bg-red-100 text-red-800'
                            : usagePercentage >= 70
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {remainingHours.toFixed(1)}h left
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{student.email}</p>
                    <div className="mt-1 w-full bg-gray-200 rounded-full h-1">
                      <div
                        className={`h-1 rounded-full transition-all ${
                          usagePercentage >= 90
                            ? 'bg-red-500'
                            : usagePercentage >= 70
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveStudent(student.id)}
                    disabled={isLoading}
                    className="ml-3 p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Remove student"
                  >
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
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Action Button */}
      <button
        onClick={() => onAddStudents(teacher.id)}
        disabled={isLoading}
        className="w-full px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
        <span>Add Students</span>
      </button>
    </div>
  );
}
