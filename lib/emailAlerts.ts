/**
 * Email Alert Utility
 * Send email notifications for critical system events
 */

import { logger } from './logger';

interface AlertEmailData {
  subject: string;
  body: string;
  priority?: 'low' | 'normal' | 'high';
}

/**
 * Send an alert email to administrators
 * This is a placeholder implementation - integrate with your email service (SendGrid, Resend, etc.)
 */
export async function sendAlertEmail(
  subject: string,
  body: string | object,
  priority: 'low' | 'normal' | 'high' = 'normal'
): Promise<boolean> {
  try {
    // Get admin email from environment
    const adminEmail = process.env.ADMIN_EMAIL;

    if (!adminEmail) {
      logger.warn('ADMIN_EMAIL not configured, skipping alert email', { subject });
      return false;
    }

    // Format body if it's an object
    const emailBody = typeof body === 'string' ? body : JSON.stringify(body, null, 2);

    // Log the alert
    logger.info('Sending alert email', {
      to: adminEmail,
      subject,
      priority,
    });

    // TODO: Integrate with email service
    // Example with Resend:
    /*
    const { Resend } = require('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: 'alerts@yourdomain.com',
      to: adminEmail,
      subject: `[${priority.toUpperCase()}] ${subject}`,
      html: `
        <h2>${subject}</h2>
        <pre>${emailBody}</pre>
        <p>Time: ${new Date().toISOString()}</p>
      `,
    });
    */

    // For now, just log it
    logger.debug('Alert email content', { subject, body: emailBody });

    return true;
  } catch (error) {
    logger.error('Failed to send alert email', error, { subject });
    return false;
  }
}

/**
 * Send a cron job failure alert
 */
export async function sendCronFailureAlert(
  jobName: string,
  error: string,
  details?: object
): Promise<boolean> {
  const subject = `Cron Job Failed: ${jobName}`;
  const body = `
Cron Job: ${jobName}
Status: FAILED
Time: ${new Date().toISOString()}
Error: ${error}

Details:
${JSON.stringify(details, null, 2)}

Please check the logs and investigate the issue.
  `;

  return sendAlertEmail(subject, body, 'high');
}

/**
 * Send a cron job partial success alert
 */
export async function sendCronPartialSuccessAlert(
  jobName: string,
  summary: object
): Promise<boolean> {
  const subject = `Cron Job Partial Success: ${jobName}`;
  const body = `
Cron Job: ${jobName}
Status: PARTIAL SUCCESS
Time: ${new Date().toISOString()}

Some operations completed successfully, but there were errors.

Summary:
${JSON.stringify(summary, null, 2)}

Please review the errors and take appropriate action.
  `;

  return sendAlertEmail(subject, body, 'normal');
}

/**
 * Send a sync completion notification (optional)
 */
export async function sendSyncCompletionNotification(
  source: string,
  summary: {
    processed: number;
    created: number;
    updated: number;
    errors: number;
  }
): Promise<boolean> {
  const subject = `Data Sync Completed: ${source}`;
  const body = `
Data Source: ${source}
Status: SUCCESS
Time: ${new Date().toISOString()}

Summary:
- Processed: ${summary.processed}
- Created: ${summary.created}
- Updated: ${summary.updated}
- Errors: ${summary.errors}

The sync operation completed successfully.
  `;

  // Only send if there are errors or if explicitly configured
  if (summary.errors > 0 || process.env.SEND_SUCCESS_NOTIFICATIONS === 'true') {
    return sendAlertEmail(subject, body, summary.errors > 0 ? 'normal' : 'low');
  }

  return true;
}
