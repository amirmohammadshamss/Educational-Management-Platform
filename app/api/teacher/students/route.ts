/**
 * Teacher Students API Route
 *
 * Provides student management functionality for teachers:
 * - View all students in the system
 * - View assigned students
 * - Assign/unassign students to teacher's list
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { isTeacher } from '@/lib/rbac';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/teacher/students
 * Fetch all students or only assigned students
 *
 * Query parameters:
 * - assigned: 'true' to get only assigned students, 'false' or omit for all
 * - search: Search by student name
 *
 * @returns Array of students with assignment status
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
    const assignedOnly = searchParams.get('assigned') === 'true';
    const searchQuery = searchParams.get('search') || '';

    // Build where clause for search
    const searchWhere = searchQuery
      ? {
          user: {
            name: {
              contains: searchQuery,
              mode: 'insensitive' as const,
            },
          },
        }
      : {};

    if (assignedOnly) {
      // Get only assigned students
      const students = await prisma.student.findMany({
        where: {
          ...searchWhere,
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
          bookings: {
            where: {
              teacherId,
            },
            orderBy: {
              date: 'desc',
            },
            take: 5,
          },
          homeworkSubmitted: {
            where: {
              teacherId,
              status: 'PENDING',
            },
          },
          teachers: {
            where: {
              teacherId,
            },
            select: {
              assignedAt: true,
            },
          },
        },
        orderBy: {
          user: {
            name: 'asc',
          },
        },
      });

      // Format the data
      const formattedStudents = students.map((student) => ({
        id: student.id,
        userId: student.user.id,
        name: student.user.name,
        email: student.user.email,
        active: student.user.active,
        governmentId: student.governmentId,
        totalAllowedHours: student.totalAllowedHours,
        usedHours: student.usedHours,
        remainingHours: student.totalAllowedHours - student.usedHours,
        recentBookingsCount: student.bookings.length,
        pendingHomeworkCount: student.homeworkSubmitted.length,
        assignedAt: student.teachers[0]?.assignedAt.toISOString(),
        isAssigned: true,
      }));

      return NextResponse.json({
        success: true,
        data: formattedStudents,
        count: formattedStudents.length,
      });
    } else {
      // Get all students with assignment status
      const students = await prisma.student.findMany({
        where: searchWhere,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              active: true,
            },
          },
          teachers: {
            where: {
              teacherId,
            },
            select: {
              id: true,
              assignedAt: true,
            },
          },
        },
        orderBy: {
          user: {
            name: 'asc',
          },
        },
      });

      // Format the data
      const formattedStudents = students.map((student) => ({
        id: student.id,
        userId: student.user.id,
        name: student.user.name,
        email: student.user.email,
        active: student.user.active,
        governmentId: student.governmentId,
        totalAllowedHours: student.totalAllowedHours,
        usedHours: student.usedHours,
        remainingHours: student.totalAllowedHours - student.usedHours,
        isAssigned: student.teachers.length > 0,
        assignedAt: student.teachers[0]?.assignedAt.toISOString(),
      }));

      return NextResponse.json({
        success: true,
        data: formattedStudents,
        count: formattedStudents.length,
      });
    }
  } catch (error) {
    console.error('Error fetching students:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch students',
        message:
          error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/teacher/students
 * Assign a student to the teacher's list
 *
 * Body:
 * - studentId: ID of the student to assign
 *
 * @returns Success message
 */
export async function POST(request: NextRequest) {
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
    const { studentId } = body;

    // Validate input
    if (!studentId) {
      return NextResponse.json(
        { error: 'Missing required field: studentId' },
        { status: 400 }
      );
    }

    // Check if student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Check if already assigned
    const existingAssignment = await prisma.studentTeacher.findUnique({
      where: {
        studentId_teacherId: {
          studentId,
          teacherId,
        },
      },
    });

    if (existingAssignment) {
      return NextResponse.json(
        { error: 'Student is already assigned to you' },
        { status: 400 }
      );
    }

    // Create assignment
    await prisma.studentTeacher.create({
      data: {
        studentId,
        teacherId,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Student assigned successfully',
    });
  } catch (error) {
    console.error('Error assigning student:', error);

    return NextResponse.json(
      {
        error: 'Failed to assign student',
        message:
          error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/teacher/students
 * Remove a student from the teacher's list
 *
 * Query parameters:
 * - studentId: ID of the student to remove
 *
 * @returns Success message
 */
export async function DELETE(request: NextRequest) {
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
    const studentId = searchParams.get('studentId');

    // Validate input
    if (!studentId) {
      return NextResponse.json(
        { error: 'Missing required parameter: studentId' },
        { status: 400 }
      );
    }

    // Check if assignment exists
    const assignment = await prisma.studentTeacher.findUnique({
      where: {
        studentId_teacherId: {
          studentId,
          teacherId,
        },
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: 'Student is not assigned to you' },
        { status: 404 }
      );
    }

    // Delete assignment
    await prisma.studentTeacher.delete({
      where: {
        studentId_teacherId: {
          studentId,
          teacherId,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Student removed from your list successfully',
    });
  } catch (error) {
    console.error('Error removing student:', error);

    return NextResponse.json(
      {
        error: 'Failed to remove student',
        message:
          error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
