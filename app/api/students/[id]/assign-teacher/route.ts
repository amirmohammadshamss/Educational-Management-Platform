/**
 * Assign Teacher to Student API Route
 *
 * POST /api/students/[id]/assign-teacher - Assign a teacher to a student
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { hasPermission, Permission, isAdmin, isTeacher } from '@/lib/rbac';
import { assignTeacherSchema, studentIdParamSchema } from '@/lib/validations/student';
import { ZodError } from 'zod';

/**
 * POST /api/students/[id]/assign-teacher
 *
 * Assign a teacher to a student
 * Creates StudentTeacher relationship
 * Prevents duplicate assignments
 *
 * @param params.id - Student ID
 * @returns Success message with assignment details
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require authentication
    const session = await requireAuth();

    // Validate student ID
    const { id: studentId } = studentIdParamSchema.parse({ id: params.id });

    // Parse and validate request body
    const body = await request.json();
    const { teacherId } = assignTeacherSchema.parse(body);

    // Check permission - teachers can assign themselves, admins can assign anyone
    const canAssign =
      isAdmin(session.user.role) ||
      (isTeacher(session.user.role) && session.user.teacherId === teacherId) ||
      hasPermission(session.user.role, Permission.ASSIGN_STUDENT);

    if (!canAssign) {
      return NextResponse.json(
        { error: 'You do not have permission to assign teachers to students' },
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

    if (!student.user.active) {
      return NextResponse.json(
        { error: 'Cannot assign teacher to inactive student' },
        { status: 400 }
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

    if (!teacher.user.active) {
      return NextResponse.json(
        { error: 'Cannot assign inactive teacher' },
        { status: 400 }
      );
    }

    // Check if assignment already exists
    const existingAssignment = await prisma.studentTeacher.findFirst({
      where: {
        studentId,
        teacherId,
      },
    });

    if (existingAssignment) {
      return NextResponse.json(
        { error: 'This teacher is already assigned to this student' },
        { status: 409 }
      );
    }

    // Create assignment
    const assignment = await prisma.studentTeacher.create({
      data: {
        studentId,
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
        message: 'Teacher assigned to student successfully',
        assignment: {
          id: assignment.id,
          assignedAt: assignment.assignedAt,
          student: {
            id: assignment.student.id,
            name: assignment.student.user.name,
            email: assignment.student.user.email,
          },
          teacher: {
            id: assignment.teacher.id,
            name: assignment.teacher.user.name,
            email: assignment.teacher.user.email,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error assigning teacher:', error);

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
      { error: 'An error occurred while assigning the teacher' },
      { status: 500 }
    );
  }
}
