/**
 * Sync Logs API Route
 *
 * GET /api/sync-logs - Get sync logs with filtering and pagination
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { isAdmin } from '@/lib/rbac';
import { syncLogQuerySchema } from '@/lib/validations/sync-log';
import { ZodError } from 'zod';

/**
 * GET /api/sync-logs
 *
 * Get sync logs with filtering and pagination
 * - Admin only access
 * - Filter by source, status, date range
 * - Paginated results
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication - Admin only
    const session = await requireAuth();

    if (!isAdmin(session.user.role)) {
      return NextResponse.json(
        { error: 'Only administrators can view sync logs' },
        { status: 403 }
      );
    }

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
      source: searchParams.get('source') || undefined,
      status: searchParams.get('status') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
    };

    const validatedQuery = syncLogQuerySchema.parse(queryParams);

    // Build where clause
    const where: any = {};

    if (validatedQuery.source) {
      where.source = validatedQuery.source;
    }

    if (validatedQuery.status) {
      where.status = validatedQuery.status;
    }

    // Date range filter
    if (validatedQuery.startDate || validatedQuery.endDate) {
      where.createdAt = {};
      if (validatedQuery.startDate) {
        where.createdAt.gte = new Date(validatedQuery.startDate);
      }
      if (validatedQuery.endDate) {
        where.createdAt.lte = new Date(validatedQuery.endDate);
      }
    }

    // Count total logs for pagination
    const totalCount = await prisma.syncLog.count({ where });

    // Calculate pagination
    const page = validatedQuery.page;
    const limit = validatedQuery.limit;
    const skip = (page - 1) * limit;
    const totalPages = Math.ceil(totalCount / limit);

    // Fetch sync logs
    const logs = await prisma.syncLog.findMany({
      where,
      orderBy: {
        createdAt: 'desc', // Most recent first
      },
      skip,
      take: limit,
    });

    return NextResponse.json({
      logs,
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
    console.error('Error fetching sync logs:', error);

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
      { error: 'An error occurred while fetching sync logs' },
      { status: 500 }
    );
  }
}
