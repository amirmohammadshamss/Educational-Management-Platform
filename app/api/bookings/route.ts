/**
 * Bookings List API Route
 *
 * GET /api/bookings - Get all bookings with filtering and pagination
 * POST /api/bookings - Create a manual booking
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { hasPermission, Permission, isAdmin, isTeacher, isStudent } from '@/lib/rbac';
import { bookingQuerySchema, createBookingSchema } from '@/lib/validations/booking';
import { BookingStatus } from '@prisma/client';
import { ZodError } from 'zod';

/**
 * GET /api/bookings
 *
 * Get all bookings with filtering and pagination
 * - Admins can see all bookings
 * - Teachers can see only their own bookings
 * - Students can see only their own bookings
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const session = await requireAuth();

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      studentId: searchParams.get('studentId') || undefined,
      teacherId: searchParams.get('teacherId') || undefined,
      status: searchParams.get('status') || undefined,
    };

    const validatedQuery = bookingQuerySchema.parse(queryParams);

    // Build where clause based on role and filters
    const where: any = {};

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
    // Admins can see all bookings (no additional where clause)

    // Apply filters (if user is admin, allow filtering by specific student/teacher)
    if (isAdmin(session.user.role)) {
      if (validatedQuery.studentId) {
        where.studentId = validatedQuery.studentId;
      }
      if (validatedQuery.teacherId) {
        where.teacherId = validatedQuery.teacherId;
      }
    }

    // Date range filter
    if (validatedQuery.startDate || validatedQuery.endDate) {
      where.date = {};
      if (validatedQuery.startDate) {
        where.date.gte = new Date(validatedQuery.startDate);
      }
      if (validatedQuery.endDate) {
        where.date.lte = new Date(validatedQuery.endDate);
      }
    }

    // Status filter
    if (validatedQuery.status) {
      where.status = validatedQuery.status;
    }

    // Count total bookings for pagination
    const totalCount = await prisma.booking.count({ where });

    // Calculate pagination
    const page = validatedQuery.page;
    const limit = validatedQuery.limit;
    const skip = (page - 1) * limit;
    const totalPages = Math.ceil(totalCount / limit);

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
        date: 'desc',
      },
      skip,
      take: limit,
    });

    // Transform data
    const transformedBookings = bookings.map((booking) => ({
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
      },
      teacher: {
        id: booking.teacher.id,
        name: booking.teacher.user.name,
        email: booking.teacher.user.email,
      },
    }));

    return NextResponse.json({
      bookings: transformedBookings,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
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
      { error: 'An error occurred while fetching bookings' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/bookings
 *
 * Create a manual booking
 * - Admin or Teacher can create bookings
 * - Validates student has enough remaining hours
 * - Validates date is in the future
 */
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const session = await requireAuth();

    // Check permission - Admin or Teacher can create bookings
    const canCreate =
      isAdmin(session.user.role) ||
      isTeacher(session.user.role) ||
      hasPermission(session.user.role, Permission.CREATE_BOOKING);

    if (!canCreate) {
      return NextResponse.json(
        { error: 'You do not have permission to create bookings' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createBookingSchema.parse(body);

    // Check if student exists and is active
    const student = await prisma.student.findUnique({
      where: { id: validatedData.studentId },
      include: {
        user: {
          select: {
            active: true,
          },
        },
        bookings: {
          where: {
            status: BookingStatus.COMPLETED,
          },
          select: {
            duration: true,
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    if (!student.user.active) {
      return NextResponse.json(
        { error: 'Cannot create booking for inactive student' },
        { status: 400 }
      );
    }

    // Calculate used hours
    const usedHours = student.bookings.reduce((sum, b) => sum + b.duration, 0);
    const remainingHours = student.totalAllowedHours - usedHours;

    // Check if student has enough remaining hours
    if (remainingHours < validatedData.duration) {
      return NextResponse.json(
        {
          error: 'Student does not have enough remaining hours',
          details: {
            totalAllowedHours: student.totalAllowedHours,
            usedHours,
            remainingHours,
            requiredHours: validatedData.duration,
          },
        },
        { status: 400 }
      );
    }

    // Check if teacher exists and is active
    const teacher = await prisma.teacher.findUnique({
      where: { id: validatedData.teacherId },
      include: {
        user: {
          select: {
            active: true,
          },
        },
      },
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    if (!teacher.user.active) {
      return NextResponse.json(
        { error: 'Cannot create booking for inactive teacher' },
        { status: 400 }
      );
    }

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        studentId: validatedData.studentId,
        teacherId: validatedData.teacherId,
        date: new Date(validatedData.date),
        duration: validatedData.duration,
        source: 'manual',
        status: BookingStatus.SCHEDULED,
      },
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

    return NextResponse.json(
      {
        message: 'Booking created successfully',
        booking: {
          id: booking.id,
          date: booking.date,
          duration: booking.duration,
          status: booking.status,
          source: booking.source,
          student: {
            id: booking.student.id,
            name: booking.student.user.name,
            email: booking.student.user.email,
          },
          teacher: {
            id: booking.teacher.id,
            name: booking.teacher.user.name,
            email: booking.teacher.user.email,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating booking:', error);

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
      { error: 'An error occurred while creating the booking' },
      { status: 500 }
    );
  }
}
