/**
 * Teacher Students API Route
 *
 * GET /api/teachers/[id]/students - Get all students assigned to a teacher
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { hasPermission, Permission, isAdmin } from '@/lib/rbac';
import { teacherIdParamSchema } from '@/lib/validations/teacher';
import { ZodError } from 'zod';

/**
 * GET /api/teachers/[id]/students
 *
 * Get all students assigned to a teacher with hours and recent bookings
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

    // Check access - teachers can view own students, admins can view any
    const isOwnProfile = session.user.teacherId === teacherId;
    const canView =
      isOwnProfile ||
      isAdmin(session.user.role) ||
      hasPermission(session.user.role, Permission.READ_STUDENT);

    if (!canView) {
      return NextResponse.json(
        { error: 'You do not have permission to view these students' },
        { status: 403 }
      );
    }

    // Check if teacher exists
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            active: true,
          },
        },
      },
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    // Fetch assigned students with details
    const assignments = await prisma.studentTeacher.findMany({
      where: {
        teacherId,
      },
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
            bookings: {
              where: {
                teacherId,
              },
              select: {
                id: true,
                date: true,
                duration: true,
                status: true,
              },
              orderBy: {
                date: 'desc',
              },
              take: 5,
            },
          },
        },
      },
      orderBy: {
        assignedAt: 'desc',
      },
    });

    // Transform data to include calculated fields
    const students = assignments.map((assignment) => {
      const student = assignment.student;
      const remainingHours = Math.max(0, student.totalAllowedHours - student.usedHours);

      return {
        assignmentId: assignment.id,
        assignedAt: assignment.assignedAt,
        student: {
          id: student.id,
          governmentId: student.governmentId,
          totalAllowedHours: student.totalAllowedHours,
          usedHours: student.usedHours,
          remainingHours,
          user: student.user,
          recentBookings: student.bookings,
        },
      };
    });

    return NextResponse.json({
      teacher: {
        id: teacher.id,
        name: teacher.user.name,
      },
      students,
      totalStudents: students.length,
    });
  } catch (error) {
    console.error('Error fetching teacher students:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid teacher ID format' },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: 'An error occurred while fetching students' },
      { status: 500 }
    );
  }
}
