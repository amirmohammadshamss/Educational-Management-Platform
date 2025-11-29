/**
 * Booking API Client
 * Handles integration with external booking API
 */

interface BookingApiResponse {
  id: string;
  studentId: string;
  teacherId: string;
  date: string;
  duration: number; // in minutes
  status: string;
  location?: string;
}

interface SyncResult {
  success: boolean;
  bookingsProcessed: number;
  bookingsCreated: number;
  bookingsUpdated: number;
  errors: string[];
}

/**
 * Fetch all bookings from the external Booking API
 */
export async function fetchBookingsFromApi(): Promise<BookingApiResponse[]> {
  const apiUrl = process.env.BOOKING_API_URL;
  const apiKey = process.env.BOOKING_API_KEY;

  if (!apiUrl || !apiKey) {
    throw new Error('Booking API configuration missing');
  }

  try {
    const response = await fetch(`${apiUrl}/bookings`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Booking API returned status ${response.status}`);
    }

    const data = await response.json();
    return data.bookings || [];
  } catch (error) {
    console.error('Error fetching bookings from API:', error);
    throw error;
  }
}

/**
 * Sync bookings with the database
 */
export async function syncBookings(prisma: any): Promise<SyncResult> {
  const result: SyncResult = {
    success: false,
    bookingsProcessed: 0,
    bookingsCreated: 0,
    bookingsUpdated: 0,
    errors: [],
  };

  try {
    // Fetch bookings from external API
    const apiBookings = await fetchBookingsFromApi();
    result.bookingsProcessed = apiBookings.length;

    // Process each booking
    for (const apiBooking of apiBookings) {
      try {
        // Check if student exists
        const student = await prisma.student.findFirst({
          where: {
            OR: [
              { id: apiBooking.studentId },
              { governmentId: apiBooking.studentId },
            ],
          },
        });

        if (!student) {
          result.errors.push(`Student not found for booking ${apiBooking.id}`);
          continue;
        }

        // Check if teacher exists
        const teacher = await prisma.teacher.findFirst({
          where: { id: apiBooking.teacherId },
        });

        if (!teacher) {
          result.errors.push(`Teacher not found for booking ${apiBooking.id}`);
          continue;
        }

        // Check if booking already exists
        const existingBooking = await prisma.booking.findUnique({
          where: { id: apiBooking.id },
        });

        const bookingData = {
          studentId: student.id,
          teacherId: teacher.id,
          date: new Date(apiBooking.date),
          duration: apiBooking.duration,
          status: apiBooking.status,
          location: apiBooking.location || null,
          source: 'BOOKING_API',
        };

        if (existingBooking) {
          // Update existing booking
          await prisma.booking.update({
            where: { id: apiBooking.id },
            data: bookingData,
          });
          result.bookingsUpdated++;
        } else {
          // Create new booking
          await prisma.booking.create({
            data: {
              id: apiBooking.id,
              ...bookingData,
            },
          });
          result.bookingsCreated++;
        }
      } catch (error: any) {
        result.errors.push(`Error processing booking ${apiBooking.id}: ${error.message}`);
        console.error(`Error processing booking ${apiBooking.id}:`, error);
      }
    }

    result.success = result.errors.length === 0;
    return result;
  } catch (error: any) {
    result.errors.push(`Fatal error during sync: ${error.message}`);
    console.error('Fatal error during booking sync:', error);
    return result;
  }
}

/**
 * Calculate and update student used hours based on completed bookings
 */
export async function updateStudentUsedHours(prisma: any): Promise<{ updated: number; errors: string[] }> {
  const result = {
    updated: 0,
    errors: [] as string[],
  };

  try {
    // Get all students
    const students = await prisma.student.findMany();

    for (const student of students) {
      try {
        // Calculate total hours from completed bookings
        const completedBookings = await prisma.booking.findMany({
          where: {
            studentId: student.id,
            status: 'COMPLETED',
          },
        });

        const totalMinutes = completedBookings.reduce(
          (sum: number, booking: { duration: number }) => sum + booking.duration,
          0
        );
        const totalHours = Math.round((totalMinutes / 60) * 100) / 100; // Round to 2 decimals

        // Update student's used hours
        await prisma.student.update({
          where: { id: student.id },
          data: { usedHours: totalHours },
        });

        result.updated++;
      } catch (error: any) {
        result.errors.push(`Error updating hours for student ${student.id}: ${error.message}`);
        console.error(`Error updating hours for student ${student.id}:`, error);
      }
    }

    return result;
  } catch (error: any) {
    result.errors.push(`Fatal error updating student hours: ${error.message}`);
    console.error('Fatal error updating student hours:', error);
    return result;
  }
}
