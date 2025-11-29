import { sendEmail } from './mailer';
import {
  welcomeEmail,
  passwordResetEmail,
  homeworkReviewedEmail,
  classReminderEmail,
  lowHoursWarningEmail,
  assignmentNotificationEmail,
  type EmailTemplate,
} from './templates';
import { prisma } from '@/lib/prisma';

/**
 * Notification types supported by the system
 */
export enum NotificationType {
  WELCOME = 'WELCOME',
  PASSWORD_RESET = 'PASSWORD_RESET',
  HOMEWORK_REVIEWED = 'HOMEWORK_REVIEWED',
  CLASS_REMINDER = 'CLASS_REMINDER',
  LOW_HOURS_WARNING = 'LOW_HOURS_WARNING',
  ASSIGNMENT_NOTIFICATION = 'ASSIGNMENT_NOTIFICATION',
}

/**
 * Email log entry for tracking sent emails
 */
interface EmailLog {
  to: string;
  subject: string;
  type: NotificationType;
  success: boolean;
  error?: string;
  messageId?: string;
  timestamp: Date;
}

/**
 * Store email log in database or file
 * Note: In production, consider using a dedicated logging service or database table
 */
async function logEmail(log: EmailLog): Promise<void> {
  try {
    // Log to console for now
    console.log('Email Log:', {
      ...log,
      timestamp: log.timestamp.toISOString(),
    });

    // TODO: Implement database logging when EmailLog table is added to schema
    // await prisma.emailLog.create({ data: log });
  } catch (error) {
    console.error('Failed to log email:', error);
  }
}

/**
 * Check if user has email notifications enabled
 * Note: Returns true by default until notification preferences are implemented
 */
async function canSendEmail(userId: string, notificationType: NotificationType): Promise<boolean> {
  try {
    // TODO: Check user notification preferences when preferences table is added
    // const preferences = await prisma.userNotificationPreferences.findUnique({
    //   where: { userId },
    // });
    // return preferences?.[notificationType] ?? true;

    // For now, check if user is active
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { active: true },
    });

    return user?.active ?? false;
  } catch (error) {
    console.error('Error checking email permissions:', error);
    return false;
  }
}

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(
  userId: string,
  email: string,
  userName: string,
  userRole: string
): Promise<boolean> {
  const canSend = await canSendEmail(userId, NotificationType.WELCOME);
  if (!canSend) {
    console.log(`Email notifications disabled for user ${userId}`);
    return false;
  }

  const template = welcomeEmail(userName, userRole);
  const result = await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });

  await logEmail({
    to: email,
    subject: template.subject,
    type: NotificationType.WELCOME,
    success: result.success,
    error: result.error,
    messageId: result.messageId,
    timestamp: new Date(),
  });

  return result.success;
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  userId: string,
  email: string,
  userName: string,
  resetLink: string
): Promise<boolean> {
  const canSend = await canSendEmail(userId, NotificationType.PASSWORD_RESET);
  if (!canSend) {
    console.log(`Email notifications disabled for user ${userId}`);
    return false;
  }

  const template = passwordResetEmail(userName, resetLink);
  const result = await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });

  await logEmail({
    to: email,
    subject: template.subject,
    type: NotificationType.PASSWORD_RESET,
    success: result.success,
    error: result.error,
    messageId: result.messageId,
    timestamp: new Date(),
  });

  return result.success;
}

/**
 * Send homework reviewed notification to student
 */
export async function sendHomeworkReviewedEmail(
  studentId: string,
  studentEmail: string,
  studentName: string,
  teacherName: string,
  status: string,
  feedback?: string
): Promise<boolean> {
  const canSend = await canSendEmail(studentId, NotificationType.HOMEWORK_REVIEWED);
  if (!canSend) {
    console.log(`Email notifications disabled for user ${studentId}`);
    return false;
  }

  const template = homeworkReviewedEmail(studentName, teacherName, status, feedback);
  const result = await sendEmail({
    to: studentEmail,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });

  await logEmail({
    to: studentEmail,
    subject: template.subject,
    type: NotificationType.HOMEWORK_REVIEWED,
    success: result.success,
    error: result.error,
    messageId: result.messageId,
    timestamp: new Date(),
  });

  return result.success;
}

/**
 * Send class reminder to student
 */
export async function sendClassReminderEmail(
  studentId: string,
  studentEmail: string,
  studentName: string,
  teacherName: string,
  date: string,
  time: string
): Promise<boolean> {
  const canSend = await canSendEmail(studentId, NotificationType.CLASS_REMINDER);
  if (!canSend) {
    console.log(`Email notifications disabled for user ${studentId}`);
    return false;
  }

  const template = classReminderEmail(studentName, teacherName, date, time);
  const result = await sendEmail({
    to: studentEmail,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });

  await logEmail({
    to: studentEmail,
    subject: template.subject,
    type: NotificationType.CLASS_REMINDER,
    success: result.success,
    error: result.error,
    messageId: result.messageId,
    timestamp: new Date(),
  });

  return result.success;
}

/**
 * Send low hours warning to student
 */
export async function sendLowHoursWarningEmail(
  studentId: string,
  studentEmail: string,
  studentName: string,
  remainingHours: number
): Promise<boolean> {
  const canSend = await canSendEmail(studentId, NotificationType.LOW_HOURS_WARNING);
  if (!canSend) {
    console.log(`Email notifications disabled for user ${studentId}`);
    return false;
  }

  const template = lowHoursWarningEmail(studentName, remainingHours);
  const result = await sendEmail({
    to: studentEmail,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });

  await logEmail({
    to: studentEmail,
    subject: template.subject,
    type: NotificationType.LOW_HOURS_WARNING,
    success: result.success,
    error: result.error,
    messageId: result.messageId,
    timestamp: new Date(),
  });

  return result.success;
}

/**
 * Send assignment notification to student
 */
export async function sendAssignmentNotificationEmail(
  studentId: string,
  studentEmail: string,
  studentName: string,
  teacherName: string
): Promise<boolean> {
  const canSend = await canSendEmail(studentId, NotificationType.ASSIGNMENT_NOTIFICATION);
  if (!canSend) {
    console.log(`Email notifications disabled for user ${studentId}`);
    return false;
  }

  const template = assignmentNotificationEmail(studentName, teacherName);
  const result = await sendEmail({
    to: studentEmail,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });

  await logEmail({
    to: studentEmail,
    subject: template.subject,
    type: NotificationType.ASSIGNMENT_NOTIFICATION,
    success: result.success,
    error: result.error,
    messageId: result.messageId,
    timestamp: new Date(),
  });

  return result.success;
}

/**
 * Send custom email (for advanced use cases)
 */
export async function sendCustomEmail(
  userId: string,
  email: string,
  subject: string,
  html: string,
  text: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { active: true },
  });

  if (!user?.active) {
    console.log(`User ${userId} is inactive`);
    return false;
  }

  const result = await sendEmail({
    to: email,
    subject,
    html,
    text,
  });

  await logEmail({
    to: email,
    subject,
    type: NotificationType.WELCOME, // Default type for custom emails
    success: result.success,
    error: result.error,
    messageId: result.messageId,
    timestamp: new Date(),
  });

  return result.success;
}
