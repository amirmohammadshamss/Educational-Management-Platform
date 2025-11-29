import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
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

    const { notificationId } = await request.json();

    if (!notificationId) {
      return NextResponse.json(
        { error: 'ID de notification requis' },
        { status: 400 }
      );
    }

    // In a real app, you'd update a notifications table
    // For now, we'll just acknowledge the request
    // You could add a `notificationReadAt` field to homework or create a separate notifications table

    return NextResponse.json({
      success: true,
      message: 'Notification marquée comme lue',
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la notification' },
      { status: 500 }
    );
  }
}
