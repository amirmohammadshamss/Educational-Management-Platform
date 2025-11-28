/**
 * Single Teacher API Route
 *
 * GET /api/teachers/[id] - Get single teacher with full details
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { hasPermission, Permission, isAdmin, isTeacher } from '@/lib/rbac';
import { teacherIdParamSchema } from '@/lib/validations/teacher';
import { HomeworkStatus } from '@prisma/client';
import { ZodError } from 'zod';

/**
 * GET /api/teachers/[id]
 *
 * Get single teacher with complete information
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require authentication
    const session = await requireAuth();

    // Validate teacher ID
    const { id } = teacherIdParamSchema.parse({ id: params.id });

    // Check access permission
    const isOwnProfile = session.user.teacherId === id;
    const canView =
      isOwnProfile ||
      isAdmin(session.user.role) ||
      hasPermission(session.user.role, Permission.READ_TEACHER);

    if (!canView) {
      return NextResponse.json(
        { error: 'You do not have permission to view this teacher' },
        { status: 403 }
      );
    }

    // Fetch teacher
    const teacher = await prisma.teacher.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            active: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        students: {
          include: {
            student: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    active: true,
                  },
                },
              },
            },
          },
          orderBy: {
            assignedAt: 'desc',
          },
        },
        bookings: {
          select: {
            id: true,
            date: true,
            duration: true,
            status: true,
          },
          orderBy: {
            date: 'desc',
          },
          take: 10,
        },
        homeworkAssigned: {
          select: {
            id: true,
            status: true,
            submittedAt: true,
            reviewedAt: true,
          },
          orderBy: {
            submittedAt: 'desc',
          },
          take: 10,
        },
      },
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    // Calculate statistics
    const homeworkStats = {
      total: teacher.homeworkAssigned.length,
      pending: teacher.homeworkAssigned.filter((h) => h.status === HomeworkStatus.PENDING).length,
      approved: teacher.homeworkAssigned.filter((h) => h.status === HomeworkStatus.APPROVED).length,
      rejected: teacher.homeworkAssigned.filter((h) => h.status === HomeworkStatus.REJECTED).length,
      needsRevision: teacher.homeworkAssigned.filter((h) => h.status === HomeworkStatus.NEEDS_REVISION).length,
    };

    const bookingStats = {
      total: teacher.bookings.length,
      upcoming: teacher.bookings.filter((b) => new Date(b.date) > new Date()).length,
      past: teacher.bookings.filter((b) => new Date(b.date) <= new Date()).length,
    };

    return NextResponse.json({
      teacher: {
        ...teacher,
        statistics: {
          studentCount: teacher.students.length,
          homeworkStats,
          bookingStats,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching teacher:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid teacher ID format' },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: 'An error occurred while fetching the teacher' },
      { status: 500 }
    );
  }
}
