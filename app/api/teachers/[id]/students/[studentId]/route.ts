/**
 * Assign Student to Teacher API Route
 *
 * POST /api/teachers/[id]/students/[studentId] - Assign student to teacher
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { hasPermission, Permission, isAdmin } from '@/lib/rbac';
import { teacherIdParamSchema } from '@/lib/validations/teacher';
import { studentIdParamSchema } from '@/lib/validations/student';
import { ZodError } from 'zod';

/**
 * POST /api/teachers/[id]/students/[studentId]
 *
 * Assign a student to a teacher
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; studentId: string } }
) {
  try {
    // Require authentication
    const session = await requireAuth();

    // Validate IDs
    const { id: teacherId } = teacherIdParamSchema.parse({ id: params.id });
    const { id: studentId } = studentIdParamSchema.parse({ id: params.studentId });

    // Check permission - teachers can assign to themselves, admins can assign to any
    const isAssigningToSelf = session.user.teacherId === teacherId;
    const canAssign =
      isAssigningToSelf ||
      isAdmin(session.user.role) ||
      hasPermission(session.user.role, Permission.ASSIGN_STUDENT);

    if (!canAssign) {
      return NextResponse.json(
        { error: 'You do not have permission to assign students' },
        { status: 403 }
      );
    }

    // Check if teacher exists
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
      include: {
        user: {
          select: {
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
        { error: 'Cannot assign to inactive teacher' },
        { status: 400 }
      );
    }

    // Check if student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: {
          select: {
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
        { error: 'Cannot assign inactive student' },
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
        { error: 'Student is already assigned to this teacher' },
        { status: 409 }
      );
    }

    // Create assignment
    const assignment = await prisma.studentTeacher.create({
      data: {
        studentId,
        teacherId,
      },
    });

    return NextResponse.json(
      {
        message: 'Student assigned to teacher successfully',
        assignment: {
          id: assignment.id,
          assignedAt: assignment.assignedAt,
          teacherName: teacher.user.name,
          studentName: student.user.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error assigning student:', error);

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
      { error: 'An error occurred while assigning the student' },
      { status: 500 }
    );
  }
}
