/**
 * Single Shared File API Route
 *
 * GET /api/shared-files/[id] - Get single file details
 * DELETE /api/shared-files/[id] - Delete file (teacher owns it or admin)
 * PATCH /api/shared-files/[id] - Update file description
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { isTeacher, isAdmin } from '@/lib/rbac';
import { prisma } from '@/lib/prisma';
import { del } from '@vercel/blob';

/**
 * GET /api/shared-files/[id]
 *
 * Get single file details
 * Anyone authenticated can view file details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require authentication
    const session = await requireAuth();

    const fileId = params.id;

    // Fetch file
    const sharedFile = await prisma.sharedFile.findUnique({
      where: { id: fileId },
      include: {
        teacher: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!sharedFile) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      file: {
        id: sharedFile.id,
        fileName: sharedFile.fileName,
        fileUrl: sharedFile.fileUrl,
        fileSize: sharedFile.fileSize,
        description: sharedFile.description,
        uploadedAt: sharedFile.uploadedAt,
        teacherName: sharedFile.teacher.user.name,
        teacherId: sharedFile.teacher.userId,
      },
    });
  } catch (error) {
    console.error('Error fetching shared file:', error);

    if (error instanceof Error) {
      if (
        error.message.includes('Unauthorized') ||
        error.message.includes('Forbidden')
      ) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: 'An error occurred while fetching the file' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/shared-files/[id]
 *
 * Update file description
 * Only the teacher who uploaded the file or admin can update
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require authentication
    const session = await requireAuth();

    if (!isTeacher(session.user.role) && !isAdmin(session.user.role)) {
      return NextResponse.json(
        { error: 'Only teachers can update shared files' },
        { status: 403 }
      );
    }

    const fileId = params.id;

    // Parse request body
    const { description } = await request.json();

    // Fetch file to check ownership
    const sharedFile = await prisma.sharedFile.findUnique({
      where: { id: fileId },
      include: {
        teacher: true,
      },
    });

    if (!sharedFile) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Check if user is the owner or admin
    const isOwner = sharedFile.teacher.userId === session.user.id;
    if (!isOwner && !isAdmin(session.user.role)) {
      return NextResponse.json(
        { error: 'You can only update your own files' },
        { status: 403 }
      );
    }

    // Update file description
    const updatedFile = await prisma.sharedFile.update({
      where: { id: fileId },
      data: {
        description: description || null,
      },
      include: {
        teacher: {
          include: {
            user: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      file: {
        id: updatedFile.id,
        fileName: updatedFile.fileName,
        fileUrl: updatedFile.fileUrl,
        fileSize: updatedFile.fileSize,
        description: updatedFile.description,
        uploadedAt: updatedFile.uploadedAt,
        teacherName: updatedFile.teacher.user.name,
        teacherId: updatedFile.teacher.userId,
      },
    });
  } catch (error) {
    console.error('Error updating shared file:', error);

    if (error instanceof Error) {
      if (
        error.message.includes('Unauthorized') ||
        error.message.includes('Forbidden')
      ) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: 'An error occurred while updating the file' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/shared-files/[id]
 *
 * Delete shared file
 * - Teacher can delete own file
 * - Admin can delete any file
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require authentication
    const session = await requireAuth();

    if (!isTeacher(session.user.role) && !isAdmin(session.user.role)) {
      return NextResponse.json(
        { error: 'Only teachers can delete shared files' },
        { status: 403 }
      );
    }

    const fileId = params.id;

    // Fetch file to check ownership and get blob URL
    const sharedFile = await prisma.sharedFile.findUnique({
      where: { id: fileId },
      include: {
        teacher: true,
      },
    });

    if (!sharedFile) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Check if user is the owner or admin
    const isOwner = sharedFile.teacher.userId === session.user.id;
    if (!isOwner && !isAdmin(session.user.role)) {
      return NextResponse.json(
        { error: 'You can only delete your own files' },
        { status: 403 }
      );
    }

    // Delete file from Vercel Blob Storage
    try {
      await del(sharedFile.fileUrl);
    } catch (blobError) {
      console.error('Error deleting file from blob storage:', blobError);
      // Continue with database deletion even if blob deletion fails
    }

    // Delete file record from database
    await prisma.sharedFile.delete({
      where: { id: fileId },
    });

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting shared file:', error);

    if (error instanceof Error) {
      if (
        error.message.includes('Unauthorized') ||
        error.message.includes('Forbidden')
      ) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: 'An error occurred while deleting the file' },
      { status: 500 }
    );
  }
}
