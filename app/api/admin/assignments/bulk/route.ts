/**
 * Bulk Assignment API Route
 *
 * PATCH /api/admin/assignments/bulk - Create multiple student-teacher assignments
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { isAdmin } from '@/lib/rbac';
import { z, ZodError } from 'zod';

/**
 * Assignment schema for individual assignment
 */
const assignmentSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  teacherId: z.string().min(1, 'Teacher ID is required'),
});

/**
 * Bulk assignment request schema
 */
const bulkAssignmentSchema = z.object({
  assignments: z.array(assignmentSchema).min(1, 'At least one assignment is required'),
});

/**
 * Assignment result type
 */
type AssignmentResult = {
  studentId: string;
  teacherId: string;
  success: boolean;
  message?: string;
  assignmentId?: string;
};

/**
 * PATCH /api/admin/assignments/bulk
 *
 * Create multiple student-teacher assignments in bulk
 * Each assignment is processed independently
 * Returns success/failure status for each assignment
 *
 * @returns Array of results for each assignment
 */
export async function PATCH(request: NextRequest) {
  try {
    // Require authentication and admin role
    const session = await requireAuth();

    if (!isAdmin(session.user.role)) {
      return NextResponse.json(
        { error: 'Only administrators can manage bulk assignments' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const { assignments } = bulkAssignmentSchema.parse(body);

    // Process each assignment
    const results: AssignmentResult[] = [];

    for (const assignment of assignments) {
      const { studentId, teacherId } = assignment;

      try {
        // Check if student exists and is active
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
          results.push({
            studentId,
            teacherId,
            success: false,
            message: 'Student not found',
          });
          continue;
        }

        if (!student.user.active) {
          results.push({
            studentId,
            teacherId,
            success: false,
            message: 'Student account is inactive',
          });
          continue;
        }

        // Check if teacher exists and is active
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
          results.push({
            studentId,
            teacherId,
            success: false,
            message: 'Teacher not found',
          });
          continue;
        }

        if (!teacher.user.active) {
          results.push({
            studentId,
            teacherId,
            success: false,
            message: 'Teacher account is inactive',
          });
          continue;
        }

        // Check if assignment already exists
        const existingAssignment = await prisma.studentTeacher.findFirst({
          where: {
            studentId,
            teacherId,
          },
        });

        if (existingAssignment) {
          results.push({
            studentId,
            teacherId,
            success: false,
            message: 'Assignment already exists',
            assignmentId: existingAssignment.id,
          });
          continue;
        }

        // Create the assignment
        const newAssignment = await prisma.studentTeacher.create({
          data: {
            studentId,
            teacherId,
          },
        });

        results.push({
          studentId,
          teacherId,
          success: true,
          message: 'Assignment created successfully',
          assignmentId: newAssignment.id,
        });
      } catch (error) {
        console.error(`Error processing assignment for student ${studentId} and teacher ${teacherId}:`, error);
        results.push({
          studentId,
          teacherId,
          success: false,
          message: error instanceof Error ? error.message : 'An error occurred while creating assignment',
        });
      }
    }

    // Calculate summary
    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    return NextResponse.json(
      {
        message: `Processed ${assignments.length} assignments: ${successCount} successful, ${failureCount} failed`,
        summary: {
          total: assignments.length,
          successful: successCount,
          failed: failureCount,
        },
        results,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error processing bulk assignments:', error);

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
      { error: 'An error occurred while processing bulk assignments' },
      { status: 500 }
    );
  }
}
