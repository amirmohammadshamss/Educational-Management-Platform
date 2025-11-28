/**
 * External Booking API Integration
 *
 * Handles communication with the external Booking API
 * Includes retry logic, timeout handling, and error management
 */

import { BookingStatus } from '@prisma/client';

/**
 * External API booking data structure
 * This represents the format we receive from the external API
 */
export interface ExternalBooking {
  bookingId: string;
  studentGovernmentId: string;
  teacherEmail: string;
  scheduledDate: string; // ISO 8601 format
  durationHours: number;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  createdAt: string;
  updatedAt?: string;
}

/**
 * External API response structure
 */
export interface ExternalBookingResponse {
  success: boolean;
  data: ExternalBooking[];
  total: number;
  page?: number;
  pageSize?: number;
}

/**
 * External API error structure
 */
export interface ExternalAPIError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * Transform external status to internal BookingStatus enum
 */
export function transformBookingStatus(externalStatus: string): BookingStatus {
  switch (externalStatus.toLowerCase()) {
    case 'scheduled':
      return BookingStatus.SCHEDULED;
    case 'completed':
      return BookingStatus.COMPLETED;
    case 'cancelled':
      return BookingStatus.CANCELLED;
    case 'no-show':
    case 'no_show':
      return BookingStatus.NO_SHOW;
    default:
      return BookingStatus.SCHEDULED; // Default fallback
  }
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
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch with retry logic
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
      // Add timeout to fetch
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // If successful or client error (4xx), return immediately
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        return response;
      }

      // Server error (5xx) - retry
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      lastError = error as Error;

      // Don't retry on abort (timeout) or on last attempt
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
 * Fetch all bookings from external API
 */
export async function fetchAllBookings(): Promise<ExternalBooking[]> {
  const apiUrl = process.env.BOOKING_API_URL;
  const apiKey = process.env.BOOKING_API_KEY;

  if (!apiUrl || !apiKey) {
    throw new Error('Booking API configuration missing (BOOKING_API_URL or BOOKING_API_KEY)');
  }

  // For development/testing: Return mock data if API URL is set to 'mock'
  if (apiUrl === 'mock') {
    return getMockBookings();
  }

  try {
    const response = await fetchWithRetry(
      `${apiUrl}/bookings`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData: ExternalAPIError = await response.json();
      throw new Error(`Booking API error: ${errorData.error.message}`);
    }

    const data: ExternalBookingResponse = await response.json();

    if (!data.success) {
      throw new Error('Booking API returned success=false');
    }

    return data.data;
  } catch (error) {
    console.error('Error fetching bookings from external API:', error);
    throw error;
  }
}

/**
 * Fetch bookings by date range from external API
 */
export async function fetchBookingsByDateRange(
  startDate: Date,
  endDate: Date
): Promise<ExternalBooking[]> {
  const apiUrl = process.env.BOOKING_API_URL;
  const apiKey = process.env.BOOKING_API_KEY;

  if (!apiUrl || !apiKey) {
    throw new Error('Booking API configuration missing');
  }

  // For development/testing: Return filtered mock data
  if (apiUrl === 'mock') {
    const mockBookings = getMockBookings();
    return mockBookings.filter((booking) => {
      const bookingDate = new Date(booking.scheduledDate);
      return bookingDate >= startDate && bookingDate <= endDate;
    });
  }

  try {
    const params = new URLSearchParams({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    const response = await fetchWithRetry(
      `${apiUrl}/bookings?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData: ExternalAPIError = await response.json();
      throw new Error(`Booking API error: ${errorData.error.message}`);
    }

    const data: ExternalBookingResponse = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching bookings by date range:', error);
    throw error;
  }
}

/**
 * Fetch bookings for a specific student from external API
 */
export async function fetchBookingsByStudent(
  governmentId: string
): Promise<ExternalBooking[]> {
  const apiUrl = process.env.BOOKING_API_URL;
  const apiKey = process.env.BOOKING_API_KEY;

  if (!apiUrl || !apiKey) {
    throw new Error('Booking API configuration missing');
  }

  // For development/testing: Return filtered mock data
  if (apiUrl === 'mock') {
    const mockBookings = getMockBookings();
    return mockBookings.filter(
      (booking) => booking.studentGovernmentId === governmentId
    );
  }

  try {
    const response = await fetchWithRetry(
      `${apiUrl}/bookings/student/${encodeURIComponent(governmentId)}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData: ExternalAPIError = await response.json();
      throw new Error(`Booking API error: ${errorData.error.message}`);
    }

    const data: ExternalBookingResponse = await response.json();
    return data.data;
  } catch (error) {
    console.error(`Error fetching bookings for student ${governmentId}:`, error);
    throw error;
  }
}

/**
 * Mock bookings for development/testing
 * Returns sample booking data when API is not available
 */
function getMockBookings(): ExternalBooking[] {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const lastWeek = new Date(now);
  lastWeek.setDate(lastWeek.getDate() - 7);

  return [
    {
      bookingId: 'ext_booking_001',
      studentGovernmentId: 'FR123456789',
      teacherEmail: 'teacher1@example.com',
      scheduledDate: tomorrow.toISOString(),
      durationHours: 2,
      status: 'scheduled',
      createdAt: now.toISOString(),
    },
    {
      bookingId: 'ext_booking_002',
      studentGovernmentId: 'FR123456789',
      teacherEmail: 'teacher2@example.com',
      scheduledDate: nextWeek.toISOString(),
      durationHours: 3,
      status: 'scheduled',
      createdAt: now.toISOString(),
    },
    {
      bookingId: 'ext_booking_003',
      studentGovernmentId: 'FR987654321',
      teacherEmail: 'teacher1@example.com',
      scheduledDate: lastWeek.toISOString(),
      durationHours: 2,
      status: 'completed',
      createdAt: lastWeek.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      bookingId: 'ext_booking_004',
      studentGovernmentId: 'FR555666777',
      teacherEmail: 'teacher3@example.com',
      scheduledDate: tomorrow.toISOString(),
      durationHours: 1,
      status: 'scheduled',
      createdAt: now.toISOString(),
    },
    {
      bookingId: 'ext_booking_005',
      studentGovernmentId: 'FR123456789',
      teacherEmail: 'teacher1@example.com',
      scheduledDate: lastWeek.toISOString(),
      durationHours: 2,
      status: 'no-show',
      createdAt: lastWeek.toISOString(),
      updatedAt: now.toISOString(),
    },
  ];
}

/**
 * Validate external booking data
 */
export function validateExternalBooking(booking: ExternalBooking): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!booking.bookingId || typeof booking.bookingId !== 'string') {
    errors.push('Missing or invalid bookingId');
  }

  if (!booking.studentGovernmentId || typeof booking.studentGovernmentId !== 'string') {
    errors.push('Missing or invalid studentGovernmentId');
  }

  if (!booking.teacherEmail || typeof booking.teacherEmail !== 'string') {
    errors.push('Missing or invalid teacherEmail');
  }

  if (!booking.scheduledDate || isNaN(Date.parse(booking.scheduledDate))) {
    errors.push('Missing or invalid scheduledDate');
  }

  if (
    typeof booking.durationHours !== 'number' ||
    booking.durationHours < 0 ||
    booking.durationHours > 24
  ) {
    errors.push('Invalid durationHours (must be between 0 and 24)');
  }

  const validStatuses = ['scheduled', 'completed', 'cancelled', 'no-show'];
  if (!validStatuses.includes(booking.status.toLowerCase())) {
    errors.push(`Invalid status: ${booking.status}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
