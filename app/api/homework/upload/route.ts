/**
 * Homework Upload API Route
 *
 * POST /api/homework/upload - Upload homework submission
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { isStudent, isAdmin } from '@/lib/rbac';
import { prisma } from '@/lib/prisma';
import { uploadFile } from '@/lib/blob-storage';
import { homeworkUploadSchema } from '@/lib/validations/homework';
import { ZodError } from 'zod';

/**
 * POST /api/homework/upload
 *
 * Upload homework submission
 * - Accept multipart/form-data with file
 * - Validate file type and size
 * - Upload to Vercel Blob Storage
 * - Create Homework record in database
 * - Students can only upload for themselves
 */
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const session = await requireAuth();

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const studentId = formData.get('studentId') as string;
    const teacherId = formData.get('teacherId') as string;

    // Validate required fields
    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      );
    }

    // Validate form data
    const validatedData = homeworkUploadSchema.parse({
      studentId,
      teacherId,
    });

    // Authorization: Students can only upload for themselves
    // Admins can upload on behalf of students
    if (
      isStudent(session.user.role) &&
      session.user.id !== validatedData.studentId
    ) {
      return NextResponse.json(
        { error: 'Students can only upload homework for themselves' },
        { status: 403 }
      );
    }

    // Verify student exists and is active
    const student = await prisma.student.findUnique({
      where: { userId: validatedData.studentId },
      include: { user: true },
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    if (!student.user.active) {
      return NextResponse.json(
        { error: 'Student account is inactive' },
        { status: 403 }
      );
    }

    // Verify teacher exists and is active
    const teacher = await prisma.teacher.findUnique({
      where: { userId: validatedData.teacherId },
      include: { user: true },
    });

    if (!teacher) {
      return NextResponse.json(
        { error: 'Teacher not found' },
        { status: 404 }
      );
    }

    if (!teacher.user.active) {
      return NextResponse.json(
        { error: 'Teacher account is inactive' },
        { status: 403 }
      );
    }

    // Upload file to Vercel Blob Storage
    // File will be validated automatically by uploadFile function
    let uploadResult;
    try {
      uploadResult = await uploadFile(file, `homework/${validatedData.studentId}`);
    } catch (uploadError) {
      return NextResponse.json(
        {
          error: uploadError instanceof Error ? uploadError.message : 'File upload failed',
        },
        { status: 400 }
      );
    }

    // Create homework record in database
    const homework = await prisma.homework.create({
      data: {
        studentId: student.id,
        teacherId: teacher.id,
        fileUrl: uploadResult.url,
        fileName: file.name,
        fileSize: uploadResult.size,
        status: 'PENDING',
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

    return NextResponse.json(
      {
        success: true,
        homework: {
          id: homework.id,
          studentId: validatedData.studentId,
          studentName: homework.student.user.name,
          teacherId: validatedData.teacherId,
          teacherName: homework.teacher.user.name,
          fileUrl: homework.fileUrl,
          fileName: homework.fileName,
          fileSize: homework.fileSize,
          status: homework.status,
          submittedAt: homework.submittedAt,
          updatedAt: homework.updatedAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Homework upload error:', error);

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
      { error: 'An error occurred while uploading homework' },
      { status: 500 }
    );
  }
}
