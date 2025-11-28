'use client';

/**
 * Teacher Homework Review Page
 *
 * Comprehensive homework review interface with tabs, filters, and batch actions
 */

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import HomeworkReviewQueue from '@/components/teacher/HomeworkReviewQueue';
import ReviewedHomeworkList from '@/components/teacher/ReviewedHomeworkList';
import HomeworkReviewModal from '@/components/teacher/HomeworkReviewModal';
import { HomeworkStatus } from '@prisma/client';

/**
 * Tab type
 */
type TabType = 'pending' | 'reviewed' | 'all';

/**
 * Homework data interface
 */
export interface HomeworkData {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  teacherId: string;
  teacherName: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  status: HomeworkStatus;
  feedback?: string | null;
  submittedAt: string;
  reviewedAt?: string | null;
  updatedAt: string;
}

/**
 * Sort option type
 */
type SortOption = 'newest' | 'oldest';

/**
 * Teacher Homework Page Component
 */
export default function TeacherHomeworkPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [homework, setHomework] = useState<HomeworkData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [studentFilter, setStudentFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [sortOption, setSortOption] = useState<SortOption>('newest');

  // Review modal
  const [selectedHomework, setSelectedHomework] = useState<HomeworkData | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  // Selected homework for bulk actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  /**
   * Fetch homework based on active tab and filters
   */
  const fetchHomework = async () => {
    if (!session?.user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      // Apply status filter based on tab
      if (activeTab === 'pending') {
        params.append('status', 'PENDING');
      } else if (activeTab === 'reviewed') {
        params.append('status', 'APPROVED');
        params.append('status', 'REJECTED');
        params.append('status', 'NEEDS_REVISION');
      }
      // 'all' tab doesn't filter by status

      // Apply student filter
      if (studentFilter) {
        params.append('studentId', studentFilter);
      }

      // Fetch with large limit to get all homework
      params.append('limit', '100');

      const response = await fetch(`/api/homework?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch homework');
      }

      const data = await response.json();
      let fetchedHomework = data.homework as HomeworkData[];

      // Apply date filter (client-side)
      if (dateFilter) {
        const filterDate = new Date(dateFilter);
        fetchedHomework = fetchedHomework.filter((hw) => {
          const submittedDate = new Date(hw.submittedAt);
          return (
            submittedDate.getFullYear() === filterDate.getFullYear() &&
            submittedDate.getMonth() === filterDate.getMonth() &&
            submittedDate.getDate() === filterDate.getDate()
          );
        });
      }

      // Apply sort
      fetchedHomework.sort((a, b) => {
        const dateA = new Date(a.submittedAt).getTime();
        const dateB = new Date(b.submittedAt).getTime();
        return sortOption === 'newest' ? dateB - dateA : dateA - dateB;
      });

      setHomework(fetchedHomework);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch homework when tab, filters, or sort changes
   */
  useEffect(() => {
    fetchHomework();
  }, [activeTab, studentFilter, dateFilter, sortOption, session]);

  /**
   * Open review modal
   */
  const handleOpenReview = (homeworkId: string) => {
    const hw = homework.find((h) => h.id === homeworkId);
    if (hw) {
      setSelectedHomework(hw);
      setReviewModalOpen(true);
    }
  };

  /**
   * Close review modal
   */
  const handleCloseReview = () => {
    setSelectedHomework(null);
    setReviewModalOpen(false);
  };

  /**
   * Handle review submission
   */
  const handleReviewSubmit = async () => {
    await fetchHomework();
    setSelectedIds(new Set()); // Clear selection after review
  };

  /**
   * Handle navigate to next/previous homework in modal
   */
  const handleNavigate = (direction: 'next' | 'prev') => {
    if (!selectedHomework) return;

    const currentIndex = homework.findIndex((hw) => hw.id === selectedHomework.id);
    let newIndex: number;

    if (direction === 'next') {
      newIndex = currentIndex < homework.length - 1 ? currentIndex + 1 : 0;
    } else {
      newIndex = currentIndex > 0 ? currentIndex - 1 : homework.length - 1;
    }

    setSelectedHomework(homework[newIndex]);
  };

  /**
   * Toggle homework selection for bulk actions
   */
  const handleToggleSelect = (homeworkId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(homeworkId)) {
      newSelected.delete(homeworkId);
    } else {
      newSelected.add(homeworkId);
    }
    setSelectedIds(newSelected);
  };

  /**
   * Select/deselect all homework
   */
  const handleToggleSelectAll = () => {
    if (selectedIds.size === homework.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(homework.map((hw) => hw.id)));
    }
  };

  /**
   * Get unique students for filter dropdown
   */
  const uniqueStudents = Array.from(
    new Map(homework.map((hw) => [hw.studentId, { id: hw.studentId, name: hw.studentName }])).values()
  );

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading session...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Homework Review</h1>
        <p className="mt-2 text-gray-600">
          Review and provide feedback on student homework submissions
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('pending')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'pending'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Pending Review
            {homework.filter((hw) => hw.status === 'PENDING').length > 0 && (
              <span className="ml-2 bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs">
                {homework.filter((hw) => hw.status === 'PENDING').length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('reviewed')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'reviewed'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Reviewed
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'all'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            All
          </button>
        </nav>
      </div>

      {/* Filters and Sort */}
      <div className="mb-6 bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <div className="flex flex-wrap gap-4">
          {/* Student filter */}
          <div className="flex-1 min-w-[200px]">
            <label
              htmlFor="student-filter"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Filter by Student
            </label>
            <select
              id="student-filter"
              value={studentFilter}
              onChange={(e) => setStudentFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">All Students</option>
              {uniqueStudents.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date filter */}
          <div className="flex-1 min-w-[200px]">
            <label
              htmlFor="date-filter"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Filter by Date
            </label>
            <input
              type="date"
              id="date-filter"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* Sort options */}
          <div className="flex-1 min-w-[200px]">
            <label
              htmlFor="sort-option"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Sort By
            </label>
            <select
              id="sort-option"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>

          {/* Clear filters */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setStudentFilter('');
                setDateFilter('');
                setSortOption('newest');
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'pending' && (
        <HomeworkReviewQueue
          homework={homework.filter((hw) => hw.status === 'PENDING')}
          loading={loading}
          error={error}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onToggleSelectAll={handleToggleSelectAll}
          onOpenReview={handleOpenReview}
          onRefresh={fetchHomework}
        />
      )}

      {activeTab === 'reviewed' && (
        <ReviewedHomeworkList
          homework={homework.filter(
            (hw) =>
              hw.status === 'APPROVED' ||
              hw.status === 'REJECTED' ||
              hw.status === 'NEEDS_REVISION'
          )}
          loading={loading}
          error={error}
          onOpenReview={handleOpenReview}
          onRefresh={fetchHomework}
        />
      )}

      {activeTab === 'all' && (
        <ReviewedHomeworkList
          homework={homework}
          loading={loading}
          error={error}
          onOpenReview={handleOpenReview}
          onRefresh={fetchHomework}
        />
      )}

      {/* Review Modal */}
      {reviewModalOpen && selectedHomework && (
        <HomeworkReviewModal
          homework={selectedHomework}
          isOpen={reviewModalOpen}
          onClose={handleCloseReview}
          onReviewSubmit={handleReviewSubmit}
          onNavigate={handleNavigate}
          hasNext={homework.length > 1}
          hasPrevious={homework.length > 1}
        />
      )}
    </div>
  );
}
