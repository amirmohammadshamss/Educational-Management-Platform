import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

// Email configuration interface
export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

// Email parameters interface
export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text: string;
  from?: string;
}

// Create transporter instance
let transporter: Transporter | null = null;

/**
 * Initialize email transporter with SMTP settings
 */
function getTransporter(): Transporter {
  if (transporter) {
    return transporter;
  }

  const config: EmailConfig = {
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASSWORD || '',
    },
  };

  transporter = nodemailer.createTransport(config);

  return transporter;
}

/**
 * Send email with retry logic
 * @param params Email parameters
 * @param retries Number of retry attempts (default: 3)
 * @returns Promise with send result
 */
export async function sendEmail(
  params: SendEmailParams,
  retries: number = 3
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { to, subject, html, text, from } = params;

  // Validate email parameters
  if (!to || !subject || !html || !text) {
    return {
      success: false,
      error: 'Missing required email parameters',
    };
  }

  const defaultFrom = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@example.com';

  const mailOptions = {
    from: from || `"Educational Management Platform" <${defaultFrom}>`,
    to,
    subject,
    text,
    html,
  };

  let lastError: Error | null = null;

  // Retry logic
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const transport = getTransporter();
      const info = await transport.sendMail(mailOptions);

      console.log(`Email sent successfully to ${to}: ${info.messageId}`);

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      lastError = error as Error;
      console.error(`Email send attempt ${attempt} failed:`, error);

      // If not the last attempt, wait before retrying
      if (attempt < retries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Exponential backoff, max 5s
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // All retries failed
  return {
    success: false,
    error: lastError?.message || 'Failed to send email after retries',
  };
}

/**
 * Verify SMTP connection
 * Useful for testing email configuration
 */
export async function verifyEmailConnection(): Promise<boolean> {
  try {
    const transport = getTransporter();
    await transport.verify();
    console.log('SMTP connection verified successfully');
    return true;
  } catch (error) {
    console.error('SMTP connection verification failed:', error);
    return false;
  }
}

/**
 * Close the transporter connection
 * Should be called when shutting down the application
 */
export function closeEmailConnection(): void {
  if (transporter) {
    transporter.close();
    transporter = null;
  }
}
