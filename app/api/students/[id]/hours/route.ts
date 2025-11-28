/**
 * Student Hours Breakdown API Route
 *
 * GET /api/students/[id]/hours - Get detailed hours breakdown for a student
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { hasPermission, Permission, isAdmin, isTeacher } from '@/lib/rbac';
import { studentIdParamSchema } from '@/lib/validations/student';
import { BookingStatus } from '@prisma/client';
import { ZodError } from 'zod';

/**
 * GET /api/students/[id]/hours
 *
 * Get comprehensive hours breakdown for a student including:
 * - Total allowed hours
 * - Used hours
 * - Remaining hours
 * - Breakdown by teacher
 * - Recent bookings
 *
 * @param params.id - Student ID
 * @returns Hours breakdown with detailed information
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require authentication
    const session = await requireAuth();

    // Validate student ID
    const { id: studentId } = studentIdParamSchema.parse({ id: params.id });

    // Fetch student
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            active: true,
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Check access permission
    const isOwnProfile = session.user.studentId === studentId;
    const canView =
      isOwnProfile ||
      isAdmin(session.user.role) ||
      isTeacher(session.user.role) ||
      hasPermission(session.user.role, Permission.READ_STUDENT);

    if (!canView) {
      return NextResponse.json(
        { error: 'You do not have permission to view this student\'s hours' },
        { status: 403 }
      );
    }

    // Fetch all bookings grouped by teacher
    const bookingsByTeacher = await prisma.booking.groupBy({
      by: ['teacherId', 'status'],
      where: {
        studentId,
      },
      _sum: {
        duration: true,
      },
      _count: {
        id: true,
      },
    });

    // Fetch teacher information
    const teacherIds = [...new Set(bookingsByTeacher.map((b) => b.teacherId))];
    const teachers = await prisma.teacher.findMany({
      where: {
        id: {
          in: teacherIds,
        },
      },
      select: {
        id: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Create teacher map for easy lookup
    const teacherMap = new Map(teachers.map((t) => [t.id, t]));

    // Calculate breakdown by teacher
    const breakdownByTeacher = teacherIds.map((teacherId) => {
      const teacher = teacherMap.get(teacherId);
      const teacherBookings = bookingsByTeacher.filter((b) => b.teacherId === teacherId);

      const completedHours =
        teacherBookings
          .filter((b) => b.status === BookingStatus.COMPLETED)
          .reduce((sum, b) => sum + (b._sum.duration || 0), 0);

      const scheduledHours =
        teacherBookings
          .filter((b) => b.status === BookingStatus.SCHEDULED)
          .reduce((sum, b) => sum + (b._sum.duration || 0), 0);

      const cancelledHours =
        teacherBookings
          .filter((b) => b.status === BookingStatus.CANCELLED)
          .reduce((sum, b) => sum + (b._sum.duration || 0), 0);

      const totalBookings = teacherBookings.reduce((sum, b) => sum + b._count.id, 0);

      return {
        teacher: {
          id: teacher?.id,
          name: teacher?.user.name,
          email: teacher?.user.email,
        },
        hours: {
          completed: completedHours,
          scheduled: scheduledHours,
          cancelled: cancelledHours,
          total: completedHours + scheduledHours,
        },
        bookingsCount: totalBookings,
      };
    });

    // Fetch recent bookings
    const recentBookings = await prisma.booking.findMany({
      where: {
        studentId,
      },
      select: {
        id: true,
        date: true,
        duration: true,
        status: true,
        source: true,
        teacher: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
      take: 10,
    });

    // Calculate totals
    const totalCompletedHours = bookingsByTeacher
      .filter((b) => b.status === BookingStatus.COMPLETED)
      .reduce((sum, b) => sum + (b._sum.duration || 0), 0);

    const totalScheduledHours = bookingsByTeacher
      .filter((b) => b.status === BookingStatus.SCHEDULED)
      .reduce((sum, b) => sum + (b._sum.duration || 0), 0);

    const remainingHours = Math.max(0, student.totalAllowedHours - student.usedHours);
    const availableHours = Math.max(0, student.totalAllowedHours - totalCompletedHours - totalScheduledHours);

    return NextResponse.json({
      student: {
        id: student.id,
        name: student.user.name,
        governmentId: student.governmentId,
      },
      hours: {
        totalAllowed: student.totalAllowedHours,
        used: student.usedHours,
        remaining: remainingHours,
        completed: totalCompletedHours,
        scheduled: totalScheduledHours,
        available: availableHours,
      },
      breakdownByTeacher,
      recentBookings,
      summary: {
        totalBookings: recentBookings.length,
        activeTeachers: teacherIds.length,
        utilizationPercentage:
          student.totalAllowedHours > 0
            ? ((student.usedHours / student.totalAllowedHours) * 100).toFixed(2)
            : 0,
      },
    });
  } catch (error) {
    console.error('Error fetching student hours:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid student ID format' },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: 'An error occurred while fetching student hours' },
      { status: 500 }
    );
  }
}
