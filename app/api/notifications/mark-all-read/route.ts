/**
 * Mark All Notifications as Read API Route
 *
 * PATCH /api/notifications/mark-all-read - Mark all user's notifications as read
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { markAllAsRead } from '@/lib/notifications/create-notification';

/**
 * PATCH /api/notifications/mark-all-read
 *
 * Mark all notifications as read for the authenticated user
 */
export async function PATCH(request: NextRequest) {
  try {
    // Require authentication
    const session = await requireAuth();

    // Mark all notifications as read
    const count = await markAllAsRead(session.user.id);

    return NextResponse.json({
      success: true,
      message: `${count} notification(s) marked as read`,
      count,
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);

    if (error instanceof Error) {
      if (
        error.message.includes('Unauthorized') ||
        error.message.includes('Forbidden')
      ) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: 'An error occurred while marking notifications as read' },
      { status: 500 }
    );
  }
}
