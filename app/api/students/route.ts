/**
 * Students API Routes
 *
 * GET /api/students - Get all students with pagination and search
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { hasPermission, Permission, isAdmin, isTeacher } from '@/lib/rbac';
import { getStudentsQuerySchema } from '@/lib/validations/student';
import { ZodError } from 'zod';

/**
 * GET /api/students
 *
 * Get all students with pagination, filtering, and search
 * Accessible by Admin and Teacher
 *
 * Query parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10, max: 100)
 * - search: Search by name, email, or governmentId
 * - active: Filter by active status
 *
 * @returns Paginated list of students with hours calculation
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const session = await requireAuth();

    // Check if user is admin or teacher
    const canView =
      isAdmin(session.user.role) ||
      isTeacher(session.user.role) ||
      hasPermission(session.user.role, Permission.READ_STUDENT);

    if (!canView) {
      return NextResponse.json(
        { error: 'You do not have permission to view students' },
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

    const validatedQuery = getStudentsQuerySchema.parse(queryParams);

    // Build where clause
    const where: any = {};

    // If teacher, only show assigned students
    if (isTeacher(session.user.role) && session.user.teacherId) {
      where.teachers = {
        some: {
          teacherId: session.user.teacherId,
        },
      };
    }

    // Filter by active status (through user relation)
    if (validatedQuery.active !== undefined) {
      where.user = {
        active: validatedQuery.active,
      };
    }

    // Search functionality
    if (validatedQuery.search) {
      where.OR = [
        {
          user: {
            name: { contains: validatedQuery.search, mode: 'insensitive' },
          },
        },
        {
          user: {
            email: { contains: validatedQuery.search, mode: 'insensitive' },
          },
        },
        {
          governmentId: { contains: validatedQuery.search, mode: 'insensitive' },
        },
      ];
    }

    // Calculate pagination
    const page = validatedQuery.page;
    const limit = validatedQuery.limit;
    const skip = (page - 1) * limit;

    // Fetch students with pagination
    const [students, totalCount] = await Promise.all([
      prisma.student.findMany({
        where,
        select: {
          id: true,
          governmentId: true,
          totalAllowedHours: true,
          usedHours: true,
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
          teachers: {
            select: {
              id: true,
              assignedAt: true,
              teacher: {
                select: {
                  id: true,
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                    },
                  },
                },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.student.count({ where }),
    ]);

    // Calculate remaining hours for each student
    const studentsWithRemainingHours = students.map((student) => ({
      ...student,
      remainingHours: Math.max(0, student.totalAllowedHours - student.usedHours),
    }));

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return NextResponse.json({
      students: studentsWithRemainingHours,
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
    console.error('Error fetching students:', error);

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
      { error: 'An error occurred while fetching students' },
      { status: 500 }
    );
  }
}
