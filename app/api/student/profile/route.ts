import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { put } from '@vercel/blob';

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
      include: {
        student: {
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
        },
      },
    });

    if (!user || user.role !== 'STUDENT' || !user.student) {
      return NextResponse.json(
        { error: 'Accès refusé - Étudiant uniquement' },
        { status: 403 }
      );
    }

    const studentId = user.student.id;

    // Get statistics
    const totalBookings = await prisma.booking.count({
      where: { studentId },
    });

    const completedBookings = await prisma.booking.count({
      where: {
        studentId,
        status: 'COMPLETED',
      },
    });

    const upcomingBookings = await prisma.booking.count({
      where: {
        studentId,
        status: 'SCHEDULED',
        date: {
          gte: new Date(),
        },
      },
    });

    const homeworkSubmitted = await prisma.homework.count({
      where: { studentId },
    });

    const homeworkApproved = await prisma.homework.count({
      where: {
        studentId,
        status: 'APPROVED',
      },
    });

    const homeworkPending = await prisma.homework.count({
      where: {
        studentId,
        status: 'PENDING',
      },
    });

    return NextResponse.json({
      user: {
        name: user.name || user.email,
        email: user.email,
        role: user.role,
      },
      student: {
        governmentId: user.student.governmentId,
        totalAllowedHours: user.student.totalAllowedHours,
        usedHours: user.student.usedHours,
      },
      statistics: {
        totalBookings,
        completedBookings,
        upcomingBookings,
        homeworkSubmitted,
        homeworkApproved,
        homeworkPending,
      },
      assignedTeachers: user.student.teachers.map((st) => ({
        id: st.teacher.id,
        user: {
          name: st.teacher.user.name || st.teacher.user.email,
          email: st.teacher.user.email,
        },
      })),
    });
  } catch (error) {
    console.error('Error fetching student profile:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du profil' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
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

    // Parse form data
    const formData = await request.formData();
    const name = formData.get('name') as string;

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: name?.trim() || null,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        name: updatedUser.name || updatedUser.email,
        email: updatedUser.email,
      },
    });
  } catch (error) {
    console.error('Error updating student profile:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du profil' },
      { status: 500 }
    );
  }
}
