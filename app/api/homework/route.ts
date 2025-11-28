/**
 * Homework List API Route
 *
 * GET /api/homework - Get homework submissions with filtering
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { isTeacher, isStudent } from '@/lib/rbac';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { homeworkQuerySchema } from '@/lib/validations/homework';
import { ZodError } from 'zod';

/**
 * GET /api/homework
 *
 * Get homework submissions with filtering and pagination
 * - Teachers see homework submitted to them
 * - Students see their own homework
 * - Admins see all homework
 * - Support filtering by studentId, teacherId, status
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const session = await requireAuth();

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
      studentId: searchParams.get('studentId') || undefined,
      teacherId: searchParams.get('teacherId') || undefined,
      status: searchParams.get('status') || undefined,
    };

    const validatedQuery = homeworkQuerySchema.parse(queryParams);

    // Build where clause based on role
    const where: Prisma.HomeworkWhereInput = {};

    if (isStudent(session.user.role)) {
      // Students can only see their own homework
      where.student = {
        userId: session.user.id,
      };
    } else if (isTeacher(session.user.role)) {
      // Teachers can only see homework submitted to them
      where.teacher = {
        userId: session.user.id,
      };
    }
    // Admins can see all homework (no additional where clause)

    // Apply filters (if provided and allowed)
    if (validatedQuery.studentId) {
      // Verify user has permission to filter by this studentId
      if (
        isStudent(session.user.role) &&
        session.user.id !== validatedQuery.studentId
      ) {
        return NextResponse.json(
          { error: 'You can only view your own homework' },
          { status: 403 }
        );
      }

      // For teachers and admins, apply the filter
      if (!isStudent(session.user.role)) {
        where.student = {
          userId: validatedQuery.studentId,
        };
      }
    }

    if (validatedQuery.teacherId) {
      // Verify user has permission to filter by this teacherId
      if (
        isTeacher(session.user.role) &&
        session.user.id !== validatedQuery.teacherId
      ) {
        return NextResponse.json(
          { error: 'You can only view homework submitted to you' },
          { status: 403 }
        );
      }

      // For students and admins, apply the filter
      if (!isTeacher(session.user.role)) {
        where.teacher = {
          userId: validatedQuery.teacherId,
        };
      }
    }

    if (validatedQuery.status) {
      where.status = validatedQuery.status;
    }

    // Count total homework for pagination
    const totalCount = await prisma.homework.count({ where });

    // Calculate pagination
    const page = validatedQuery.page;
    const limit = validatedQuery.limit;
    const skip = (page - 1) * limit;
    const totalPages = Math.ceil(totalCount / limit);

    // Fetch homework submissions
    const homework = await prisma.homework.findMany({
      where,
      include: {
        student: {
          include: { user: true },
        },
        teacher: {
          include: { user: true },
        },
      },
      orderBy: {
        submittedAt: 'desc', // Most recent first
      },
      skip,
      take: limit,
    });

    // Format response
    const formattedHomework = homework.map((hw) => ({
      id: hw.id,
      studentId: hw.student.userId,
      studentName: hw.student.user.name,
      studentEmail: hw.student.user.email,
      teacherId: hw.teacher.userId,
      teacherName: hw.teacher.user.name,
      teacherEmail: hw.teacher.user.email,
      fileUrl: hw.fileUrl,
      fileName: hw.fileName,
      fileSize: hw.fileSize,
      status: hw.status,
      feedback: hw.feedback,
      submittedAt: hw.submittedAt,
      reviewedAt: hw.reviewedAt,
      updatedAt: hw.updatedAt,
    }));

    return NextResponse.json({
      homework: formattedHomework,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching homework:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
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
      { error: 'An error occurred while fetching homework' },
      { status: 500 }
    );
  }
}
