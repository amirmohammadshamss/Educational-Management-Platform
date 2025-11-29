import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { Prisma, BookingStatus } from '@prisma/client';

interface DayStats {
  count: number;
  hours: number;
}

interface TeacherBreakdown {
  sessions: number;
  hours: number;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { type: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (!session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const teacherId = searchParams.get('teacherId');
    const studentId = searchParams.get('studentId');
    const status = searchParams.get('status');

    const { type } = params;

    switch (type) {
      case 'bookings':
        return await generateBookingsReport(startDate, endDate, teacherId, studentId, status);

      case 'hours':
        return await generateHoursReport(startDate, endDate, studentId);

      case 'teacher-performance':
        return await generateTeacherPerformanceReport(startDate, endDate, teacherId);

      case 'student-progress':
        return await generateStudentProgressReport(startDate, endDate, studentId);

      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}

async function generateBookingsReport(
  startDate: string | null,
  endDate: string | null,
  teacherId: string | null,
  studentId: string | null,
  status: string | null
) {
  const whereClause: Prisma.BookingWhereInput = {};

  if (startDate && endDate) {
    whereClause.date = {
      gte: new Date(startDate),
      lte: new Date(endDate),
    };
  }

  if (teacherId) {
    whereClause.teacherId = teacherId;
  }

  if (studentId) {
    whereClause.studentId = studentId;
  }

  if (status) {
    whereClause.status = status as BookingStatus;
  }

  const bookings = await prisma.booking.findMany({
    where: whereClause,
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
      student: {
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
    orderBy: {
      date: 'desc',
    },
  });

  // Calculate statistics
  const totalSessions = bookings.length;
  const totalHours = bookings.reduce((sum, b) => sum + b.duration, 0);

  // Group by day
  const byDay = bookings.reduce((acc: Record<string, DayStats>, booking) => {
    const date = booking.date.toISOString().split('T')[0];
    if (!acc[date]) {
      acc[date] = { count: 0, hours: 0 };
    }
    acc[date].count++;
    acc[date].hours += booking.duration;
    return acc;
  }, {} as Record<string, DayStats>);

  // Group by teacher
  const byTeacher = bookings.reduce((acc: Record<string, DayStats>, booking) => {
    const teacherName = booking.teacher.user.name || 'Unknown';
    if (!acc[teacherName]) {
      acc[teacherName] = { count: 0, hours: 0 };
    }
    acc[teacherName].count++;
    acc[teacherName].hours += booking.duration;
    return acc;
  }, {} as Record<string, DayStats>);

  // Group by student
  const byStudent = bookings.reduce((acc: Record<string, DayStats>, booking) => {
    const studentName = booking.student.user.name || 'Unknown';
    if (!acc[studentName]) {
      acc[studentName] = { count: 0, hours: 0 };
    }
    acc[studentName].count++;
    acc[studentName].hours += booking.duration;
    return acc;
  }, {} as Record<string, DayStats>);

  return NextResponse.json({
    bookings,
    statistics: {
      totalSessions,
      totalHours,
      byDay,
      byTeacher,
      byStudent,
    },
  });
}

async function generateHoursReport(
  startDate: string | null,
  endDate: string | null,
  studentId: string | null
) {
  const whereClause: Prisma.StudentWhereInput = {};

  if (studentId) {
    whereClause.id = studentId;
  }

  const students = await prisma.student.findMany({
    where: whereClause,
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      bookings: {
        where: startDate && endDate ? {
          date: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        } : undefined,
        select: {
          duration: true,
          date: true,
        },
      },
    },
  });

  const report = students.map(student => {
    const usedHours = student.bookings.reduce((sum, b) => sum + b.duration, 0);
    const totalAllowed = student.totalAllowedHours;
    const remaining = totalAllowed - usedHours;
    const percentage = totalAllowed > 0 ? (usedHours / totalAllowed) * 100 : 0;
    const isLow = remaining < totalAllowed * 0.2; // Less than 20% remaining

    return {
      id: student.id,
      name: student.user.name,
      email: student.user.email,
      governmentId: student.governmentId,
      totalAllowed,
      used: usedHours,
      remaining,
      percentage: Math.round(percentage * 100) / 100,
      isLow,
      sessionsCount: student.bookings.length,
    };
  });

  return NextResponse.json({
    students: report,
    summary: {
      totalStudents: report.length,
      lowHoursCount: report.filter(s => s.isLow).length,
      totalHoursAllocated: report.reduce((sum, s) => sum + s.totalAllowed, 0),
      totalHoursUsed: report.reduce((sum, s) => sum + s.used, 0),
    },
  });
}

async function generateTeacherPerformanceReport(
  startDate: string | null,
  endDate: string | null,
  teacherId: string | null
) {
  const whereClause: Prisma.TeacherWhereInput = {};

  if (teacherId) {
    whereClause.id = teacherId;
  }

  const teachers = await prisma.teacher.findMany({
    where: whereClause,
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      bookings: {
        where: startDate && endDate ? {
          date: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        } : undefined,
        select: {
          duration: true,
          date: true,
          studentId: true,
        },
      },
      homeworkAssigned: {
        where: startDate && endDate ? {
          submittedAt: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        } : undefined,
        select: {
          status: true,
          submittedAt: true,
          reviewedAt: true,
        },
      },
    },
  });

  const report = teachers.map(teacher => {
    const totalSessions = teacher.bookings.length;
    const totalHours = teacher.bookings.reduce((sum: number, b) => sum + b.duration, 0);
    const uniqueStudents = new Set(teacher.bookings.map(b => b.studentId)).size;

    const homeworkStats = {
      total: teacher.homeworkAssigned.length,
      reviewed: teacher.homeworkAssigned.filter(h => h.reviewedAt).length,
      pending: teacher.homeworkAssigned.filter(h => !h.reviewedAt).length,
      approved: teacher.homeworkAssigned.filter(h => h.status === 'APPROVED').length,
      rejected: teacher.homeworkAssigned.filter(h => h.status === 'REJECTED').length,
    };

    // Calculate average feedback response time (in hours)
    const reviewedHomework = teacher.homeworkAssigned.filter(h => h.reviewedAt && h.submittedAt);
    const avgResponseTime = reviewedHomework.length > 0
      ? reviewedHomework.reduce((sum: number, h) => {
          const diff = h.reviewedAt!.getTime() - h.submittedAt.getTime();
          return sum + diff / (1000 * 60 * 60); // Convert to hours
        }, 0) / reviewedHomework.length
      : 0;

    return {
      id: teacher.id,
      name: teacher.user.name,
      email: teacher.user.email,
      subject: null, // Subject field doesn't exist in schema yet
      totalSessions,
      totalHours,
      uniqueStudents,
      homeworkStats,
      avgResponseTimeHours: Math.round(avgResponseTime * 100) / 100,
    };
  });

  return NextResponse.json({
    teachers: report,
    summary: {
      totalTeachers: report.length,
      totalSessions: report.reduce((sum, t) => sum + t.totalSessions, 0),
      totalHours: report.reduce((sum, t) => sum + t.totalHours, 0),
      totalHomeworkReviewed: report.reduce((sum, t) => sum + t.homeworkStats.reviewed, 0),
    },
  });
}

async function generateStudentProgressReport(
  startDate: string | null,
  endDate: string | null,
  studentId: string | null
) {
  const whereClause: Prisma.StudentWhereInput = {};

  if (studentId) {
    whereClause.id = studentId;
  }

  const students = await prisma.student.findMany({
    where: whereClause,
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      bookings: {
        where: startDate && endDate ? {
          date: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        } : undefined,
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
      },
      homeworkSubmitted: {
        where: startDate && endDate ? {
          submittedAt: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        } : undefined,
        select: {
          status: true,
          submittedAt: true,
          reviewedAt: true,
        },
      },
    },
  });

  const report = students.map(student => {
    const totalSessions = student.bookings.length;
    const totalHours = student.bookings.reduce((sum: number, b) => sum + b.duration, 0);

    const teacherBreakdown = student.bookings.reduce((acc: Record<string, TeacherBreakdown>, booking) => {
      const teacherName = booking.teacher.user.name || 'Unknown';
      if (!acc[teacherName]) {
        acc[teacherName] = { sessions: 0, hours: 0 };
      }
      acc[teacherName].sessions++;
      acc[teacherName].hours += booking.duration;
      return acc;
    }, {} as Record<string, TeacherBreakdown>);

    const homeworkStats = {
      total: student.homeworkSubmitted.length,
      approved: student.homeworkSubmitted.filter(h => h.status === 'APPROVED').length,
      rejected: student.homeworkSubmitted.filter(h => h.status === 'REJECTED').length,
      pending: student.homeworkSubmitted.filter(h => h.status === 'PENDING').length,
      needsRevision: student.homeworkSubmitted.filter(h => h.status === 'NEEDS_REVISION').length,
    };

    const usedHours = student.usedHours;
    const totalAllowed = student.totalAllowedHours;
    const remaining = totalAllowed - usedHours;
    const percentage = totalAllowed > 0 ? (usedHours / totalAllowed) * 100 : 0;

    return {
      id: student.id,
      name: student.user.name,
      email: student.user.email,
      governmentId: student.governmentId,
      totalSessions,
      totalHours,
      teacherBreakdown,
      homeworkStats,
      hoursUtilization: {
        totalAllowed,
        used: usedHours,
        remaining,
        percentage: Math.round(percentage * 100) / 100,
      },
    };
  });

  return NextResponse.json({
    students: report,
    summary: {
      totalStudents: report.length,
      totalSessions: report.reduce((sum, s) => sum + s.totalSessions, 0),
      totalHomeworkSubmitted: report.reduce((sum, s) => sum + s.homeworkStats.total, 0),
    },
  });
}
