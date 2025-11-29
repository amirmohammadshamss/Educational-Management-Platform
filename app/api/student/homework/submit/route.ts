import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { put } from '@vercel/blob';

export async function POST(request: NextRequest) {
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

    // Parse form data
    const formData = await request.formData();
    const teacherId = formData.get('teacherId') as string;
    const file = formData.get('file') as File;

    // Validation
    if (!teacherId || !file) {
      return NextResponse.json(
        { error: 'Tous les champs obligatoires doivent être remplis' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/jpg',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Type de fichier non autorisé' },
        { status: 400 }
      );
    }

    // Validate file size (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Fichier trop volumineux (max 10 MB)' },
        { status: 400 }
      );
    }

    // Verify teacher exists and is assigned to student
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
      include: {
        students: {
          where: { id: studentId },
        },
      },
    });

    if (!teacher) {
      return NextResponse.json(
        { error: 'Professeur non trouvé' },
        { status: 404 }
      );
    }

    if (teacher.students.length === 0) {
      return NextResponse.json(
        { error: 'Ce professeur ne vous est pas assigné' },
        { status: 403 }
      );
    }

    // Upload file to Vercel Blob
    const blob = await put(file.name, file, {
      access: 'public',
      addRandomSuffix: true,
    });

    // Create homework record
    const homework = await prisma.homework.create({
      data: {
        studentId,
        teacherId,
        fileUrl: blob.url,
        fileName: file.name,
        fileSize: file.size,
        status: 'PENDING',
        submittedAt: new Date(),
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
    });

    return NextResponse.json({
      success: true,
      homework: {
        id: homework.id,
        fileName: homework.fileName,
        status: homework.status,
        submittedAt: homework.submittedAt,
      },
    });
  } catch (error) {
    console.error('Error submitting homework:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la soumission du devoir' },
      { status: 500 }
    );
  }
}
