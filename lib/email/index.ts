/**
 * Email Service Module
 * Central export point for all email-related functionality
 */

// Core email functionality
export {
  sendEmail,
  verifyEmailConnection,
  closeEmailConnection,
  type EmailConfig,
  type SendEmailParams,
} from './mailer';

// Email templates
export {
  welcomeEmail,
  passwordResetEmail,
  homeworkReviewedEmail,
  classReminderEmail,
  lowHoursWarningEmail,
  assignmentNotificationEmail,
  type EmailTemplate,
} from './templates';

// Notification wrapper functions
export {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendHomeworkReviewedEmail,
  sendClassReminderEmail,
  sendLowHoursWarningEmail,
  sendAssignmentNotificationEmail,
  sendCustomEmail,
  NotificationType,
} from './send-notification';

// Type definitions
export type {
  SendEmailResult,
  EmailLog,
  UserNotificationPreferences,
  WelcomeEmailParams,
  PasswordResetEmailParams,
  HomeworkReviewedEmailParams,
  ClassReminderEmailParams,
  LowHoursWarningEmailParams,
  AssignmentNotificationEmailParams,
  CustomEmailParams,
} from './types';
