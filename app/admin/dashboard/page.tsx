/**
 * Admin Dashboard Page
 *
 * Main dashboard with statistics, bookings, and sync logs
 */

import { requireAuth } from '@/lib/auth';
import { isAdmin } from '@/lib/rbac';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import MetricCard from '@/components/admin/MetricCard';
import TodaysBookings from '@/components/admin/TodaysBookings';
import RecentSyncLogs from '@/components/admin/RecentSyncLogs';
import Link from 'next/link';

/**
 * Fetch dashboard data
 */
async function getDashboardData() {
  // Calculate date ranges
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Fetch dashboard statistics
  const [
    activeStudents,
    activeTeachers,
    bookingsThisMonth,
    completedLessonsToday,
    pendingHomeworkReviews,
    todaysBookings,
    recentSyncLogs,
  ] = await Promise.all([
    // Active students
    prisma.student.count({
      where: { user: { active: true } },
    }),

    // Active teachers
    prisma.teacher.count({
      where: { user: { active: true } },
    }),

    // Bookings this month
    prisma.booking.count({
      where: {
        date: {
          gte: new Date(today.getFullYear(), today.getMonth(), 1),
          lte: new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59),
        },
      },
    }),

    // Completed lessons today
    prisma.booking.count({
      where: {
        date: { gte: today, lt: tomorrow },
        status: 'COMPLETED',
      },
    }),

    // Pending homework reviews
    prisma.homework.count({
      where: { status: 'PENDING' },
    }),

    // Today's bookings (next 10)
    prisma.booking.findMany({
      where: {
        date: { gte: new Date(), lt: tomorrow },
      },
      include: {
        student: { include: { user: true } },
        teacher: { include: { user: true } },
      },
      orderBy: { date: 'asc' },
      take: 10,
    }),

    // Recent sync logs (last 5)
    prisma.syncLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ]);

  return {
    stats: {
      activeStudents,
      activeTeachers,
      bookingsThisMonth,
      completedLessonsToday,
      pendingHomeworkReviews,
    },
    todaysBookings,
    recentSyncLogs,
  };
}

/**
 * Admin Dashboard Page
 */
export default async function AdminDashboardPage() {
  // Require authentication and admin role
  const session = await requireAuth();

  if (!isAdmin(session.user.role)) {
    redirect('/unauthorized');
  }

  // Fetch dashboard data
  const { stats, todaysBookings, recentSyncLogs } = await getDashboardData();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Welcome back, {session.user.name}! Here's what's happening today.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="mb-8 flex flex-wrap gap-3">
          <Link
            href="/admin/users/new"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add User
          </Link>

          <Link
            href="/admin/sync"
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 font-medium"
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
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Sync APIs
          </Link>

          <Link
            href="/admin/reports"
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
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
                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            View Reports
          </Link>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <MetricCard
            icon="👨‍🎓"
            title="Active Students"
            value={stats.activeStudents}
            colorScheme="blue"
            linkTo="/admin/students"
            linkText="View students"
          />

          <MetricCard
            icon="👩‍🏫"
            title="Active Teachers"
            value={stats.activeTeachers}
            colorScheme="green"
            linkTo="/admin/teachers"
            linkText="View teachers"
          />

          <MetricCard
            icon="📅"
            title="Bookings This Month"
            value={stats.bookingsThisMonth}
            colorScheme="purple"
            linkTo="/admin/bookings"
            linkText="View bookings"
          />

          <MetricCard
            icon="✅"
            title="Completed Today"
            value={stats.completedLessonsToday}
            colorScheme="orange"
            linkTo="/admin/bookings?status=COMPLETED"
            linkText="View completed"
          />

          <MetricCard
            icon="📝"
            title="Pending Reviews"
            value={stats.pendingHomeworkReviews}
            colorScheme="red"
            linkTo="/admin/homework?status=PENDING"
            linkText="Review homework"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Today's Bookings */}
          <div>
            <TodaysBookings
              bookings={todaysBookings.map((b) => ({
                ...b,
                date: b.date.toISOString(),
              }))}
            />
          </div>

          {/* Recent Sync Logs */}
          <div>
            <RecentSyncLogs
              logs={recentSyncLogs.map((l) => ({
                ...l,
                message: l.message || '',
                lastSyncTime: l.lastSyncTime.toISOString(),
                createdAt: l.createdAt.toISOString(),
              }))}
            />
          </div>
        </div>

        {/* System Status Footer */}
        <div className="mt-8 bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            System Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Last Sync
              </p>
              <p className="text-sm text-gray-900">
                {recentSyncLogs.length > 0
                  ? new Date(recentSyncLogs[0].createdAt).toLocaleString(
                      'en-US',
                      {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      }
                    )
                  : 'Never'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Database Status
              </p>
              <p className="text-sm text-green-600 font-medium">Connected</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                API Status
              </p>
              <p className="text-sm text-green-600 font-medium">Operational</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
