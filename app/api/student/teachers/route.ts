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

    // Get student with assigned teachers
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        teachers: {
          include: {
            teacher: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Étudiant non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      teachers: student.teachers.map((st) => ({
        id: st.teacher.id,
        user: {
          name: st.teacher.user.name,
          email: st.teacher.user.email,
        },
      })),
    });
  } catch (error) {
    console.error('Error fetching student teachers:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des professeurs' },
      { status: 500 }
    );
  }
}
