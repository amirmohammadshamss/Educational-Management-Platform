import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

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

    // Fetch all homework for this student
    const homeworks = await prisma.homework.findMany({
      where: {
        studentId,
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
        submittedAt: 'desc',
      },
    });

    return NextResponse.json({
      homeworks: homeworks.map((hw) => ({
        id: hw.id,
        fileUrl: hw.fileUrl,
        fileName: hw.fileName,
        fileSize: hw.fileSize,
        status: hw.status,
        feedback: hw.feedback,
        submittedAt: hw.submittedAt,
        reviewedAt: hw.reviewedAt,
        teacher: {
          user: {
            name: hw.teacher.user.name,
          },
        },
      })),
    });
  } catch (error) {
    console.error('Error fetching student homework:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des devoirs' },
      { status: 500 }
    );
  }
}
