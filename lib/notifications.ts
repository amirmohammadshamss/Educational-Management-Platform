/**
 * Notification System
 *
 * Handles email and in-app notifications for various events
 */

import { HomeworkStatus } from '@prisma/client';

/**
 * Homework review notification data
 */
interface HomeworkReviewNotification {
  studentName: string;
  studentEmail: string;
  teacherName: string;
  fileName: string;
  status: HomeworkStatus;
  feedback: string;
  homeworkUrl: string;
}

/**
 * Send homework review notification to student
 *
 * This function logs the notification and prepares it for future email integration
 * TODO: Integrate with SMTP service when email configuration is ready
 */
export async function sendHomeworkReviewNotification(
  data: HomeworkReviewNotification
): Promise<void> {
  const statusText = formatStatus(data.status);
  const statusColor = getStatusColor(data.status);

  // Log notification for now (will send email when SMTP is configured)
  console.log('📧 Homework Review Notification:', {
    to: data.studentEmail,
    subject: `Your homework has been reviewed: ${statusText}`,
    studentName: data.studentName,
    teacherName: data.teacherName,
    fileName: data.fileName,
    status: data.status,
    feedbackLength: data.feedback.length,
  });

  // Prepare email content
  const emailContent = generateHomeworkReviewEmail(data);

  // TODO: Send email using SMTP when configured
  // Example integration:
  /*
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    await sendEmail({
      to: data.studentEmail,
      subject: `Your homework has been reviewed: ${statusText}`,
      html: emailContent,
    });
  }
  */

  // For now, just log the email content in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Email content preview:\n', emailContent);
  }
}

/**
 * Format homework status for display
 */
function formatStatus(status: HomeworkStatus): string {
  switch (status) {
    case 'APPROVED':
      return 'Approved ✓';
    case 'REJECTED':
      return 'Rejected ✗';
    case 'NEEDS_REVISION':
      return 'Needs Revision';
    case 'PENDING':
      return 'Pending Review';
    default:
      return status;
  }
}

/**
 * Get status color for email styling
 */
function getStatusColor(status: HomeworkStatus): string {
  switch (status) {
    case 'APPROVED':
      return '#10b981'; // green
    case 'REJECTED':
      return '#ef4444'; // red
    case 'NEEDS_REVISION':
      return '#f59e0b'; // yellow
    case 'PENDING':
      return '#3b82f6'; // blue
    default:
      return '#6b7280'; // gray
  }
}

/**
 * Generate HTML email content for homework review notification
 */
function generateHomeworkReviewEmail(
  data: HomeworkReviewNotification
): string {
  const statusText = formatStatus(data.status);
  const statusColor = getStatusColor(data.status);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Homework Review</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background-color: ${statusColor}; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">
                Your Homework Has Been Reviewed
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.5;">
                Hello ${data.studentName},
              </p>

              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.5;">
                Your teacher <strong>${data.teacherName}</strong> has reviewed your homework submission.
              </p>

              <!-- Homework Details -->
              <div style="background-color: #f9fafb; border-left: 4px solid ${statusColor}; padding: 20px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">
                  <strong>File</strong>
                </p>
                <p style="margin: 0 0 20px; color: #111827; font-size: 16px;">
                  ${data.fileName}
                </p>

                <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">
                  <strong>Status</strong>
                </p>
                <p style="margin: 0 0 20px; color: ${statusColor}; font-size: 18px; font-weight: bold;">
                  ${statusText}
                </p>

                <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">
                  <strong>Feedback</strong>
                </p>
                <p style="margin: 0; color: #374151; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">
                  ${data.feedback}
                </p>
              </div>

              <!-- Call to Action -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.homeworkUrl}" style="display: inline-block; padding: 12px 32px; background-color: #3b82f6; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 500;">
                  View Your Homework
                </a>
              </div>

              <p style="margin: 20px 0 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
                Best regards,<br>
                <strong>Educational Management Platform</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                This is an automated notification. Please do not reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Send email using SMTP (placeholder for future implementation)
 *
 * This function will be implemented when SMTP configuration is added
 */
async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  // TODO: Implement email sending using nodemailer or similar
  /*
  const nodemailer = require('nodemailer');

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: options.to,
    subject: options.subject,
    html: options.html,
  });
  */

  console.log('📧 Email would be sent to:', options.to);
}

/**
 * Batch send homework review notifications
 */
export async function sendBulkHomeworkReviewNotifications(
  notifications: HomeworkReviewNotification[]
): Promise<void> {
  console.log(`📧 Sending ${notifications.length} homework review notifications...`);

  // Send notifications in parallel
  await Promise.all(
    notifications.map((notification) =>
      sendHomeworkReviewNotification(notification)
    )
  );

  console.log(`✅ Sent ${notifications.length} notifications`);
}
