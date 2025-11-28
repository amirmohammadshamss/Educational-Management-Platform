/**
 * Dashboard Statistics API Route
 *
 * GET /api/dashboard/stats - Get aggregated dashboard statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { isAdmin } from '@/lib/rbac';
import { prisma } from '@/lib/prisma';

/**
 * Dashboard statistics interface
 */
interface DashboardStats {
  activeStudents: number;
  activeTeachers: number;
  bookingsThisMonth: number;
  completedLessonsToday: number;
  pendingHomeworkReviews: number;
}

/**
 * GET /api/dashboard/stats
 *
 * Get dashboard statistics
 * - Admin only access
 * - Returns aggregated metrics from database
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication - Admin only
    const session = await requireAuth();

    if (!isAdmin(session.user.role)) {
      return NextResponse.json(
        { error: 'Only administrators can access dashboard statistics' },
        { status: 403 }
      );
    }

    // Calculate date ranges
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    // Fetch statistics in parallel
    const [
      activeStudentsCount,
      activeTeachersCount,
      bookingsThisMonthCount,
      completedLessonsTodayCount,
      pendingHomeworkReviewsCount,
    ] = await Promise.all([
      // Active students
      prisma.student.count({
        where: {
          user: {
            active: true,
          },
        },
      }),

      // Active teachers
      prisma.teacher.count({
        where: {
          user: {
            active: true,
          },
        },
      }),

      // Bookings this month
      prisma.booking.count({
        where: {
          date: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      }),

      // Completed lessons today
      prisma.booking.count({
        where: {
          date: {
            gte: today,
            lt: tomorrow,
          },
          status: 'COMPLETED',
        },
      }),

      // Pending homework reviews
      prisma.homework.count({
        where: {
          status: 'PENDING',
        },
      }),
    ]);

    const stats: DashboardStats = {
      activeStudents: activeStudentsCount,
      activeTeachers: activeTeachersCount,
      bookingsThisMonth: bookingsThisMonthCount,
      completedLessonsToday: completedLessonsTodayCount,
      pendingHomeworkReviews: pendingHomeworkReviewsCount,
    };

    // Return with cache headers (cache for 5 minutes)
    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 'private, max-age=300',
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard statistics:', error);

    if (error instanceof Error) {
      if (
        error.message.includes('Unauthorized') ||
        error.message.includes('Forbidden')
      ) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: 'An error occurred while fetching dashboard statistics' },
      { status: 500 }
    );
  }
}
