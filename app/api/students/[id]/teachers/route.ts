/**
 * Student Teachers API Route
 *
 * GET /api/students/[id]/teachers - Get all teachers assigned to a student
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { hasPermission, Permission, isAdmin, isStudent } from '@/lib/rbac';
import { studentIdParamSchema } from '@/lib/validations/student';
import { ZodError } from 'zod';

/**
 * GET /api/students/[id]/teachers
 *
 * Get all teachers assigned to a student
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

    // Check access - students can view own teachers, admins can view any
    const isOwnProfile = session.user.studentId === studentId;
    const canView =
      isOwnProfile ||
      isAdmin(session.user.role) ||
      hasPermission(session.user.role, Permission.READ_TEACHER);

    if (!canView) {
      return NextResponse.json(
        { error: 'You do not have permission to view these teachers' },
        { status: 403 }
      );
    }

    // Check if student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId },
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

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Fetch assigned teachers with details
    const assignments = await prisma.studentTeacher.findMany({
      where: {
        studentId,
      },
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
    });

    // Transform data
    const teachers = assignments.map((assignment) => ({
      assignmentId: assignment.id,
      assignedAt: assignment.assignedAt,
      id: assignment.teacher.id,
      name: assignment.teacher.user.name,
      email: assignment.teacher.user.email,
      active: assignment.teacher.user.active,
    }));

    return NextResponse.json({
      student: {
        id: student.id,
        name: student.user.name,
      },
      teachers,
      totalTeachers: teachers.length,
    });
  } catch (error) {
    console.error('Error fetching student teachers:', error);

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
      { error: 'An error occurred while fetching teachers' },
      { status: 500 }
    );
  }
}
