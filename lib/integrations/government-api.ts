/**
 * French Government API Integration
 *
 * Handles communication with the French Government API for authorized training hours
 * Includes retry logic, rate limiting, timeout handling, and error management
 */

/**
 * External Government API student data structure
 */
export interface ExternalStudentHours {
  governmentId: string;           // French government ID (e.g., "FR123456789")
  authorizedHours: number;        // Total authorized training hours
  studentName: string;            // Student full name
  programType: string;            // Training program type
  validFrom: string;              // ISO 8601 format
  validUntil: string;             // ISO 8601 format
  lastUpdated: string;            // ISO 8601 format
}

/**
 * Government API response structure
 */
export interface GovernmentAPIResponse {
  success: boolean;
  data: ExternalStudentHours[];
  total: number;
  page?: number;
  pageSize?: number;
}

/**
 * Government API single student response
 */
export interface GovernmentAPISingleResponse {
  success: boolean;
  data: ExternalStudentHours;
}

/**
 * Government API error structure
 */
export interface GovernmentAPIError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * Rate limit information
 */
interface RateLimitInfo {
  remaining: number;
  reset: number; // Unix timestamp
  limit: number;
}

/**
 * Retry configuration
 */
interface RetryConfig {
  maxRetries: number;
  delayMs: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  delayMs: 1000,
  backoffMultiplier: 2,
};

/**
 * Rate limit tracker (in-memory for simplicity)
 * In production, consider using Redis or similar
 */
let rateLimitInfo: RateLimitInfo | null = null;

/**
 * Sleep utility for retry delays and rate limiting
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if we're rate limited and wait if necessary
 */
async function handleRateLimit(): Promise<void> {
  if (!rateLimitInfo) {
    return;
  }

  if (rateLimitInfo.remaining <= 0) {
    const now = Date.now();
    const resetTime = rateLimitInfo.reset * 1000; // Convert to milliseconds

    if (now < resetTime) {
      const waitTime = resetTime - now;
      console.warn(`Rate limit exceeded. Waiting ${waitTime}ms until reset...`);
      await sleep(waitTime + 1000); // Add 1 second buffer
    }
  }
}

/**
 * Update rate limit info from response headers
 */
function updateRateLimitFromHeaders(headers: Headers): void {
  const remaining = headers.get('X-RateLimit-Remaining');
  const reset = headers.get('X-RateLimit-Reset');
  const limit = headers.get('X-RateLimit-Limit');

  if (remaining && reset && limit) {
    rateLimitInfo = {
      remaining: parseInt(remaining, 10),
      reset: parseInt(reset, 10),
      limit: parseInt(limit, 10),
    };
  }
}

/**
 * Fetch with retry logic and rate limiting
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<Response> {
  let lastError: Error | null = null;
  let delay = retryConfig.delayMs;

  for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
    try {
      // Check rate limit before making request
      await handleRateLimit();

      // Add timeout to fetch
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Update rate limit info from headers
      updateRateLimitFromHeaders(response.headers);

      // If successful or client error (4xx), return immediately
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        return response;
      }

      // Server error (5xx) or rate limit (429) - retry
      if (response.status === 429) {
        // Rate limited - extract wait time from headers if available
        const retryAfter = response.headers.get('Retry-After');
        if (retryAfter) {
          const waitTime = parseInt(retryAfter, 10) * 1000;
          console.warn(`Rate limited (429). Waiting ${waitTime}ms...`);
          await sleep(waitTime);
          continue;
        }
      }

      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      lastError = error as Error;

      // Don't retry on abort (timeout)
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout after 30 seconds');
      }

      if (attempt < retryConfig.maxRetries) {
        console.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`, error);
        await sleep(delay);
        delay *= retryConfig.backoffMultiplier;
      }
    }
  }

  throw lastError || new Error('Request failed after all retries');
}

/**
 * Fetch authorized hours for all students from government API
 */
export async function fetchAllStudentHours(): Promise<ExternalStudentHours[]> {
  const apiUrl = process.env.GOVERNMENT_API_URL;
  const apiKey = process.env.GOVERNMENT_API_KEY;

  if (!apiUrl || !apiKey) {
    throw new Error('Government API configuration missing (GOVERNMENT_API_URL or GOVERNMENT_API_KEY)');
  }

  // For development/testing: Return mock data if API URL is set to 'mock'
  if (apiUrl === 'mock') {
    return getMockStudentHours();
  }

  try {
    const response = await fetchWithRetry(
      `${apiUrl}/students/hours`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData: GovernmentAPIError = await response.json();
      throw new Error(`Government API error: ${errorData.error.message}`);
    }

    const data: GovernmentAPIResponse = await response.json();

    if (!data.success) {
      throw new Error('Government API returned success=false');
    }

    return data.data;
  } catch (error) {
    console.error('Error fetching student hours from government API:', error);
    throw error;
  }
}

