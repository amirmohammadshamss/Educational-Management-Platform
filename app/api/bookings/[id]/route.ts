/**
 * Single Booking API Route
 *
 * GET /api/bookings/[id] - Get single booking details
 * PATCH /api/bookings/[id] - Update booking
 * DELETE /api/bookings/[id] - Cancel booking
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { requireAuth } from '@/lib/auth';
import { isAdmin } from '@/lib/rbac';
import { bookingIdParamSchema, updateBookingSchema } from '@/lib/validations/booking';
import { BookingStatus } from '@prisma/client';
import { ZodError } from 'zod';

/**
 * GET /api/bookings/[id]
 *
 * Get single booking with full details
 * - Admin can view any booking
 * - Teacher/Student can only view bookings they are involved in
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require authentication
    const session = await requireAuth();

    // Validate booking ID
    const { id } = bookingIdParamSchema.parse({ id: params.id });

    // Fetch booking
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        student: {
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
        },
        teacher: {
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
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Check access permission
    const canView =
      isAdmin(session.user.role) ||
      booking.studentId === session.user.studentId ||
      booking.teacherId === session.user.teacherId;

    if (!canView) {
      return NextResponse.json(
        { error: 'You do not have permission to view this booking' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      booking: {
        id: booking.id,
        date: booking.date,
        duration: booking.duration,
        status: booking.status,
        source: booking.source,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
        student: {
          id: booking.student.id,
          governmentId: booking.student.governmentId,
          name: booking.student.user.name,
          email: booking.student.user.email,
          active: booking.student.user.active,
        },
        teacher: {
          id: booking.teacher.id,
          name: booking.teacher.user.name,
          email: booking.teacher.user.email,
          active: booking.teacher.user.active,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching booking:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid booking ID format' },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: 'An error occurred while fetching the booking' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/bookings/[id]
 *
 * Update booking (Admin only)
 * - Can update date, duration, status
 * - If duration changes, recalculates student hours
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require authentication - Admin only
    const session = await requireAuth();

    if (!isAdmin(session.user.role)) {
      return NextResponse.json(
        { error: 'Only administrators can update bookings' },
        { status: 403 }
      );
    }

    // Validate booking ID
    const { id } = bookingIdParamSchema.parse({ id: params.id });

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateBookingSchema.parse(body);

    // Check if booking exists
    const existingBooking = await prisma.booking.findUnique({
      where: { id },
      include: {
        student: true,
      },
    });

    if (!existingBooking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Prepare update data
    const updateData: Prisma.BookingUpdateInput = {};

    if (validatedData.date) {
      updateData.date = new Date(validatedData.date);
    }

    if (validatedData.duration !== undefined) {
      updateData.duration = validatedData.duration;
    }

    if (validatedData.status) {
      updateData.status = validatedData.status;
    }

    // Update booking
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: updateData,
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
    });

    // If duration changed and status is COMPLETED, recalculate student used hours
    if (validatedData.duration !== undefined || validatedData.status === BookingStatus.COMPLETED) {
      // Get all completed bookings for the student
      const completedBookings = await prisma.booking.findMany({
        where: {
          studentId: existingBooking.studentId,
          status: BookingStatus.COMPLETED,
        },
        select: {
          duration: true,
        },
      });

      const totalUsedHours = completedBookings.reduce((sum, b) => sum + b.duration, 0);

      // Update student used hours
      await prisma.student.update({
        where: { id: existingBooking.studentId },
        data: {
          usedHours: totalUsedHours,
        },
      });
    }

    return NextResponse.json({
      message: 'Booking updated successfully',
      booking: {
        id: updatedBooking.id,
        date: updatedBooking.date,
        duration: updatedBooking.duration,
        status: updatedBooking.status,
        source: updatedBooking.source,
        student: {
          id: updatedBooking.student.id,
          name: updatedBooking.student.user.name,
        },
        teacher: {
          id: updatedBooking.teacher.id,
          name: updatedBooking.teacher.user.name,
        },
      },
    });
  } catch (error) {
    console.error('Error updating booking:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid booking data',
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
      { error: 'An error occurred while updating the booking' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/bookings/[id]
 *
 * Cancel booking (soft delete) - Admin only
 * - Sets status to CANCELLED
 * - Recalculates student used hours
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require authentication - Admin only
    const session = await requireAuth();

    if (!isAdmin(session.user.role)) {
      return NextResponse.json(
        { error: 'Only administrators can cancel bookings' },
        { status: 403 }
      );
    }

    // Validate booking ID
    const { id } = bookingIdParamSchema.parse({ id: params.id });

    // Check if booking exists
    const booking = await prisma.booking.findUnique({
      where: { id },
      select: {
        id: true,
        studentId: true,
        status: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.status === BookingStatus.CANCELLED) {
      return NextResponse.json(
        { error: 'Booking is already cancelled' },
        { status: 400 }
      );
    }

    // Update booking status to CANCELLED
    await prisma.booking.update({
      where: { id },
      data: {
        status: BookingStatus.CANCELLED,
      },
    });

    // Recalculate student used hours (only count COMPLETED bookings)
    const completedBookings = await prisma.booking.findMany({
      where: {
        studentId: booking.studentId,
        status: BookingStatus.COMPLETED,
      },
      select: {
        duration: true,
      },
    });

    const totalUsedHours = completedBookings.reduce((sum, b) => sum + b.duration, 0);

    // Update student used hours
    await prisma.student.update({
      where: { id: booking.studentId },
      data: {
        usedHours: totalUsedHours,
      },
    });

    return NextResponse.json({
      message: 'Booking cancelled successfully',
      bookingId: id,
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid booking ID format' },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: 'An error occurred while cancelling the booking' },
      { status: 500 }
    );
  }
}
