/**
 * Teacher Schedule API Route
 *
 * GET /api/teachers/[id]/schedule - Get teacher's schedule/bookings
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { hasPermission, Permission, isAdmin } from '@/lib/rbac';
import { teacherIdParamSchema, scheduleQuerySchema } from '@/lib/validations/teacher';
import { BookingStatus } from '@prisma/client';
import { ZodError } from 'zod';

/**
 * GET /api/teachers/[id]/schedule
 *
 * Get teacher's schedule with optional date range filtering
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require authentication
    const session = await requireAuth();

    // Validate teacher ID
    const { id: teacherId } = teacherIdParamSchema.parse({ id: params.id });

    // Check access - teachers can view own schedule, admins can view any
    const isOwnProfile = session.user.teacherId === teacherId;
    const canView =
      isOwnProfile ||
      isAdmin(session.user.role) ||
      hasPermission(session.user.role, Permission.READ_BOOKING);

    if (!canView) {
      return NextResponse.json(
        { error: 'You do not have permission to view this schedule' },
        { status: 403 }
      );
    }

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      status: searchParams.get('status') || undefined,
    };

    const validatedQuery = scheduleQuerySchema.parse(queryParams);

    // Check if teacher exists
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    // Build where clause for bookings
    const where: any = {
      teacherId,
    };

    // Add date range filter
    if (validatedQuery.startDate || validatedQuery.endDate) {
      where.date = {};
      if (validatedQuery.startDate) {
        where.date.gte = new Date(validatedQuery.startDate);
      }
      if (validatedQuery.endDate) {
        where.date.lte = new Date(validatedQuery.endDate);
      }
    }

    // Add status filter
    if (validatedQuery.status) {
      where.status = validatedQuery.status as BookingStatus;
    }

    // Fetch bookings
    const bookings = await prisma.booking.findMany({
      where,
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
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
    });

    // Transform data
    const schedule = bookings.map((booking) => ({
      id: booking.id,
      date: booking.date,
      duration: booking.duration,
      status: booking.status,
      source: booking.source,
      createdAt: booking.createdAt,
      student: {
        id: booking.student.id,
        governmentId: booking.student.governmentId,
        name: booking.student.user.name,
        email: booking.student.user.email,
      },
    }));

    // Calculate statistics
    const now = new Date();
    const upcoming = schedule.filter((b) => new Date(b.date) > now && b.status === BookingStatus.SCHEDULED);
    const completed = schedule.filter((b) => b.status === BookingStatus.COMPLETED);
    const cancelled = schedule.filter((b) => b.status === BookingStatus.CANCELLED);

    const totalHours = schedule.reduce((sum, b) => sum + b.duration, 0);
    const completedHours = completed.reduce((sum, b) => sum + b.duration, 0);

    return NextResponse.json({
      teacher: {
        id: teacher.id,
        name: teacher.user.name,
        email: teacher.user.email,
      },
      schedule,
      summary: {
        totalBookings: schedule.length,
        upcomingBookings: upcoming.length,
        completedBookings: completed.length,
        cancelledBookings: cancelled.length,
        totalHours,
        completedHours,
      },
      filters: {
        startDate: validatedQuery.startDate,
        endDate: validatedQuery.endDate,
        status: validatedQuery.status,
      },
    });
  } catch (error) {
    console.error('Error fetching teacher schedule:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid parameters',
          details: error.issues.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: 'An error occurred while fetching the schedule' },
      { status: 500 }
    );
  }
}
