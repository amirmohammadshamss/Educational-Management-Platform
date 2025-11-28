/**
 * Government API Client
 * Handles integration with French Government API for authorized training hours
 */

import { logger } from './logger';

interface GovernmentApiResponse {
  governmentId: string;
  authorizedHours: number;
  validUntil?: string;
  studentName?: string;
}

interface SyncResult {
  success: boolean;
  studentsProcessed: number;
  studentsUpdated: number;
  studentsSkipped: number;
  studentsNotFound: number;
  changes: Array<{
    studentId: string;
    governmentId: string;
    oldHours: number;
    newHours: number;
  }>;
  errors: string[];
  anomalies: string[];
}

/**
 * Fetch authorized hours for a single student from Government API
 */
export async function fetchStudentHoursFromApi(governmentId: string): Promise<GovernmentApiResponse> {
  const apiUrl = process.env.GOVERNMENT_API_URL;
  const apiKey = process.env.GOVERNMENT_API_KEY;

  if (!apiUrl || !apiKey) {
    throw new Error('Government API configuration missing');
  }

  try {
    const response = await fetch(`${apiUrl}/students/${governmentId}/hours`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 404) {
      throw new Error(`Student not found in Government API: ${governmentId}`);
    }

    if (response.status === 429) {
      throw new Error('Rate limit exceeded');
    }

    if (!response.ok) {
      throw new Error(`Government API returned status ${response.status}`);
    }

    const data = await response.json();

    return {
      governmentId: data.governmentId || governmentId,
      authorizedHours: data.authorizedHours || data.hours || 0,
      validUntil: data.validUntil,
      studentName: data.name,
    };
  } catch (error: any) {
    logger.error('Error fetching student hours from Government API', error, { governmentId });
    throw error;
  }
}

/**
 * Validate authorized hours value
 */
function validateHours(hours: number, governmentId: string): { valid: boolean; anomalies: string[] } {
  const anomalies: string[] = [];

  // Must be a positive number
  if (typeof hours !== 'number' || isNaN(hours)) {
    return { valid: false, anomalies: [`Invalid hours value for ${governmentId}: ${hours}`] };
  }

  // Must be positive
  if (hours < 0) {
    return { valid: false, anomalies: [`Negative hours value for ${governmentId}: ${hours}`] };
  }

  // Must be reasonable (max 10000 hours)
  if (hours > 10000) {
    anomalies.push(`Unusually high hours value for ${governmentId}: ${hours}`);
  }

  // Warn if zero (might be intentional)
  if (hours === 0) {
    anomalies.push(`Zero hours value for ${governmentId}`);
  }

  return { valid: true, anomalies };
}

/**
 * Sync government hours for all students
 */
export async function syncGovernmentHours(
  prisma: any,
  dryRun: boolean = false
): Promise<SyncResult> {
  const result: SyncResult = {
    success: false,
    studentsProcessed: 0,
    studentsUpdated: 0,
    studentsSkipped: 0,
    studentsNotFound: 0,
    changes: [],
    errors: [],
    anomalies: [],
  };

  try {
    // Fetch all students with governmentId
    const students = await prisma.student.findMany({
      where: {
        governmentId: {
          not: null,
        },
      },
      select: {
        id: true,
        governmentId: true,
        totalAllowedHours: true,
      },
    });

    logger.info(`Found ${students.length} students with Government IDs`);
    result.studentsProcessed = students.length;

    // Process each student
    for (const student of students) {
      try {
        // Fetch hours from Government API
        const apiData = await fetchStudentHoursFromApi(student.governmentId);

        // Validate hours
        const validation = validateHours(apiData.authorizedHours, student.governmentId);

        if (!validation.valid) {
          result.errors.push(...validation.anomalies);
          continue;
        }

        // Log anomalies (but continue processing)
        if (validation.anomalies.length > 0) {
          result.anomalies.push(...validation.anomalies);
          logger.warn('Hours validation anomaly', {
            governmentId: student.governmentId,
            anomalies: validation.anomalies,
          });
        }

        // Check if hours have changed
        if (apiData.authorizedHours === student.totalAllowedHours) {
          result.studentsSkipped++;
          logger.debug('No change in hours', {
            governmentId: student.governmentId,
            hours: apiData.authorizedHours,
          });
          continue;
        }

        // Track change
        result.changes.push({
          studentId: student.id,
          governmentId: student.governmentId,
          oldHours: student.totalAllowedHours,
          newHours: apiData.authorizedHours,
        });

        // Update student hours (unless dry run)
        if (!dryRun) {
          await prisma.student.update({
            where: { id: student.id },
            data: { totalAllowedHours: apiData.authorizedHours },
          });

          logger.info('Updated student hours', {
            studentId: student.id,
            governmentId: student.governmentId,
            oldHours: student.totalAllowedHours,
            newHours: apiData.authorizedHours,
          });
        }

        result.studentsUpdated++;

        // Rate limiting: small delay between requests
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error: any) {
        if (error.message.includes('not found')) {
          result.studentsNotFound++;
          result.errors.push(`Student not found in Government API: ${student.governmentId}`);
        } else if (error.message.includes('Rate limit')) {
          result.errors.push(`Rate limit exceeded at student ${student.governmentId}`);
          logger.error('Rate limit exceeded, stopping sync', error);
          break; // Stop processing on rate limit
        } else {
          result.errors.push(`Error processing student ${student.governmentId}: ${error.message}`);
        }

        logger.error('Error processing student hours', error, {
          studentId: student.id,
          governmentId: student.governmentId,
        });
      }
    }

    result.success = result.errors.length === 0 && result.studentsNotFound === 0;
    return result;
  } catch (error: any) {
    result.errors.push(`Fatal error during government hours sync: ${error.message}`);
    logger.error('Fatal error during government hours sync', error);
    return result;
  }
}

/**
 * Retry mechanism for rate-limited requests
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      if (error.message.includes('Rate limit') && attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt); // Exponential backoff
        logger.warn(`Rate limited, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }

  throw new Error('Max retries exceeded');
}
