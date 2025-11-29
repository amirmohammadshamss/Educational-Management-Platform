/**
 * Teacher Dashboard Page
 *
 * Main dashboard for teachers showing:
 * - Today's schedule
 * - Pending homework reviews
 * - Assigned students
 * - Quick actions
 */

import { requireAuth } from '@/lib/auth';
import { isTeacher } from '@/lib/rbac';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import TodaySchedule from '@/components/teacher/TodaySchedule';
import PendingHomeworkWidget from '@/components/teacher/PendingHomeworkWidget';
import AssignedStudentsWidget from '@/components/teacher/AssignedStudentsWidget';

/**
 * Metric card component
 */
function MetricCard({
  icon,
  title,
  value,
  colorScheme,
  linkTo,
  linkText,
}: {
  icon: string;
  title: string;
  value: number | string;
  colorScheme: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  linkTo: string;
  linkText: string;
}) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
    red: 'bg-red-50 border-red-200 text-red-700',
  };

  return (
    <div
      className={`rounded-lg border p-6 ${colorClasses[colorScheme]} transition-all hover:shadow-md`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="text-3xl mb-2">{icon}</div>
          <p className="text-sm font-medium opacity-90 mb-1">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
      </div>
      {/* <div className="mt-4">
        <Link
          href={linkTo}
          className="text-sm font-medium hover:underline inline-flex items-center"
        >
          {linkText}
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
      </div> */}
    </div>
  );
}

/**
 * Fetch dashboard data from API
 */
async function getDashboardData() {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  try {
    const response = await fetch(`${baseUrl}/api/teacher/dashboard`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch dashboard data: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    // Return empty data structure on error
    return {
      bookings: { today: [], count: 0 },
      homework: { pending: [], pendingCount: 0 },
      students: {
        assigned: [],
        totalCount: 0,
        activeCount: 0,
        lowHoursCount: 0,
        manyPendingHomeworkCount: 0,
      },
    };
  }
}

/**
 * Teacher Dashboard Page
 */
export default async function TeacherDashboardPage() {
  // Require authentication and teacher role
  const session = await requireAuth();

  if (!isTeacher(session.user.role) && session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
    redirect('/unauthorized');
  }

  // Fetch dashboard data
  const dashboardData = await getDashboardData();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {session.user.name}!
          </h1>
          <p className="mt-2 text-gray-600">
            Here's your teaching overview for today.
          </p>
        </div>

        {/* Quick Action Buttons
        <div className="mb-8 flex flex-wrap gap-3">
          <Link
            href="/teacher/schedule"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            View Schedule
          </Link>

          <Link
            href="/teacher/students"
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 font-medium transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
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
            View Students
          </Link>

          <Link
            href="/teacher/homework"
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Review Homework
          </Link>
        </div> */}

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            icon="📅"
            title="Classes Today"
            value={dashboardData.bookings.count}
            colorScheme="blue"
            linkTo="/teacher/schedule"
            linkText="View schedule"
          />

          <MetricCard
            icon="👥"
            title="Assigned Students"
            value={dashboardData.students.totalCount}
            colorScheme="green"
            linkTo="/teacher/students"
            linkText="View students"
          />

          <MetricCard
            icon="📝"
            title="Pending Reviews"
            value={dashboardData.homework.pendingCount}
            colorScheme="purple"
            linkTo="/teacher/homework"
            linkText="Review now"
          />

          <MetricCard
            icon="⚠️"
            title="Low Hours Students"
            value={dashboardData.students.lowHoursCount}
            colorScheme="orange"
            linkTo="/teacher/students"
            linkText="View details"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Today's Schedule */}
          <div>
            <TodaySchedule bookings={dashboardData.bookings.today} />
          </div>

          {/* Pending Homework */}
          <div>
            <PendingHomeworkWidget
              homework={dashboardData.homework.pending}
              totalPendingCount={dashboardData.homework.pendingCount}
            />
          </div>
        </div>

        {/* Assigned Students - Full Width */}
        {/* <div>
          <AssignedStudentsWidget
            students={dashboardData.students.assigned}
            lowHoursCount={dashboardData.students.lowHoursCount}
            manyPendingHomeworkCount={
              dashboardData.students.manyPendingHomeworkCount
            }
          />
        </div> */}

        {/* Recent Activity Feed */}
        <div className="mt-8 bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Tips
          </h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-2xl">💡</div>
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Stay on top of homework reviews
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Regular feedback helps students improve faster and stay motivated.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="text-2xl">📊</div>
              <div>
                <p className="text-sm font-medium text-green-900">
                  Monitor student hours
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Keep track of students with low remaining hours to help them plan effectively.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
              <div className="text-2xl">✅</div>
              <div>
                <p className="text-sm font-medium text-purple-900">
                  Mark classes as completed
                </p>
                <p className="text-xs text-purple-700 mt-1">
                  Remember to mark completed classes in your schedule to keep accurate records.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
