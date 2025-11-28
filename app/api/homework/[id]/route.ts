/**
 * Single Homework API Route
 *
 * GET /api/homework/[id] - Get single homework submission
 * DELETE /api/homework/[id] - Delete homework submission
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { isAdmin, isTeacher, isStudent } from '@/lib/rbac';
import { prisma } from '@/lib/prisma';
import { deleteFile } from '@/lib/blob-storage';

/**
 * GET /api/homework/[id]
 *
 * Get single homework submission with full details
 * - Include file URL for download
 * - Authorization check based on role
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require authentication
    const session = await requireAuth();

    const homeworkId = params.id;

    // Fetch homework with full details
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

    // Authorization check
    const isOwner = homework.student.userId === session.user.id;
    const isAssignedTeacher = homework.teacher.userId === session.user.id;
    const canView = isAdmin(session.user.role) || isOwner || isAssignedTeacher;

    if (!canView) {
      return NextResponse.json(
        { error: 'You do not have permission to view this homework' },
        { status: 403 }
      );
    }

    // Format response
    const response = {
      id: homework.id,
      student: {
        id: homework.student.userId,
        name: homework.student.user.name,
        email: homework.student.user.email,
      },
      teacher: {
        id: homework.teacher.userId,
        name: homework.teacher.user.name,
        email: homework.teacher.user.email,
      },
      fileUrl: homework.fileUrl,
      fileName: homework.fileName,
      fileSize: homework.fileSize,
      status: homework.status,
      feedback: homework.feedback,
      submittedAt: homework.submittedAt,
      reviewedAt: homework.reviewedAt,
      updatedAt: homework.updatedAt,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching homework:', error);

    if (error instanceof Error) {
      if (
        error.message.includes('Unauthorized') ||
        error.message.includes('Forbidden')
      ) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: 'An error occurred while fetching homework' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/homework/[id]
 *
 * Delete homework submission
 * - Delete file from Blob Storage
 * - Delete database record
 * - Students can delete own pending homework
 * - Admins can delete any homework
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require authentication
    const session = await requireAuth();

    const homeworkId = params.id;

    // Fetch homework to verify it exists and check authorization
    const homework = await prisma.homework.findUnique({
      where: { id: homeworkId },
      include: {
        student: {
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

    // Authorization check
    const isOwner = homework.student.userId === session.user.id;
    const canDelete =
      isAdmin(session.user.role) ||
      (isOwner && homework.status === 'PENDING');

    if (!canDelete) {
      return NextResponse.json(
        {
          error: isOwner
            ? 'You can only delete pending homework'
            : 'You do not have permission to delete this homework',
        },
        { status: 403 }
      );
    }

    // Delete file from Blob Storage
    try {
      await deleteFile(homework.fileUrl);
    } catch (blobError) {
      console.error('Failed to delete file from Blob Storage:', blobError);
      // Continue with database deletion even if blob deletion fails
      // The file might already be deleted or unreachable
    }

    // Delete homework record from database
    await prisma.homework.delete({
      where: { id: homeworkId },
    });

    return NextResponse.json({
      success: true,
      message: 'Homework deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting homework:', error);

    if (error instanceof Error) {
      if (
        error.message.includes('Unauthorized') ||
        error.message.includes('Forbidden')
      ) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: 'An error occurred while deleting homework' },
      { status: 500 }
    );
  }
}
