/**
 * Mark Notification as Read API Route
 *
 * PATCH /api/notifications/[id]/read - Mark a specific notification as read
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { markAsRead } from '@/lib/notifications/create-notification';

/**
 * PATCH /api/notifications/[id]/read
 *
 * Mark a notification as read
 * User can only mark their own notifications
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require authentication
    const session = await requireAuth();

    const notificationId = params.id;

    if (!notificationId) {
      return NextResponse.json(
        { error: 'Notification ID is required' },
        { status: 400 }
      );
    }

    // Mark notification as read (function ensures user owns the notification)
    await markAsRead(notificationId, session.user.id);

    return NextResponse.json({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);

    if (error instanceof Error) {
      if (
        error.message.includes('Unauthorized') ||
        error.message.includes('Forbidden')
      ) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: 'An error occurred while marking notification as read' },
      { status: 500 }
    );
  }
}
