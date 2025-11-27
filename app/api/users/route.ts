/**
 * User Management API Routes
 *
 * POST /api/users - Create new user
 * GET /api/users - Get all users with pagination and filtering
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { requireRole } from '@/lib/auth';
import { hasPermission, Permission } from '@/lib/rbac';
import { createUserSchema, getUsersQuerySchema } from '@/lib/validations/user';
import { Role } from '@prisma/client';
import { ZodError } from 'zod';

/**
 * POST /api/users
 *
 * Create a new user with appropriate role-based records (Teacher/Student)
 *
 * @returns Created user data (without password)
 */
export async function POST(request: NextRequest) {
  try {
    // Require admin role
    const session = await requireRole([Role.ADMIN, Role.SUPER_ADMIN]);

    // Check permission
    if (!hasPermission(session.user.role, Permission.CREATE_USER)) {
      return NextResponse.json(
        { error: 'You do not have permission to create users' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createUserSchema.parse(body);

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 409 }
      );
    }

    // Hash the password
    const passwordHash = await hashPassword(validatedData.password);

    // Create user with transaction to ensure data integrity
    const user = await prisma.$transaction(async (tx) => {
      // Create the user
      const newUser = await tx.user.create({
        data: {
          name: validatedData.name,
          email: validatedData.email,
          passwordHash,
          role: validatedData.role,
          active: true,
        },
      });

      // Create corresponding Teacher or Student record
      if (validatedData.role === Role.TEACHER) {
        await tx.teacher.create({
          data: {
            userId: newUser.id,
          },
        });
      } else if (validatedData.role === Role.STUDENT) {
        if (!validatedData.governmentId) {
          throw new Error('Government ID is required for student accounts');
        }

        // Check if government ID already exists
        const existingStudent = await tx.student.findUnique({
          where: { governmentId: validatedData.governmentId },
        });

        if (existingStudent) {
          throw new Error('A student with this government ID already exists');
        }

        await tx.student.create({
          data: {
            userId: newUser.id,
            governmentId: validatedData.governmentId,
            totalAllowedHours: 0,
            usedHours: 0,
          },
        });
      }

      return newUser;
    });

    // Return user data without password
    const { passwordHash: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      {
        message: 'User created successfully',
        user: userWithoutPassword,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating user:', error);

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
      if (error.message.includes('Government ID') || error.message.includes('already exists')) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: 'An error occurred while creating the user' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/users
 *
 * Get all users with pagination, filtering, and search
 *
 * Query parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10, max: 100)
 * - role: Filter by role
 * - search: Search by name or email
 * - active: Filter by active status
 *
 * @returns Paginated list of users
 */
export async function GET(request: NextRequest) {
  try {
    // Require admin role
    const session = await requireRole([Role.ADMIN, Role.SUPER_ADMIN]);

    // Check permission
    if (!hasPermission(session.user.role, Permission.READ_USER)) {
      return NextResponse.json(
        { error: 'You do not have permission to view users' },
        { status: 403 }
      );
    }

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
      role: searchParams.get('role') || undefined,
      search: searchParams.get('search') || undefined,
      active: searchParams.get('active') || undefined,
    };

    const validatedQuery = getUsersQuerySchema.parse(queryParams);

    // Build where clause for filtering
    const where: any = {};

    if (validatedQuery.role) {
      where.role = validatedQuery.role;
    }

    if (validatedQuery.active !== undefined) {
      where.active = validatedQuery.active;
    }

    if (validatedQuery.search) {
      where.OR = [
        { name: { contains: validatedQuery.search, mode: 'insensitive' } },
        { email: { contains: validatedQuery.search, mode: 'insensitive' } },
      ];
    }

    // Calculate pagination
    const page = validatedQuery.page;
    const limit = validatedQuery.limit;
    const skip = (page - 1) * limit;

    // Fetch users with pagination
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          active: true,
          createdAt: true,
          updatedAt: true,
          teacher: {
            select: {
              id: true,
            },
          },
          student: {
            select: {
              id: true,
              governmentId: true,
              totalAllowedHours: true,
              usedHours: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.user.count({ where }),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return NextResponse.json({
      users,
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
    console.error('Error fetching users:', error);

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
      { error: 'An error occurred while fetching users' },
      { status: 500 }
    );
  }
}
