import { prisma } from '@/lib/prisma';
import { NotificationType } from '@prisma/client';
import {
  sendHomeworkReviewedEmail,
  sendClassReminderEmail,
  sendLowHoursWarningEmail,
  sendAssignmentNotificationEmail,
} from '@/lib/email';

/**
 * Parameters for creating a notification
 */
export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  sendEmail?: boolean; // Whether to also send an email notification
}

/**
 * Create a notification in the database
 * Optionally sends an email based on notification type and user preferences
 */
export async function createNotification(params: CreateNotificationParams): Promise<void> {
  const { userId, type, title, message, link, sendEmail = true } = params;

  try {
    // Create notification in database
    await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        link,
      },
    });

    console.log(`Notification created for user ${userId}: ${title}`);

    // Send email if enabled
    if (sendEmail) {
      await sendNotificationEmail(userId, type, message);
    }
  } catch (error) {
    console.error('Failed to create notification:', error);
    throw error;
  }
}

/**
 * Send email notification based on type
 */
async function sendNotificationEmail(
  userId: string,
  type: NotificationType,
  message: string
): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    if (!user) {
      console.error(`User ${userId} not found for email notification`);
      return;
    }

    // Email sending is handled by specific notification functions
    // This function is a placeholder for custom notification types
    console.log(`Email notification queued for ${user.email}: ${type}`);
  } catch (error) {
    console.error('Failed to send notification email:', error);
  }
}

/**
 * Notify student when homework is reviewed
 */
export async function notifyHomeworkReviewed(
  studentId: string,
  teacherName: string,
  status: string,
  feedback?: string
): Promise<void> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { user: true },
  });

  if (!student) {
    throw new Error(`Student ${studentId} not found`);
  }

  const statusLabels: Record<string, string> = {
    APPROVED: 'approuvé',
    REJECTED: 'rejeté',
    NEEDS_REVISION: 'à réviser',
  };

  const statusLabel = statusLabels[status] || status;

  await createNotification({
    userId: student.userId,
    type: NotificationType.HOMEWORK_REVIEWED,
    title: 'Devoir évalué',
    message: `${teacherName} a évalué votre devoir (${statusLabel})${feedback ? ': ' + feedback : ''}`,
    link: '/student/homework',
  });

  // Send email notification
  await sendHomeworkReviewedEmail(
    student.userId,
    student.user.email,
    student.user.name || 'Étudiant',
    teacherName,
    status,
    feedback
  );
}

/**
 * Notify teacher when homework is submitted
 */
export async function notifyHomeworkSubmitted(
  teacherId: string,
  studentName: string,
  homeworkId: string
): Promise<void> {
  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    include: { user: true },
  });

  if (!teacher) {
    throw new Error(`Teacher ${teacherId} not found`);
  }

  await createNotification({
    userId: teacher.userId,
    type: NotificationType.HOMEWORK_SUBMITTED,
    title: 'Nouveau devoir soumis',
    message: `${studentName} a soumis un nouveau devoir`,
    link: `/teacher/students?homework=${homeworkId}`,
    sendEmail: true, // Teachers should be notified by email
  });
}

/**
 * Notify student about upcoming class (24 hours before)
 */
export async function notifyClassReminder(
  studentId: string,
  teacherName: string,
  date: Date
): Promise<void> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { user: true },
  });

  if (!student) {
    throw new Error(`Student ${studentId} not found`);
  }

  const dateStr = date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const timeStr = date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  await createNotification({
    userId: student.userId,
    type: NotificationType.CLASS_REMINDER,
    title: 'Rappel de cours',
    message: `Cours avec ${teacherName} demain à ${timeStr}`,
    link: '/student/schedule',
  });

  // Send email reminder
  await sendClassReminderEmail(
    student.userId,
    student.user.email,
    student.user.name || 'Étudiant',
    teacherName,
    dateStr,
    timeStr
  );
}

/**
 * Notify student and admin when hours are running low (< 20%)
 */
