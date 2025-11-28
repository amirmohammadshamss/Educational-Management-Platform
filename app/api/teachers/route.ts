/**
 * Teachers API Routes
 *
 * GET /api/teachers - Get all teachers with pagination and search
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { hasPermission, Permission } from '@/lib/rbac';
import { getTeachersQuerySchema } from '@/lib/validations/teacher';
import { Role } from '@prisma/client';
import { ZodError } from 'zod';

/**
 * GET /api/teachers
 *
 * Get all teachers with pagination and search
 * Admin only access
 */
export async function GET(request: NextRequest) {
  try {
    // Require admin role
    const session = await requireRole([Role.ADMIN, Role.SUPER_ADMIN]);

    // Check permission
    if (!hasPermission(session.user.role, Permission.READ_TEACHER)) {
      return NextResponse.json(
        { error: 'You do not have permission to view teachers' },
        { status: 403 }
      );
    }

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
      search: searchParams.get('search') || undefined,
      active: searchParams.get('active') || undefined,
    };

    const validatedQuery = getTeachersQuerySchema.parse(queryParams);

    // Build where clause
    const where: any = {};

    // Filter by active status
    if (validatedQuery.active !== undefined) {
      where.user = {
        active: validatedQuery.active,
      };
    }

    // Search functionality
    if (validatedQuery.search) {
      where.user = {
        ...where.user,
        OR: [
          { name: { contains: validatedQuery.search, mode: 'insensitive' } },
          { email: { contains: validatedQuery.search, mode: 'insensitive' } },
        ],
      };
    }

    // Calculate pagination
    const page = validatedQuery.page;
    const limit = validatedQuery.limit;
    const skip = (page - 1) * limit;

    // Fetch teachers with pagination
    const [teachers, totalCount] = await Promise.all([
      prisma.teacher.findMany({
        where,
        select: {
          id: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              active: true,
            },
          },
          _count: {
            select: {
              students: true,
              bookings: true,
              homeworkAssigned: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.teacher.count({ where }),
    ]);

    // Transform data to include counts
    const teachersWithCounts = teachers.map((teacher) => ({
      id: teacher.id,
      createdAt: teacher.createdAt,
      updatedAt: teacher.updatedAt,
      user: teacher.user,
      studentCount: teacher._count.students,
      bookingCount: teacher._count.bookings,
      homeworkCount: teacher._count.homeworkAssigned,
    }));

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return NextResponse.json({
      teachers: teachersWithCounts,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
    });
  } catch (error) {
    console.error('Error fetching teachers:', error);

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
      if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: 'An error occurred while fetching teachers' },
      { status: 500 }
    );
  }
}
