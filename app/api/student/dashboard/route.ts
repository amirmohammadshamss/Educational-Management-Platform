import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    // Verify user is a student
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      include: { student: true },
    });

    if (!user || user.role !== 'STUDENT' || !user.student) {
      return NextResponse.json(
        { error: 'Accès refusé - Étudiant uniquement' },
        { status: 403 }
      );
    }

    const studentId = user.student.id;

    // Fetch hours summary
    const hoursSummary = {
      totalAllowedHours: user.student.totalAllowedHours,
      usedHours: user.student.usedHours,
      remainingHours: user.student.totalAllowedHours - user.student.usedHours,
    };

    // Fetch upcoming bookings (next 5)
    const upcomingBookings = await prisma.booking.findMany({
      where: {
        studentId,
        date: {
          gte: new Date(),
        },
        status: {
          in: ['CONFIRMED', 'PENDING'],
        },
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
        date: 'asc',
      },
      take: 5,
    });

    // Fetch homework statistics
    const homeworkStats = await prisma.homework.groupBy({
      by: ['status'],
      where: {
        studentId,
      },
      _count: {
        status: true,
      },
    });

    const pendingCount = homeworkStats.find(s => s.status === 'PENDING')?._count.status || 0;
    const approvedCount = homeworkStats.find(s => s.status === 'APPROVED')?._count.status || 0;
    const rejectedCount = homeworkStats.find(s => s.status === 'REJECTED')?._count.status || 0;
    const needsRevisionCount = homeworkStats.find(s => s.status === 'NEEDS_REVISION')?._count.status || 0;

    // Fetch recent feedback (last 3 reviewed homework)
    const recentFeedback = await prisma.homework.findMany({
      where: {
        studentId,
        status: {
          in: ['APPROVED', 'REJECTED', 'NEEDS_REVISION'],
        },
        feedback: {
          not: null,
        },
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
        reviewedAt: 'desc',
      },
      take: 3,
    });

    return NextResponse.json({
      studentName: user.name,
      hoursSummary,
      upcomingBookings: upcomingBookings.map(booking => ({
        id: booking.id,
        date: booking.date,
        duration: booking.duration,
        teacherName: booking.teacher.user.name,
        status: booking.status,
      })),
      homeworkStats: {
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        needsRevision: needsRevisionCount,
        reviewed: approvedCount + rejectedCount + needsRevisionCount,
      },
      recentFeedback: recentFeedback.map(hw => ({
        id: hw.id,
        teacherName: hw.teacher.user.name,
        status: hw.status,
        feedback: hw.feedback,
        reviewedAt: hw.reviewedAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching student dashboard:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des données du tableau de bord' },
      { status: 500 }
    );
  }
}
