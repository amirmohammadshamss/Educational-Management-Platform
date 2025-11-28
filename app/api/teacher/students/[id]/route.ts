/**
 * Teacher Student Detail API Route
 *
 * Provides detailed information about a specific student
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { isTeacher } from '@/lib/rbac';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/teacher/students/[id]
 * Fetch detailed information about a specific student
 *
 * @param params - Route parameters containing student ID
 * @returns Detailed student information
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require authentication
    const session = await requireAuth();

    // Verify user is a teacher
    if (!isTeacher(session.user.role) && session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Teacher access only' },
        { status: 403 }
      );
    }

    // Get teacher ID from session
    const teacherId = session.user.teacherId;

    if (!teacherId) {
      return NextResponse.json(
        { error: 'Teacher profile not found' },
        { status: 404 }
      );
    }

    const studentId = params.id;

    // Fetch student with all related data
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            active: true,
            createdAt: true,
          },
        },
        teachers: {
          where: {
            teacherId,
          },
          select: {
            assignedAt: true,
          },
        },
        bookings: {
          where: {
            teacherId,
          },
          include: {
            teacher: {
              include: {
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: {
            date: 'desc',
          },
        },
        homeworkSubmitted: {
          where: {
            teacherId,
          },
          orderBy: {
            submittedAt: 'desc',
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Check if student is assigned to this teacher
    const isAssigned = student.teachers.length > 0;

    // Calculate statistics
    const totalBookings = student.bookings.length;
    const completedBookings = student.bookings.filter(
      (b) => b.status === 'COMPLETED'
    ).length;
    const upcomingBookings = student.bookings.filter(
      (b) => b.status === 'SCHEDULED' && new Date(b.date) > new Date()
    ).length;
    const cancelledBookings = student.bookings.filter(
      (b) => b.status === 'CANCELLED'
    ).length;
    const noShowBookings = student.bookings.filter(
      (b) => b.status === 'NO_SHOW'
    ).length;

    const totalHomework = student.homeworkSubmitted.length;
    const pendingHomework = student.homeworkSubmitted.filter(
      (h) => h.status === 'PENDING'
    ).length;
    const approvedHomework = student.homeworkSubmitted.filter(
      (h) => h.status === 'APPROVED'
    ).length;
    const rejectedHomework = student.homeworkSubmitted.filter(
      (h) => h.status === 'REJECTED'
    ).length;
    const needsRevisionHomework = student.homeworkSubmitted.filter(
      (h) => h.status === 'NEEDS_REVISION'
    ).length;

    // Format the data
    const formattedStudent = {
      id: student.id,
      userId: student.user.id,
      name: student.user.name,
      email: student.user.email,
      active: student.user.active,
      governmentId: student.governmentId,
      createdAt: student.user.createdAt.toISOString(),
      totalAllowedHours: student.totalAllowedHours,
      usedHours: student.usedHours,
      remainingHours: student.totalAllowedHours - student.usedHours,
      isAssigned,
      assignedAt: student.teachers[0]?.assignedAt.toISOString(),
      statistics: {
        bookings: {
          total: totalBookings,
          completed: completedBookings,
          upcoming: upcomingBookings,
          cancelled: cancelledBookings,
          noShow: noShowBookings,
        },
        homework: {
          total: totalHomework,
          pending: pendingHomework,
          approved: approvedHomework,
          rejected: rejectedHomework,
          needsRevision: needsRevisionHomework,
        },
      },
      bookings: student.bookings.map((booking) => ({
        id: booking.id,
        date: booking.date.toISOString(),
        duration: booking.duration,
        status: booking.status,
        source: booking.source,
        createdAt: booking.createdAt.toISOString(),
      })),
      homework: student.homeworkSubmitted.map((hw) => ({
        id: hw.id,
        fileName: hw.fileName,
        fileUrl: hw.fileUrl,
        fileSize: hw.fileSize,
        status: hw.status,
        feedback: hw.feedback,
        submittedAt: hw.submittedAt.toISOString(),
        reviewedAt: hw.reviewedAt?.toISOString(),
      })),
    };

    return NextResponse.json({
      success: true,
      data: formattedStudent,
    });
  } catch (error) {
    console.error('Error fetching student details:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch student details',
        message:
          error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
