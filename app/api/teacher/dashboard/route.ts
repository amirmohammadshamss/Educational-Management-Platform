/**
 * Teacher Dashboard API Route
 *
 * Provides dashboard data for teachers including:
 * - Today's bookings
 * - Pending homework count
 * - Assigned students summary
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { isTeacher } from '@/lib/rbac';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/teacher/dashboard
 * Fetch teacher-specific dashboard data
 *
 * @returns Dashboard data including bookings, homework, and students
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const session = await requireAuth();

    // Verify user is a teacher
    if (!isTeacher(session.user.role) && session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Teacher access only' },
        { status: 403 }
      );
    }

    // Get teacher ID from session
    const teacherId = session.user.teacherId;

    if (!teacherId) {
      return NextResponse.json(
        { error: 'Teacher profile not found' },
        { status: 404 }
      );
    }

    // Calculate date ranges
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Fetch dashboard data in parallel
    const [todaysBookings, pendingHomeworkCount, assignedStudents, recentHomework] =
      await Promise.all([
        // Today's bookings
        prisma.booking.findMany({
          where: {
            teacherId,
            date: {
              gte: now, // Only future bookings today
              lt: tomorrow,
            },
          },
          include: {
            student: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
          orderBy: {
            date: 'asc',
          },
          take: 10,
        }),

        // Pending homework count
        prisma.homework.count({
          where: {
            teacherId,
            status: 'PENDING',
          },
        }),

        // Assigned students with hours remaining
        prisma.student.findMany({
          where: {
            teachers: {
              some: {
                teacherId,
              },
            },
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                active: true,
              },
            },
            homeworkSubmitted: {
              where: {
                teacherId,
                status: 'PENDING',
              },
              select: {
                id: true,
              },
            },
          },
          orderBy: {
            user: {
              name: 'asc',
            },
          },
        }),

        // Recent homework submissions (last 5)
        prisma.homework.findMany({
          where: {
            teacherId,
            status: 'PENDING',
          },
          include: {
            student: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
          orderBy: {
            submittedAt: 'desc',
          },
          take: 5,
        }),
      ]);

    // Format the data for the frontend
    const formattedBookings = todaysBookings.map((booking) => ({
      id: booking.id,
      date: booking.date.toISOString(),
      duration: booking.duration,
      status: booking.status,
      student: {
        id: booking.student.id,
        name: booking.student.user.name,
        email: booking.student.user.email,
      },
    }));

    const formattedStudents = assignedStudents.map((student) => ({
      id: student.id,
      userId: student.user.id,
      name: student.user.name,
      email: student.user.email,
      active: student.user.active,
      totalAllowedHours: student.totalAllowedHours,
      usedHours: student.usedHours,
      remainingHours: student.totalAllowedHours - student.usedHours,
      pendingHomeworkCount: student.homeworkSubmitted.length,
    }));

    const formattedRecentHomework = recentHomework.map((hw) => ({
      id: hw.id,
      fileName: hw.fileName,
      fileUrl: hw.fileUrl,
      fileSize: hw.fileSize,
      status: hw.status,
      submittedAt: hw.submittedAt.toISOString(),
      student: {
        id: hw.student.id,
        name: hw.student.user.name,
        email: hw.student.user.email,
      },
    }));

    // Calculate summary statistics
    const totalAssignedStudents = assignedStudents.length;
    const activeStudents = assignedStudents.filter(
      (s) => s.user.active
    ).length;
    const studentsWithLowHours = formattedStudents.filter(
      (s) => s.remainingHours < 10 && s.remainingHours > 0
    ).length;
    const studentsWithManyPendingHomework = formattedStudents.filter(
      (s) => s.pendingHomeworkCount >= 3
    ).length;

    // Return dashboard data
    return NextResponse.json({
      success: true,
      data: {
        bookings: {
          today: formattedBookings,
          count: formattedBookings.length,
        },
        homework: {
          pending: formattedRecentHomework,
          pendingCount: pendingHomeworkCount,
        },
        students: {
          assigned: formattedStudents,
          totalCount: totalAssignedStudents,
          activeCount: activeStudents,
          lowHoursCount: studentsWithLowHours,
          manyPendingHomeworkCount: studentsWithManyPendingHomework,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching teacher dashboard data:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch dashboard data',
        message:
          error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
