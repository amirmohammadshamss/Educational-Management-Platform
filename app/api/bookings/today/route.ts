/**
 * Today's Bookings API Route
 *
 * GET /api/bookings/today - Get today's bookings for dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { isAdmin, isTeacher, isStudent } from '@/lib/rbac';

/**
 * GET /api/bookings/today
 *
 * Get all bookings for today
 * - Primarily for dashboard display
 * - Role-based filtering applies (same as GET /api/bookings)
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const session = await requireAuth();

    // Get today's date range (start and end of today)
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // Build where clause based on role
    const where: any = {
      date: {
        gte: startOfDay,
        lte: endOfDay,
      },
    };

    // Role-based filtering
    if (isStudent(session.user.role)) {
      // Students can only see their own bookings
      if (!session.user.studentId) {
        return NextResponse.json(
          { error: 'Student profile not found' },
          { status: 404 }
        );
      }
      where.studentId = session.user.studentId;
    } else if (isTeacher(session.user.role)) {
      // Teachers can only see their own bookings
      if (!session.user.teacherId) {
        return NextResponse.json(
          { error: 'Teacher profile not found' },
          { status: 404 }
        );
      }
      where.teacherId = session.user.teacherId;
    }
    // Admins can see all today's bookings

    // Fetch today's bookings
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
        teacher: {
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
        date: 'asc', // Sort by time ascending (earliest first)
      },
    });

    // Transform data
    const transformedBookings = bookings.map((booking) => ({
      id: booking.id,
      date: booking.date,
      duration: booking.duration,
      status: booking.status,
      source: booking.source,
      student: {
        id: booking.student.id,
        governmentId: booking.student.governmentId,
        name: booking.student.user.name,
        email: booking.student.user.email,
      },
      teacher: {
        id: booking.teacher.id,
        name: booking.teacher.user.name,
        email: booking.teacher.user.email,
      },
    }));

    // Calculate summary statistics
    const upcomingBookings = transformedBookings.filter((b) => new Date(b.date) > now);
    const completedToday = transformedBookings.filter((b) => b.status === 'COMPLETED');

    return NextResponse.json({
      date: now.toISOString().split('T')[0],
      bookings: transformedBookings,
      summary: {
        total: transformedBookings.length,
        upcoming: upcomingBookings.length,
        completed: completedToday.length,
        totalHours: transformedBookings.reduce((sum, b) => sum + b.duration, 0),
      },
    });
  } catch (error) {
    console.error('Error fetching today\'s bookings:', error);

    if (error instanceof Error) {
      if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: 'An error occurred while fetching today\'s bookings' },
      { status: 500 }
    );
  }
}
