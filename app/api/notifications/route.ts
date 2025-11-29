/**
 * Notifications API Route
 *
 * GET /api/notifications - Fetch user's notifications with filtering and pagination
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma, NotificationType } from '@prisma/client';

/**
 * GET /api/notifications
 *
 * Fetch notifications for the authenticated user
 * Query parameters:
 * - page: number (default: 1)
 * - limit: number (default: 20, max: 100)
 * - isRead: boolean (filter by read status)
 * - type: NotificationType (filter by notification type)
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const session = await requireAuth();

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const isReadParam = searchParams.get('isRead');
    const typeParam = searchParams.get('type');

    // Validate page and limit
    if (page < 1 || limit < 1) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }

    // Build where clause
    const where: Prisma.NotificationWhereInput = {
      userId: session.user.id,
    };

    // Filter by read status
    if (isReadParam !== null) {
      where.isRead = isReadParam === 'true';
    }

    // Filter by type
    if (typeParam) {
      // Validate notification type
      if (!Object.values(NotificationType).includes(typeParam as NotificationType)) {
        return NextResponse.json(
          { error: 'Invalid notification type' },
          { status: 400 }
        );
      }
      where.type = typeParam as NotificationType;
    }

    // Count total notifications
    const totalCount = await prisma.notification.count({ where });

    // Calculate pagination
    const skip = (page - 1) * limit;
    const totalPages = Math.ceil(totalCount / limit);

    // Fetch notifications
    const notifications = await prisma.notification.findMany({
      where,
      orderBy: {
        createdAt: 'desc', // Newest first
      },
      skip,
      take: limit,
    });

    // Get unread count
    const unreadCount = await prisma.notification.count({
      where: {
        userId: session.user.id,
        isRead: false,
      },
    });

    return NextResponse.json({
      notifications,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      unreadCount,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);

    if (error instanceof Error) {
      if (
        error.message.includes('Unauthorized') ||
        error.message.includes('Forbidden')
      ) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: 'An error occurred while fetching notifications' },
      { status: 500 }
    );
  }
}
