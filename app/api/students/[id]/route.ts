/**
 * Single Student API Routes
 *
 * GET /api/students/[id] - Get single student with full details
 * PATCH /api/students/[id] - Update student information
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { hasPermission, Permission, isAdmin, isTeacher } from '@/lib/rbac';
import { updateStudentSchema, studentIdParamSchema } from '@/lib/validations/student';
import { BookingStatus } from '@prisma/client';
import { ZodError } from 'zod';

/**
 * GET /api/students/[id]
 *
 * Get a single student with complete information including:
 * - User data
 * - Assigned teachers
 * - Booking history
 * - Homework submissions
 * - Calculated used hours from bookings
 *
 * @param params.id - Student ID
 * @returns Student data with all related information
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require authentication
    const session = await requireAuth();

    // Validate student ID
    const { id } = studentIdParamSchema.parse({ id: params.id });

    // Fetch student
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            active: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        teachers: {
          include: {
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
          orderBy: {
            assignedAt: 'desc',
          },
        },
        bookings: {
          select: {
            id: true,
            date: true,
            duration: true,
            status: true,
            source: true,
            createdAt: true,
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
          take: 20,
        },
        homeworkSubmitted: {
          select: {
            id: true,
            fileName: true,
            fileSize: true,
            status: true,
            feedback: true,
            submittedAt: true,
            reviewedAt: true,
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
            submittedAt: 'desc',
          },
          take: 10,
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Check access permission
    const isOwnProfile = session.user.studentId === id;
    const isAssignedTeacher =
      isTeacher(session.user.role) &&
      student.teachers.some((t) => t.teacher.id === session.user.teacherId);
    const canView =
      isOwnProfile ||
      isAssignedTeacher ||
      isAdmin(session.user.role) ||
      hasPermission(session.user.role, Permission.READ_STUDENT);

    if (!canView) {
      return NextResponse.json(
        { error: 'You do not have permission to view this student' },
        { status: 403 }
      );
    }

    // Calculate total used hours from completed bookings
    const completedBookings = await prisma.booking.findMany({
      where: {
        studentId: id,
        status: BookingStatus.COMPLETED,
      },
      select: {
        duration: true,
      },
    });

    const calculatedUsedHours = completedBookings.reduce(
      (total, booking) => total + booking.duration,
      0
    );

    // Calculate remaining hours
    const remainingHours = Math.max(0, student.totalAllowedHours - student.usedHours);

    return NextResponse.json({
      student: {
        ...student,
        calculatedUsedHours,
        remainingHours,
      },
    });
  } catch (error) {
    console.error('Error fetching student:', error);

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
      { error: 'An error occurred while fetching the student' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/students/[id]
 *
 * Update student information
 * Admins can update governmentId and totalAllowedHours
 *
 * @param params.id - Student ID
 * @returns Updated student data
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require authentication
    const session = await requireAuth();

    // Validate student ID
    const { id } = studentIdParamSchema.parse({ id: params.id });

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateStudentSchema.parse(body);

    // Check if student exists
    const existingStudent = await prisma.student.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });

    if (!existingStudent) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Check permission - only admins can update student data
    if (!hasPermission(session.user.role, Permission.UPDATE_STUDENT)) {
      return NextResponse.json(
        { error: 'You do not have permission to update students' },
        { status: 403 }
      );
    }

    // If updating government ID, check uniqueness
    if (validatedData.governmentId && validatedData.governmentId !== existingStudent.governmentId) {
      const existingGovId = await prisma.student.findUnique({
        where: { governmentId: validatedData.governmentId },
      });

      if (existingGovId) {
        return NextResponse.json(
          { error: 'A student with this government ID already exists' },
          { status: 409 }
        );
      }
    }

    // Update student
    const updatedStudent = await prisma.student.update({
      where: { id },
      data: validatedData,
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

    // Calculate remaining hours
    const remainingHours = Math.max(
      0,
      updatedStudent.totalAllowedHours - updatedStudent.usedHours
    );

    return NextResponse.json({
      message: 'Student updated successfully',
      student: {
        ...updatedStudent,
        remainingHours,
      },
    });
  } catch (error) {
    console.error('Error updating student:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Validation error',
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
      { error: 'An error occurred while updating the student' },
      { status: 500 }
    );
  }
}
