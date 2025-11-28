/**
 * Remove Teacher Assignment API Route
 *
 * DELETE /api/students/[id]/teachers/[teacherId] - Remove teacher assignment from student
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { hasPermission, Permission, isAdmin, isTeacher } from '@/lib/rbac';
import { studentIdParamSchema, teacherIdParamSchema } from '@/lib/validations/student';
import { ZodError } from 'zod';

/**
 * DELETE /api/students/[id]/teachers/[teacherId]
 *
 * Remove a teacher assignment from a student
 * Deletes the StudentTeacher relationship
 *
 * @param params.id - Student ID
 * @param params.teacherId - Teacher ID
 * @returns Success message
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; teacherId: string } }
) {
  try {
    // Require authentication
    const session = await requireAuth();

    // Validate IDs
    const { id: studentId } = studentIdParamSchema.parse({ id: params.id });
    const { teacherId } = teacherIdParamSchema.parse({ teacherId: params.teacherId });

    // Check permission - teachers can remove themselves, admins can remove any
    const canRemove =
      isAdmin(session.user.role) ||
      (isTeacher(session.user.role) && session.user.teacherId === teacherId) ||
      hasPermission(session.user.role, Permission.ASSIGN_STUDENT);

    if (!canRemove) {
      return NextResponse.json(
        { error: 'You do not have permission to remove teacher assignments' },
        { status: 403 }
      );
    }

    // Check if assignment exists
    const assignment = await prisma.studentTeacher.findFirst({
      where: {
        studentId,
        teacherId,
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        teacher: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: 'Teacher assignment not found' },
        { status: 404 }
      );
    }

    // Delete assignment
    await prisma.studentTeacher.delete({
      where: {
        id: assignment.id,
      },
    });

    return NextResponse.json({
      message: 'Teacher assignment removed successfully',
      details: {
        studentName: assignment.student.user.name,
        teacherName: assignment.teacher.user.name,
      },
    });
  } catch (error) {
    console.error('Error removing teacher assignment:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid ID format' },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: 'An error occurred while removing the teacher assignment' },
      { status: 500 }
    );
  }
}
