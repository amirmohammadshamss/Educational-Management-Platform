/**
 * Logger Utility
 * Centralized logging for the application with different log levels
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  [key: string]: any;
}

class Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  info(message: string, context?: LogContext) {
    console.log(this.formatMessage('info', message, context));
  }

  warn(message: string, context?: LogContext) {
    console.warn(this.formatMessage('warn', message, context));
  }

  error(message: string, error?: Error | any, context?: LogContext) {
    const errorContext = error ? {
      ...context,
      error: {
        message: error.message,
        stack: this.isDevelopment ? error.stack : undefined,
        name: error.name,
      },
    } : context;

    console.error(this.formatMessage('error', message, errorContext));
  }

  debug(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  /**
   * Log cron job execution
   */
  cronStart(jobName: string, context?: LogContext) {
    this.info(`Cron job started: ${jobName}`, context);
  }

  cronSuccess(jobName: string, duration: number, context?: LogContext) {
    this.info(`Cron job completed: ${jobName}`, {
      ...context,
      duration: `${duration}ms`,
    });
  }

  cronError(jobName: string, error: Error, duration: number, context?: LogContext) {
    this.error(`Cron job failed: ${jobName}`, error, {
      ...context,
      duration: `${duration}ms`,
    });
  }
}

// Export singleton instance
export const logger = new Logger();

/**
 * Create a sync log entry in the database
 */
export async function createSyncLog(
  prisma: any,
  source: string,
  status: string,
  message: string
) {
  try {
    return await prisma.syncLog.create({
      data: {
        source,
        status,
        message,
        lastSyncTime: new Date(),
      },
    });
  } catch (error) {
    logger.error('Failed to create sync log', error);
    throw error;
  }
}

/**
 * Update an existing sync log entry
 */
export async function updateSyncLog(
  prisma: any,
  id: string,
  status: string,
  message: string
) {
  try {
    return await prisma.syncLog.update({
      where: { id },
      data: {
        status,
        message,
        lastSyncTime: new Date(),
      },
    });
  } catch (error) {
    logger.error('Failed to update sync log', error);
    throw error;
  }
}
