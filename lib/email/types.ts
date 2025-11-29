/**
 * Email Service Type Definitions
 * Centralized type definitions for the email service
 */

import { NotificationType } from './send-notification';

/**
 * Email configuration for SMTP settings
 */
export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

/**
 * Parameters for sending an email
 */
export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text: string;
  from?: string;
}

/**
 * Result of sending an email
 */
export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Email template structure
 */
export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

/**
 * Email log entry for tracking
 */
export interface EmailLog {
  to: string;
  subject: string;
  type: NotificationType;
  success: boolean;
  error?: string;
  messageId?: string;
  timestamp: Date;
}

/**
 * User notification preferences (future implementation)
 */
export interface UserNotificationPreferences {
  userId: string;
  emailEnabled: boolean;
  notificationTypes: {
    [NotificationType.WELCOME]?: boolean;
    [NotificationType.PASSWORD_RESET]?: boolean;
    [NotificationType.HOMEWORK_REVIEWED]?: boolean;
    [NotificationType.CLASS_REMINDER]?: boolean;
    [NotificationType.LOW_HOURS_WARNING]?: boolean;
    [NotificationType.ASSIGNMENT_NOTIFICATION]?: boolean;
  };
}

/**
 * Welcome email parameters
 */
export interface WelcomeEmailParams {
  userId: string;
  email: string;
  userName: string;
  userRole: string;
}

/**
 * Password reset email parameters
 */
export interface PasswordResetEmailParams {
  userId: string;
  email: string;
  userName: string;
  resetLink: string;
}

/**
 * Homework reviewed email parameters
 */
export interface HomeworkReviewedEmailParams {
  studentId: string;
  studentEmail: string;
  studentName: string;
  teacherName: string;
  status: string;
  feedback?: string;
}

/**
 * Class reminder email parameters
 */
export interface ClassReminderEmailParams {
  studentId: string;
  studentEmail: string;
  studentName: string;
  teacherName: string;
  date: string;
  time: string;
}

/**
 * Low hours warning email parameters
 */
export interface LowHoursWarningEmailParams {
  studentId: string;
  studentEmail: string;
  studentName: string;
  remainingHours: number;
}

/**
 * Assignment notification email parameters
 */
export interface AssignmentNotificationEmailParams {
  studentId: string;
  studentEmail: string;
  studentName: string;
  teacherName: string;
}

/**
 * Custom email parameters
 */
export interface CustomEmailParams {
  userId: string;
  email: string;
  subject: string;
  html: string;
  text: string;
}
