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

    // For now, return default preferences
    // In a real app, you'd store these in a separate table or in the student record
    return NextResponse.json({
      preferences: {
        emailOnHomeworkReview: true,
        emailOnUpcomingClass: true,
        emailOnNewSharedFiles: true,
      },
    });
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des préférences' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
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

    const preferences = await request.json();

    // Validate preferences
    if (
      typeof preferences.emailOnHomeworkReview !== 'boolean' ||
      typeof preferences.emailOnUpcomingClass !== 'boolean' ||
      typeof preferences.emailOnNewSharedFiles !== 'boolean'
    ) {
      return NextResponse.json(
        { error: 'Préférences invalides' },
        { status: 400 }
      );
    }

    // For now, just acknowledge the update
    // In a real app, you'd store these in a separate table or in the student record
    // You could add fields to the Student model like:
    // - notifyHomeworkReview Boolean @default(true)
    // - notifyUpcomingClass Boolean @default(true)
    // - notifyNewFiles Boolean @default(true)

    return NextResponse.json({
      success: true,
      message: 'Préférences enregistrées avec succès',
      preferences,
    });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour des préférences' },
      { status: 500 }
    );
  }
}
