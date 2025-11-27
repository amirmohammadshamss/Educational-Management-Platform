/**
 * Single User API Routes
 *
 * GET /api/users/[id] - Get single user
 * PATCH /api/users/[id] - Update user
 * DELETE /api/users/[id] - Soft delete user
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/auth';
import { hasPermission, Permission, canManageUser } from '@/lib/rbac';
import { updateUserSchema, userIdParamSchema } from '@/lib/validations/user';
import { Role } from '@prisma/client';
import { ZodError } from 'zod';

/**
 * GET /api/users/[id]
 *
 * Get a single user with related Teacher or Student data
 *
 * @param params.id - User ID
 * @returns User data with related information
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require authentication
    const session = await requireAuth();

    // Validate user ID
    const { id } = userIdParamSchema.parse({ id: params.id });

    // Check permission - users can view their own data, admins can view all
    const canView =
      session.user.id === id ||
      hasPermission(session.user.role, Permission.READ_USER);

    if (!canView) {
      return NextResponse.json(
        { error: 'You do not have permission to view this user' },
        { status: 403 }
      );
    }

    // Fetch user with related data
    const user = await prisma.user.findUnique({
      where: { id },
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
            createdAt: true,
            updatedAt: true,
            students: {
              select: {
                id: true,
                assignedAt: true,
                student: {
                  select: {
                    id: true,
                    governmentId: true,
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
              take: 5,
            },
          },
        },
        student: {
          select: {
            id: true,
            governmentId: true,
            totalAllowedHours: true,
            usedHours: true,
            createdAt: true,
            updatedAt: true,
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
                        active: true,
                      },
                    },
                  },
                },
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
              take: 5,
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error fetching user:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: 'An error occurred while fetching the user' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/users/[id]
 *
 * Update user information
 *
 * @param params.id - User ID
 * @returns Updated user data
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require authentication
    const session = await requireAuth();

    // Validate user ID
    const { id } = userIdParamSchema.parse({ id: params.id });

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateUserSchema.parse(body);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check permission
    const canUpdate =
      session.user.id === id || // Users can update their own data (limited fields)
      hasPermission(session.user.role, Permission.UPDATE_USER);

    if (!canUpdate) {
      return NextResponse.json(
        { error: 'You do not have permission to update this user' },
        { status: 403 }
      );
    }

    // If updating role, check if user can manage target roles
    if (validatedData.role && validatedData.role !== existingUser.role) {
      // Only admins can change roles
      if (!hasPermission(session.user.role, Permission.MANAGE_USERS)) {
        return NextResponse.json(
          { error: 'You do not have permission to change user roles' },
          { status: 403 }
        );
      }

      // Check if admin can manage both current and new role
      if (
        !canManageUser(session.user.role, existingUser.role) ||
        !canManageUser(session.user.role, validatedData.role)
      ) {
        return NextResponse.json(
          { error: 'You do not have permission to manage this user role' },
          { status: 403 }
        );
      }
    }

    // If user is updating themselves, they can only update name and email
    if (session.user.id === id && (validatedData.active !== undefined || validatedData.role)) {
      return NextResponse.json(
        { error: 'You cannot change your own active status or role' },
        { status: 403 }
      );
    }

    // Check if email is being changed and if it already exists
    if (validatedData.email && validatedData.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: validatedData.email },
      });

      if (emailExists) {
        return NextResponse.json(
          { error: 'A user with this email already exists' },
          { status: 409 }
        );
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: validatedData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      message: 'User updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error updating user:', error);

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
      if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: 'An error occurred while updating the user' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/users/[id]
 *
 * Soft delete a user by setting active to false
 * Also deactivates related Teacher/Student records
 *
 * @param params.id - User ID
 * @returns Success message
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require admin role
    const session = await requireRole([Role.ADMIN, Role.SUPER_ADMIN]);

    // Validate user ID
    const { id } = userIdParamSchema.parse({ id: params.id });

    // Check permission
    if (!hasPermission(session.user.role, Permission.DELETE_USER)) {
      return NextResponse.json(
        { error: 'You do not have permission to delete users' },
        { status: 403 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: {
        teacher: true,
        student: true,
      },
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent self-deletion
    if (session.user.id === id) {
      return NextResponse.json(
        { error: 'You cannot delete your own account' },
        { status: 400 }
      );
    }

    // Check if admin can manage this user's role
    if (!canManageUser(session.user.role, existingUser.role)) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this user' },
        { status: 403 }
      );
    }

    // Soft delete user and related records in a transaction
    await prisma.$transaction(async (tx) => {
      // Deactivate user
      await tx.user.update({
        where: { id },
        data: { active: false },
      });

      // Note: Teacher and Student records don't have an active field
      // They are implicitly inactive when the user is inactive
      // If you need to explicitly track this, you can add active field to those models
    });

    return NextResponse.json({
      message: 'User deactivated successfully',
    });
  } catch (error) {
    console.error('Error deleting user:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: 'An error occurred while deleting the user' },
      { status: 500 }
    );
  }
}