/**
 * Fetch authorized hours for a specific student by government ID
 */
export async function fetchStudentHoursByGovernmentId(
  governmentId: string
): Promise<ExternalStudentHours> {
  const apiUrl = process.env.GOVERNMENT_API_URL;
  const apiKey = process.env.GOVERNMENT_API_KEY;

  if (!apiUrl || !apiKey) {
    throw new Error('Government API configuration missing');
  }

  // For development/testing: Return filtered mock data
  if (apiUrl === 'mock') {
    const mockData = getMockStudentHours();
    const student = mockData.find((s) => s.governmentId === governmentId);
    if (!student) {
      throw new Error(`Student not found in government system: ${governmentId}`);
    }
    return student;
  }

  try {
    const response = await fetchWithRetry(
      `${apiUrl}/students/${encodeURIComponent(governmentId)}/hours`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Student not found in government system: ${governmentId}`);
      }
      const errorData: GovernmentAPIError = await response.json();
      throw new Error(`Government API error: ${errorData.error.message}`);
    }

    const data: GovernmentAPISingleResponse = await response.json();

    if (!data.success) {
      throw new Error('Government API returned success=false');
    }

    return data.data;
  } catch (error) {
    console.error(`Error fetching hours for student ${governmentId}:`, error);
    throw error;
  }
}

/**
 * Mock student hours data for development/testing
 */
function getMockStudentHours(): ExternalStudentHours[] {
  const now = new Date();
  const validFrom = new Date(now.getFullYear(), 0, 1); // January 1st of current year
  const validUntil = new Date(now.getFullYear(), 11, 31); // December 31st of current year

  return [
    {
      governmentId: 'FR123456789',
      authorizedHours: 100,
      studentName: 'Jean Dupont',
      programType: 'Formation Continue',
      validFrom: validFrom.toISOString(),
      validUntil: validUntil.toISOString(),
      lastUpdated: now.toISOString(),
    },
    {
      governmentId: 'FR987654321',
      authorizedHours: 150,
      studentName: 'Marie Martin',
      programType: 'Reconversion Professionnelle',
      validFrom: validFrom.toISOString(),
      validUntil: validUntil.toISOString(),
      lastUpdated: now.toISOString(),
    },
    {
      governmentId: 'FR555666777',
      authorizedHours: 80,
      studentName: 'Pierre Bernard',
      programType: 'Formation Continue',
      validFrom: validFrom.toISOString(),
      validUntil: validUntil.toISOString(),
      lastUpdated: now.toISOString(),
    },
    {
      governmentId: 'FR111222333',
      authorizedHours: 120,
      studentName: 'Sophie Laurent',
      programType: 'Compte Personnel de Formation (CPF)',
      validFrom: validFrom.toISOString(),
      validUntil: validUntil.toISOString(),
      lastUpdated: now.toISOString(),
    },
    {
      governmentId: 'FR444555666',
      authorizedHours: 200,
      studentName: 'Luc Moreau',
      programType: 'Plan de Développement des Compétences',
      validFrom: validFrom.toISOString(),
      validUntil: validUntil.toISOString(),
      lastUpdated: now.toISOString(),
    },
  ];
}

/**
 * Validate external student hours data
 */
export function validateStudentHours(studentHours: ExternalStudentHours): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate governmentId
  if (!studentHours.governmentId || typeof studentHours.governmentId !== 'string') {
    errors.push('Missing or invalid governmentId');
  }

  // Validate authorizedHours
  if (typeof studentHours.authorizedHours !== 'number') {
    errors.push('authorizedHours must be a number');
  } else if (studentHours.authorizedHours < 0) {
    errors.push('authorizedHours must be a positive number');
  } else if (studentHours.authorizedHours > 10000) {
    errors.push('authorizedHours exceeds maximum allowed (10000)');
  }

  // Validate studentName
  if (!studentHours.studentName || typeof studentHours.studentName !== 'string') {
    errors.push('Missing or invalid studentName');
  }

  // Validate dates
  if (!studentHours.validFrom || isNaN(Date.parse(studentHours.validFrom))) {
    errors.push('Missing or invalid validFrom date');
  }

  if (!studentHours.validUntil || isNaN(Date.parse(studentHours.validUntil))) {
    errors.push('Missing or invalid validUntil date');
  }

  // Validate validUntil is after validFrom
  if (studentHours.validFrom && studentHours.validUntil) {
    const from = new Date(studentHours.validFrom);
    const until = new Date(studentHours.validUntil);
    if (until <= from) {
      errors.push('validUntil must be after validFrom');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get current rate limit status
 */
export function getRateLimitStatus(): RateLimitInfo | null {
  return rateLimitInfo;
}

/**
 * Reset rate limit info (useful for testing)
 */
export function resetRateLimit(): void {
  rateLimitInfo = null;
}
