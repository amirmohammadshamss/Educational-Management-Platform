/**
 * Hours Calculator
 * Calculates student used hours based on completed bookings
 */

import { logger } from './logger';

interface StudentHoursData {
  studentId: string;
  totalAllowedHours: number;
  usedHours: number;
  remainingHours: number;
  percentageUsed: number;
  percentageRemaining: number;
}

interface CalculationResult {
  success: boolean;
  studentsProcessed: number;
  studentsUpdated: number;
  studentsWithLowHours: StudentHoursData[];
  studentsOverLimit: StudentHoursData[];
  totalHoursCalculated: number;
  errors: string[];
}

/**
 * Calculate used hours for all students based on completed bookings
 */
export async function calculateStudentHours(prisma: any): Promise<CalculationResult> {
  const result: CalculationResult = {
    success: false,
    studentsProcessed: 0,
    studentsUpdated: 0,
    studentsWithLowHours: [],
    studentsOverLimit: [],
    totalHoursCalculated: 0,
    errors: [],
  };

  try {
    // Get all students
    const students = await prisma.student.findMany({
      select: {
        id: true,
        totalAllowedHours: true,
        usedHours: true,
      },
    });

    logger.info(`Found ${students.length} students to process`);
    result.studentsProcessed = students.length;

    // Calculate hours for each student using aggregation
    const updates = [];

    for (const student of students) {
      try {
        // Sum all completed booking durations for this student
        const aggregation = await prisma.booking.aggregate({
          where: {
            studentId: student.id,
            status: 'COMPLETED',
          },
          _sum: {
            duration: true,
          },
        });

        const totalMinutes = aggregation._sum.duration || 0;
        const calculatedHours = Math.round((totalMinutes / 60) * 100) / 100; // Round to 2 decimals

        // Check if hours changed
        if (calculatedHours !== student.usedHours) {
          updates.push({
            studentId: student.id,
            oldHours: student.usedHours,
            newHours: calculatedHours,
          });

          // Update student hours
          await prisma.student.update({
            where: { id: student.id },
            data: { usedHours: calculatedHours },
          });

          result.studentsUpdated++;
          logger.debug('Updated student hours', {
            studentId: student.id,
            oldHours: student.usedHours,
            newHours: calculatedHours,
          });
        }

        result.totalHoursCalculated += calculatedHours;

        // Check for warnings
        const remainingHours = student.totalAllowedHours - calculatedHours;
        const percentageRemaining = (remainingHours / student.totalAllowedHours) * 100;
        const percentageUsed = (calculatedHours / student.totalAllowedHours) * 100;

        const studentData: StudentHoursData = {
          studentId: student.id,
          totalAllowedHours: student.totalAllowedHours,
          usedHours: calculatedHours,
          remainingHours,
          percentageUsed,
          percentageRemaining,
        };

        // Check if student has low hours (< 20%)
        if (percentageRemaining < 20 && percentageRemaining >= 0) {
          result.studentsWithLowHours.push(studentData);
          logger.warn('Student has low remaining hours', {
            studentId: student.id,
            remainingHours,
            percentageRemaining: percentageRemaining.toFixed(2),
          });
        }

        // Check if student exceeded their hours
        if (calculatedHours > student.totalAllowedHours) {
          result.studentsOverLimit.push(studentData);
          logger.warn('Student exceeded allowed hours', {
            studentId: student.id,
            usedHours: calculatedHours,
            allowedHours: student.totalAllowedHours,
            overage: calculatedHours - student.totalAllowedHours,
          });
        }
      } catch (error: any) {
        result.errors.push(`Error calculating hours for student ${student.id}: ${error.message}`);
        logger.error('Error calculating student hours', error, { studentId: student.id });
      }
    }

    result.success = result.errors.length === 0;

    logger.info('Hours calculation completed', {
      processed: result.studentsProcessed,
      updated: result.studentsUpdated,
      lowHours: result.studentsWithLowHours.length,
      overLimit: result.studentsOverLimit.length,
      errors: result.errors.length,
    });

    return result;
  } catch (error: any) {
    result.errors.push(`Fatal error during hours calculation: ${error.message}`);
    logger.error('Fatal error during hours calculation', error);
    return result;
  }
}

/**
 * Efficient batch calculation using raw SQL (alternative approach)
 */
export async function calculateStudentHoursBatch(prisma: any): Promise<CalculationResult> {
  const result: CalculationResult = {
    success: false,
    studentsProcessed: 0,
    studentsUpdated: 0,
    studentsWithLowHours: [],
    studentsOverLimit: [],
    totalHoursCalculated: 0,
    errors: [],
  };

  try {
    // Use raw SQL for efficient aggregation
    const bookingTotals = await prisma.$queryRaw<
      Array<{ studentId: string; totalMinutes: number }>
    >`
      SELECT "studentId", COALESCE(SUM(duration), 0) as "totalMinutes"
      FROM "Booking"
      WHERE status = 'COMPLETED'
      GROUP BY "studentId"
    `;

    // Create a map of student hours
    const studentHoursMap = new Map<string, number>();
    for (const record of bookingTotals) {
      const hours = Math.round((Number(record.totalMinutes) / 60) * 100) / 100;
      studentHoursMap.set(record.studentId, hours);
    }

    // Get all students
    const students = await prisma.student.findMany({
      select: {
        id: true,
        totalAllowedHours: true,
        usedHours: true,
      },
    });

    result.studentsProcessed = students.length;

    // Update students with calculated hours
    for (const student of students) {
      try {
        const calculatedHours = studentHoursMap.get(student.id) || 0;
        result.totalHoursCalculated += calculatedHours;

        // Update if changed
        if (calculatedHours !== student.usedHours) {
          await prisma.student.update({
            where: { id: student.id },
            data: { usedHours: calculatedHours },
          });
          result.studentsUpdated++;
        }

        // Check for warnings
        const remainingHours = student.totalAllowedHours - calculatedHours;
        const percentageRemaining = (remainingHours / student.totalAllowedHours) * 100;
        const percentageUsed = (calculatedHours / student.totalAllowedHours) * 100;

        const studentData: StudentHoursData = {
          studentId: student.id,
          totalAllowedHours: student.totalAllowedHours,
          usedHours: calculatedHours,
          remainingHours,
          percentageUsed,
          percentageRemaining,
        };

        if (percentageRemaining < 20 && percentageRemaining >= 0) {
          result.studentsWithLowHours.push(studentData);
        }

        if (calculatedHours > student.totalAllowedHours) {
          result.studentsOverLimit.push(studentData);
        }
      } catch (error: any) {
        result.errors.push(`Error updating student ${student.id}: ${error.message}`);
      }
    }

    result.success = result.errors.length === 0;
    return result;
  } catch (error: any) {
    result.errors.push(`Fatal error during batch calculation: ${error.message}`);
    logger.error('Fatal error during batch calculation', error);
    return result;
  }
}

/**
 * Send notifications to students with low or exceeded hours
 */
export async function sendHoursWarningNotifications(
  studentsWithLowHours: StudentHoursData[],
  studentsOverLimit: StudentHoursData[]
): Promise<void> {
  // TODO: Implement email notifications
  // This is a placeholder for future implementation

  if (studentsWithLowHours.length > 0) {
    logger.info(`${studentsWithLowHours.length} students have low remaining hours`);
    // await sendEmailToStudents(studentsWithLowHours, 'low-hours-warning');
  }

  if (studentsOverLimit.length > 0) {
    logger.warn(`${studentsOverLimit.length} students exceeded their allowed hours`);
    // await sendEmailToAdmins(studentsOverLimit, 'hours-exceeded-alert');
  }
}
