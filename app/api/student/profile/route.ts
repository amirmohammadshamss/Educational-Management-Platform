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
        status: {
          in: ['CONFIRMED', 'PENDING'],
        },
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
        name: user.name,
        email: user.email,
        phone: user.phone,
        profilePhoto: user.profilePhoto,
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
      assignedTeachers: user.student.teachers.map((teacher) => ({
        id: teacher.id,
        user: {
          name: teacher.user.name,
          email: teacher.user.email,
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
    const phone = formData.get('phone') as string;
    const photo = formData.get('photo') as File | null;
    const removePhoto = formData.get('removePhoto') === 'true';

    // Validation
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Le nom est requis' },
        { status: 400 }
      );
    }

    let profilePhotoUrl = user.profilePhoto;

    // Handle photo upload
    if (photo) {
      // Validate file type
      if (!photo.type.startsWith('image/')) {
        return NextResponse.json(
          { error: 'Type de fichier invalide' },
          { status: 400 }
        );
      }

      // Validate file size (2MB)
      if (photo.size > 2 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'Fichier trop volumineux (max 2 MB)' },
          { status: 400 }
        );
      }

      // Upload to Vercel Blob
      const blob = await put(`profile-photos/${user.id}-${Date.now()}.${photo.type.split('/')[1]}`, photo, {
        access: 'public',
      });

      profilePhotoUrl = blob.url;
    } else if (removePhoto) {
      profilePhotoUrl = null;
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: name.trim(),
        phone: phone.trim() || null,
        profilePhoto: profilePhotoUrl,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        name: updatedUser.name,
        phone: updatedUser.phone,
        profilePhoto: updatedUser.profilePhoto,
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
