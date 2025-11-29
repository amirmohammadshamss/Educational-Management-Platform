/**
 * Notifications Module
 * Central export point for all notification functionality
 */

export {
  createNotification,
  notifyHomeworkReviewed,
  notifyHomeworkSubmitted,
  notifyClassReminder,
  notifyLowHours,
  notifyNewAssignment,
  notifyStudentAssigned,
  notifySystem,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  type CreateNotificationParams,
} from './create-notification';
