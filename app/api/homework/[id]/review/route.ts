/**
 * Homework Review API Route
 *
 * PATCH /api/homework/[id]/review - Review homework submission
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { isAdmin, isTeacher } from '@/lib/rbac';
import { prisma } from '@/lib/prisma';
import { homeworkReviewSchema } from '@/lib/validations/homework';
import { ZodError } from 'zod';
import { HomeworkStatus } from '@prisma/client';

/**
 * PATCH /api/homework/[id]/review
 *
 * Review homework submission
 * - Accept status (APPROVED, REJECTED, NEEDS_REVISION)
 * - Accept optional feedback text
 * - Set reviewedAt timestamp
 * - Teacher or Admin only
 * - TODO: Send notification to student
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require authentication
    const session = await requireAuth();

    // Only teachers and admins can review homework
    if (!isTeacher(session.user.role) && !isAdmin(session.user.role)) {
      return NextResponse.json(
        { error: 'Only teachers and admins can review homework' },
        { status: 403 }
      );
    }

    const homeworkId = params.id;

    // Parse and validate request body
    const body = await request.json();
    const validatedData = homeworkReviewSchema.parse(body);

    // Fetch homework to verify it exists and check authorization
    const homework = await prisma.homework.findUnique({
      where: { id: homeworkId },
      include: {
        student: {
          include: { user: true },
        },
        teacher: {
          include: { user: true },
        },
      },
    });

    if (!homework) {
      return NextResponse.json(
        { error: 'Homework not found' },
        { status: 404 }
      );
    }

    // Authorization: Teachers can only review homework submitted to them
    // Admins can review any homework
    if (
      isTeacher(session.user.role) &&
      homework.teacher.userId !== session.user.id
    ) {
      return NextResponse.json(
        { error: 'You can only review homework submitted to you' },
        { status: 403 }
      );
    }

    // Update homework with review
    const updatedHomework = await prisma.homework.update({
      where: { id: homeworkId },
      data: {
        status: validatedData.status as HomeworkStatus,
        feedback: validatedData.feedback || null,
        reviewedAt: new Date(),
      },
      include: {
        student: {
          include: { user: true },
        },
        teacher: {
          include: { user: true },
        },
      },
    });

    // Send notification to student about homework review
    try {
      const { sendHomeworkReviewNotification } = await import('@/lib/notifications');

      await sendHomeworkReviewNotification({
        studentName: homework.student.user.name,
        studentEmail: homework.student.user.email,
        teacherName: homework.teacher.user.name,
        fileName: homework.fileName,
        status: validatedData.status as HomeworkStatus,
        feedback: validatedData.feedback || '',
        homeworkUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/student/homework`,
      });

      console.log(`✅ Homework review notification sent to ${homework.student.user.email}`);
    } catch (notificationError) {
      // Log error but don't fail the review
      console.error('Failed to send homework review notification:', notificationError);
    }

    // Format response
    const response = {
      id: updatedHomework.id,
      student: {
        id: updatedHomework.student.userId,
        name: updatedHomework.student.user.name,
        email: updatedHomework.student.user.email,
      },
      teacher: {
        id: updatedHomework.teacher.userId,
        name: updatedHomework.teacher.user.name,
        email: updatedHomework.teacher.user.email,
      },
      fileUrl: updatedHomework.fileUrl,
      fileName: updatedHomework.fileName,
      fileSize: updatedHomework.fileSize,
      status: updatedHomework.status,
      feedback: updatedHomework.feedback,
      submittedAt: updatedHomework.submittedAt,
      reviewedAt: updatedHomework.reviewedAt,
      updatedAt: updatedHomework.updatedAt,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error reviewing homework:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: error.issues.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      if (
        error.message.includes('Unauthorized') ||
        error.message.includes('Forbidden')
      ) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: 'An error occurred while reviewing homework' },
      { status: 500 }
    );
  }
}
