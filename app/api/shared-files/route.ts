/**
 * Shared Files API Route
 *
 * POST /api/shared-files - Teacher uploads file to share
 * GET /api/shared-files - Get all shared files with filtering
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { isTeacher, isStudent, isAdmin } from '@/lib/rbac';
import { prisma } from '@/lib/prisma';
import { put } from '@vercel/blob';
import { Prisma } from '@prisma/client';

/**
 * POST /api/shared-files
 *
 * Teacher uploads a file to share with students
 * File types: PDF, DOCX, images, videos
 * Max size: 50MB
 */
export async function POST(request: NextRequest) {
  try {
    // Require authentication and teacher role
    const session = await requireAuth();

    if (!isTeacher(session.user.role) && !isAdmin(session.user.role)) {
      return NextResponse.json(
        { error: 'Only teachers can upload shared files' },
        { status: 403 }
      );
    }

    // Get teacher record
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
    });

    if (!teacher) {
      return NextResponse.json(
        { error: 'Teacher profile not found' },
        { status: 404 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const description = formData.get('description') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      );
    }

    // Validate file size (50MB max)
    const maxSize = 50 * 1024 * 1024; // 50MB in bytes
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size must be less than 50MB' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      // Documents
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      // Images
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      // Videos
      'video/mp4',
      'video/webm',
      'video/quicktime',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: PDF, DOCX, images, videos' },
        { status: 400 }
      );
    }

    // Upload file to Vercel Blob Storage
    const blob = await put(file.name, file, {
      access: 'public',
      addRandomSuffix: true,
    });

    // Create shared file record
    const sharedFile = await prisma.sharedFile.create({
      data: {
        teacherId: teacher.id,
        fileName: file.name,
        fileUrl: blob.url,
        fileSize: file.size,
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
    console.error('Error uploading shared file:', error);

    if (error instanceof Error) {
      if (
        error.message.includes('Unauthorized') ||
        error.message.includes('Forbidden')
      ) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: 'An error occurred while uploading the file' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/shared-files
 *
 * Get all shared files with filtering
 * - Teachers see only their own files
 * - Students see all files
 * - Admins see all files
 *
 * Query parameters:
 * - teacherId: Filter by teacher (optional)
 * - search: Search by filename (optional)
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const session = await requireAuth();

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const teacherIdFilter = searchParams.get('teacherId');
    const searchQuery = searchParams.get('search');

    // Build where clause based on role
    const where: Prisma.SharedFileWhereInput = {};

    if (isTeacher(session.user.role)) {
      // Teachers see only their own files
      const teacher = await prisma.teacher.findUnique({
        where: { userId: session.user.id },
      });

      if (!teacher) {
        return NextResponse.json(
          { error: 'Teacher profile not found' },
          { status: 404 }
        );
      }

      where.teacherId = teacher.id;
    }
    // Students and admins see all files (no filter)

    // Apply teacher filter if provided
    if (teacherIdFilter && (isStudent(session.user.role) || isAdmin(session.user.role))) {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: teacherIdFilter },
      });

      if (teacher) {
        where.teacherId = teacher.id;
      }
    }

    // Apply search filter if provided
    if (searchQuery) {
      where.OR = [
        { fileName: { contains: searchQuery, mode: 'insensitive' } },
        { description: { contains: searchQuery, mode: 'insensitive' } },
      ];
    }

    // Fetch shared files
    const sharedFiles = await prisma.sharedFile.findMany({
      where,
      include: {
        teacher: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        uploadedAt: 'desc', // Newest first
      },
    });

    // Format response
    const formattedFiles = sharedFiles.map((file) => ({
      id: file.id,
      fileName: file.fileName,
      fileUrl: file.fileUrl,
      fileSize: file.fileSize,
      description: file.description,
      uploadedAt: file.uploadedAt,
      teacherName: file.teacher.user.name,
      teacherId: file.teacher.userId,
    }));

    return NextResponse.json({
      files: formattedFiles,
    });
  } catch (error) {
    console.error('Error fetching shared files:', error);

    if (error instanceof Error) {
      if (
        error.message.includes('Unauthorized') ||
        error.message.includes('Forbidden')
      ) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: 'An error occurred while fetching shared files' },
      { status: 500 }
    );
  }
}
