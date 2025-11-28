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

    // Fetch recently reviewed homework (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentlyReviewed = await prisma.homework.findMany({
      where: {
        studentId,
        status: {
          in: ['APPROVED', 'REJECTED', 'NEEDS_REVISION'],
        },
        reviewedAt: {
          gte: thirtyDaysAgo,
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
      take: 20,
    });

    // In a real app, you'd track read status separately in a notifications table
    // For now, we'll mark homework as "unread" if reviewed in last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return NextResponse.json({
      notifications: recentlyReviewed.map((hw) => ({
        id: hw.id,
        homeworkId: hw.id,
        title: hw.title,
        status: hw.status,
        teacherName: hw.teacher.user.name,
        reviewedAt: hw.reviewedAt,
        isRead: hw.reviewedAt ? new Date(hw.reviewedAt) < sevenDaysAgo : true,
      })),
    });
  } catch (error) {
    console.error('Error fetching homework notifications:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des notifications' },
      { status: 500 }
    );
  }
}
