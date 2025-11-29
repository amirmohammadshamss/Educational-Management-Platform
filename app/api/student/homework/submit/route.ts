import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { put } from '@vercel/blob';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    console.log('[HOMEWORK SUBMIT] Session:', session ? 'exists' : 'null');
    console.log('[HOMEWORK SUBMIT] User:', session?.user);

    if (!session || !session.user) {
      console.log('[HOMEWORK SUBMIT] No session - returning 401');
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

    console.log('[HOMEWORK SUBMIT] User from DB:', user?.email, 'Role:', user?.role);
    console.log('[HOMEWORK SUBMIT] Student ID:', user?.student?.id);

    if (!user || user.role !== 'STUDENT' || !user.student) {
      console.log('[HOMEWORK SUBMIT] User validation failed - returning 403');
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
    });

    if (!teacher) {
      return NextResponse.json(
        { error: 'Professeur non trouvé' },
        { status: 404 }
      );
    }

    // Check if teacher is assigned to this student
    const assignment = await prisma.studentTeacher.findFirst({
      where: {
        studentId,
        teacherId,
      },
    });

    console.log('[HOMEWORK SUBMIT] Assignment check:', {
      studentId,
      teacherId,
      assignmentExists: !!assignment,
    });

    if (!assignment) {
      console.log('[HOMEWORK SUBMIT] Teacher not assigned - returning 403');
      return NextResponse.json(
        { error: 'Ce professeur ne vous est pas assigné' },
        { status: 403 }
      );
    }

    // Upload file to Vercel Blob or local storage
    let fileUrl: string;

    if (process.env.BLOB_READ_WRITE_TOKEN && !process.env.BLOB_READ_WRITE_TOKEN.includes('xxxxxxxxxx')) {
      // Use Vercel Blob in production
      const blob = await put(file.name, file, {
        access: 'public',
        addRandomSuffix: true,
      });
      fileUrl = blob.url;
    } else {
      // Use local storage for development
      console.log('[HOMEWORK SUBMIT] Using local file storage (Vercel Blob not configured)');
      const fs = await import('fs/promises');
      const path = await import('path');

      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'homework');
      await fs.mkdir(uploadsDir, { recursive: true });

      // Generate unique filename
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const fileExtension = file.name.split('.').pop();
      const uniqueFileName = `${timestamp}-${randomSuffix}.${fileExtension}`;
      const filePath = path.join(uploadsDir, uniqueFileName);

      // Save file
      const buffer = Buffer.from(await file.arrayBuffer());
      await fs.writeFile(filePath, buffer);

      fileUrl = `/uploads/homework/${uniqueFileName}`;
    }

    // Create homework record
    const homework = await prisma.homework.create({
      data: {
        studentId,
        teacherId,
        fileUrl: fileUrl,
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
    console.error('[HOMEWORK SUBMIT] ERROR caught:', error);
    console.error('[HOMEWORK SUBMIT] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error: error,
    });
    return NextResponse.json(
      {
        error: 'Erreur lors de la soumission du devoir',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