export async function notifyLowHours(studentId: string): Promise<void> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { user: true },
  });

  if (!student) {
    throw new Error(`Student ${studentId} not found`);
  }

  const remainingHours = student.totalAllowedHours - student.usedHours;
  const percentageRemaining = (remainingHours / student.totalAllowedHours) * 100;

  // Only notify if less than 20% remaining
  if (percentageRemaining >= 20) {
    return;
  }

  // Notify student
  await createNotification({
    userId: student.userId,
    type: NotificationType.LOW_HOURS,
    title: 'Heures de formation restantes faibles',
    message: `Attention: Il vous reste seulement ${remainingHours.toFixed(1)} heures de formation`,
    link: '/student/schedule',
  });

  // Send email to student
  await sendLowHoursWarningEmail(
    student.userId,
    student.user.email,
    student.user.name || 'Étudiant',
    remainingHours
  );

  // Notify all admins
  const admins = await prisma.user.findMany({
    where: {
      role: { in: ['ADMIN', 'SUPER_ADMIN'] },
      active: true,
    },
  });

  for (const admin of admins) {
    await createNotification({
      userId: admin.id,
      type: NotificationType.LOW_HOURS,
      title: 'Alerte heures étudiant',
      message: `${student.user.name || 'Étudiant'} a moins de 20% d'heures restantes (${remainingHours.toFixed(1)}h)`,
      link: `/admin/students/${studentId}`,
      sendEmail: false, // Don't spam admins with emails for every student
    });
  }
}

/**
 * Notify student about new assignment
 */
export async function notifyNewAssignment(
  studentId: string,
  teacherName: string
): Promise<void> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { user: true },
  });

  if (!student) {
    throw new Error(`Student ${studentId} not found`);
  }

  await createNotification({
    userId: student.userId,
    type: NotificationType.ASSIGNMENT,
    title: 'Nouveau devoir assigné',
    message: `${teacherName} vous a assigné un nouveau devoir`,
    link: '/student/homework',
  });

  // Send email notification
  await sendAssignmentNotificationEmail(
    student.userId,
    student.user.email,
    student.user.name || 'Étudiant',
    teacherName
  );
}

/**
 * Notify teacher when a new student is assigned to them
 */
export async function notifyStudentAssigned(
  teacherId: string,
  studentName: string,
  studentId: string
): Promise<void> {
  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    include: { user: true },
  });

  if (!teacher) {
    throw new Error(`Teacher ${teacherId} not found`);
  }

  await createNotification({
    userId: teacher.userId,
    type: NotificationType.STUDENT_ASSIGNED,
    title: 'Nouvel étudiant assigné',
    message: `${studentName} a été ajouté à votre liste d'étudiants`,
    link: `/teacher/students`,
    sendEmail: true,
  });
}

/**
 * Create a system notification (for all users or specific role)
 */
export async function notifySystem(
  message: string,
  options: {
    title?: string;
    link?: string;
    role?: 'ADMIN' | 'TEACHER' | 'STUDENT' | 'SUPER_ADMIN';
    userIds?: string[];
  } = {}
): Promise<void> {
  const { title = 'Notification système', link, role, userIds } = options;

  let targetUsers: { id: string }[];

  if (userIds) {
    // Notify specific users
    targetUsers = userIds.map(id => ({ id }));
  } else if (role) {
    // Notify all users with specific role
    targetUsers = await prisma.user.findMany({
      where: { role, active: true },
      select: { id: true },
    });
  } else {
    // Notify all active users
    targetUsers = await prisma.user.findMany({
      where: { active: true },
      select: { id: true },
    });
  }

  // Create notifications for all target users
  const notifications = targetUsers.map(user =>
    prisma.notification.create({
      data: {
        userId: user.id,
        type: NotificationType.SYSTEM,
        title,
        message,
        link,
      },
    })
  );

  await Promise.all(notifications);

  console.log(`System notification sent to ${targetUsers.length} users`);
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadCount(userId: string): Promise<number> {
  return await prisma.notification.count({
    where: {
      userId,
      isRead: false,
    },
  });
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId: string, userId: string): Promise<void> {
  await prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId, // Ensure user can only mark their own notifications
    },
    data: {
      isRead: true,
    },
  });
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string): Promise<number> {
  const result = await prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });

  return result.count;
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string, userId: string): Promise<void> {
  await prisma.notification.deleteMany({
    where: {
      id: notificationId,
      userId, // Ensure user can only delete their own notifications
    },
  });
}
