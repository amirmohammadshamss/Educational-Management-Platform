/**
 * Teacher Bookings API Route
 *
 * Provides booking data for teachers including:
 * - All bookings for the teacher
 * - Filtering by date range
 * - Filtering by student
 * - Filtering by status
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { isTeacher } from '@/lib/rbac';
import { prisma } from '@/lib/prisma';
import { BookingStatus } from '@prisma/client';

/**
 * GET /api/teacher/bookings
 * Fetch teacher bookings with optional filters
 *
 * Query parameters:
 * - startDate: ISO date string for range start
 * - endDate: ISO date string for range end
 * - studentId: Filter by specific student
 * - status: Filter by booking status
 *
 * @returns Array of bookings
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const studentId = searchParams.get('studentId');
    const status = searchParams.get('status') as BookingStatus | null;

    // Build where clause
    const where: any = {
      teacherId,
    };

    // Add date range filter
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (startDate) {
      where.date = {
        gte: new Date(startDate),
      };
    } else if (endDate) {
      where.date = {
        lte: new Date(endDate),
      };
    }

    // Add student filter
    if (studentId) {
      where.studentId = studentId;
    }

    // Add status filter
    if (status && Object.values(BookingStatus).includes(status)) {
      where.status = status;
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

    // Format the data for the frontend
    const formattedBookings = bookings.map((booking) => ({
      id: booking.id,
      date: booking.date.toISOString(),
      duration: booking.duration,
      status: booking.status,
      source: booking.source,
      createdAt: booking.createdAt.toISOString(),
      updatedAt: booking.updatedAt.toISOString(),
      student: {
        id: booking.student.id,
        userId: booking.student.user.id,
        name: booking.student.user.name,
        email: booking.student.user.email,
        totalAllowedHours: booking.student.totalAllowedHours,
        usedHours: booking.student.usedHours,
        remainingHours: booking.student.totalAllowedHours - booking.student.usedHours,
      },
    }));

    // Return bookings
    return NextResponse.json({
      success: true,
      data: formattedBookings,
      count: formattedBookings.length,
    });
  } catch (error) {
    console.error('Error fetching teacher bookings:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch bookings',
        message:
          error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/teacher/bookings
 * Update booking status
 *
 * Body:
 * - bookingId: ID of the booking to update
 * - status: New status for the booking
 *
 * @returns Updated booking
 */
export async function PATCH(request: NextRequest) {
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

    // Parse request body
    const body = await request.json();
    const { bookingId, status } = body;

    // Validate inputs
    if (!bookingId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: bookingId, status' },
        { status: 400 }
      );
    }

    if (!Object.values(BookingStatus).includes(status as BookingStatus)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      );
    }

    // Verify booking belongs to this teacher
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        student: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    if (booking.teacherId !== teacherId) {
      return NextResponse.json(
        { error: 'Forbidden - This booking does not belong to you' },
        { status: 403 }
      );
    }

    // Update booking status
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: status as BookingStatus },
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
    });

    // If marking as completed, update student's used hours
    if (status === 'COMPLETED' && booking.status !== 'COMPLETED') {
      await prisma.student.update({
        where: { id: booking.studentId },
        data: {
          usedHours: {
            increment: booking.duration,
          },
        },
      });
    }

    // If changing from completed to another status, decrease used hours
    if (status !== 'COMPLETED' && booking.status === 'COMPLETED') {
      await prisma.student.update({
        where: { id: booking.studentId },
        data: {
          usedHours: {
            decrement: booking.duration,
          },
        },
      });
    }

    // Return updated booking
    return NextResponse.json({
      success: true,
      data: {
        id: updatedBooking.id,
        date: updatedBooking.date.toISOString(),
        duration: updatedBooking.duration,
        status: updatedBooking.status,
        source: updatedBooking.source,
        student: {
          id: updatedBooking.student.id,
          name: updatedBooking.student.user.name,
          email: updatedBooking.student.user.email,
        },
      },
    });
  } catch (error) {
    console.error('Error updating booking:', error);

    return NextResponse.json(
      {
        error: 'Failed to update booking',
        message:
          error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
