# Booking Management API

This directory contains API routes for managing lesson bookings in the Educational Management Platform.

## Endpoints

### GET /api/bookings
Get a paginated list of all bookings with filtering options.

**Authentication:** Required

**Permissions:**
- Admins can view all bookings
- Teachers can view only their own bookings
- Students can view only their own bookings

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)
- `startDate`: Filter bookings from this date (ISO 8601 format)
- `endDate`: Filter bookings until this date (ISO 8601 format)
- `studentId`: Filter by student ID (Admin only)
- `teacherId`: Filter by teacher ID (Admin only)
- `status`: Filter by booking status (`SCHEDULED`, `COMPLETED`, `CANCELLED`, `NO_SHOW`)

**Example Request:**
```
GET /api/bookings?page=1&limit=20&startDate=2025-12-01&endDate=2025-12-31&status=SCHEDULED
```

**Success Response (200 OK):**
```json
{
  "bookings": [
    {
      "id": "booking_id",
      "date": "2025-12-01T10:00:00.000Z",
      "duration": 2,
      "status": "SCHEDULED",
      "source": "booking_api",
      "createdAt": "2025-11-28T00:00:00.000Z",
      "updatedAt": "2025-11-28T00:00:00.000Z",
      "student": {
        "id": "student_id",
        "governmentId": "FR123456789",
        "name": "Student Name",
        "email": "student@example.com"
      },
      "teacher": {
        "id": "teacher_id",
        "name": "Teacher Name",
        "email": "teacher@example.com"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalCount": 45,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

---

### GET /api/bookings/[id]
Get a single booking with complete information.

**Authentication:** Required

**Permissions:**
- Admins can view any booking
- Teachers can view bookings they are involved in
- Students can view bookings they are involved in

**URL Parameters:**
- `id`: Booking ID (CUID format)

**Success Response (200 OK):**
```json
{
  "booking": {
    "id": "booking_id",
    "date": "2025-12-01T10:00:00.000Z",
    "duration": 2,
    "status": "SCHEDULED",
    "source": "booking_api",
    "createdAt": "2025-11-28T00:00:00.000Z",
    "updatedAt": "2025-11-28T00:00:00.000Z",
    "student": {
      "id": "student_id",
      "governmentId": "FR123456789",
      "name": "Student Name",
      "email": "student@example.com",
      "active": true
    },
    "teacher": {
      "id": "teacher_id",
      "name": "Teacher Name",
      "email": "teacher@example.com",
      "active": true
    }
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid booking ID format
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Booking not found
- `500 Internal Server Error`: Server error

---

### POST /api/bookings
Create a new manual booking.

**Authentication:** Required

**Permissions:**
- Admins can create bookings
- Teachers can create bookings

**Request Body:**
```json
{
  "studentId": "student_id",
  "teacherId": "teacher_id",
  "date": "2025-12-01T10:00:00.000Z",
  "duration": 2
}
```

**Validations:**
- Date must be in the future
- Duration must be between 1 and 8 hours
- Student must exist and be active
- Teacher must exist and be active
- Student must have enough remaining hours

**Success Response (201 Created):**
```json
{
  "message": "Booking created successfully",
  "booking": {
    "id": "booking_id",
    "date": "2025-12-01T10:00:00.000Z",
    "duration": 2,
    "status": "SCHEDULED",
    "source": "manual",
    "student": {
      "id": "student_id",
      "name": "Student Name",
      "email": "student@example.com"
    },
    "teacher": {
      "id": "teacher_id",
      "name": "Teacher Name",
      "email": "teacher@example.com"
    }
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid data or insufficient hours
  ```json
  {
    "error": "Student does not have enough remaining hours",
    "details": {
      "totalAllowedHours": 100,
      "usedHours": 95,
      "remainingHours": 5,
      "requiredHours": 10
    }
  }
  ```
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Student or teacher not found
- `500 Internal Server Error`: Server error

---

### PATCH /api/bookings/[id]
Update a booking (Admin only).

**Authentication:** Required

**Permissions:** Admin only

**URL Parameters:**
- `id`: Booking ID (CUID format)

**Request Body:**
```json
{
  "date": "2025-12-02T14:00:00.000Z",
  "duration": 3,
  "status": "COMPLETED"
}
```

All fields are optional. Only include fields you want to update.

**Features:**
- Updates booking details
- Recalculates student used hours if duration or status changes
- Updates student `usedHours` field based on completed bookings

**Success Response (200 OK):**
```json
{
  "message": "Booking updated successfully",
  "booking": {
    "id": "booking_id",
    "date": "2025-12-02T14:00:00.000Z",
    "duration": 3,
    "status": "COMPLETED",
    "source": "manual",
    "student": {
      "id": "student_id",
      "name": "Student Name"
    },
    "teacher": {
      "id": "teacher_id",
      "name": "Teacher Name"
    }
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid data
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Booking not found
- `500 Internal Server Error`: Server error

---

### DELETE /api/bookings/[id]
Cancel a booking (soft delete) - Admin only.

**Authentication:** Required

**Permissions:** Admin only

**URL Parameters:**
- `id`: Booking ID (CUID format)

**Features:**
- Sets booking status to `CANCELLED`
- Recalculates student used hours (excludes cancelled bookings)
- Does not physically delete the booking record

**Success Response (200 OK):**
```json
{
  "message": "Booking cancelled successfully",
  "bookingId": "booking_id"
}
```

**Error Responses:**
- `400 Bad Request`: Booking already cancelled or invalid ID
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Booking not found
- `500 Internal Server Error`: Server error

---

### GET /api/bookings/today
Get all bookings for today (dashboard endpoint).

**Authentication:** Required

**Permissions:**
- Admins can see all today's bookings
- Teachers can see only their own bookings for today
- Students can see only their own bookings for today

**Success Response (200 OK):**
```json
{
  "date": "2025-11-28",
  "bookings": [
    {
      "id": "booking_id",
      "date": "2025-11-28T10:00:00.000Z",
      "duration": 2,
      "status": "SCHEDULED",
      "source": "booking_api",
      "student": {
        "id": "student_id",
        "governmentId": "FR123456789",
        "name": "Student Name",
        "email": "student@example.com"
      },
      "teacher": {
        "id": "teacher_id",
        "name": "Teacher Name",
        "email": "teacher@example.com"
      }
    }
  ],
  "summary": {
    "total": 5,
    "upcoming": 3,
    "completed": 2,
    "totalHours": 10
  }
}
```

**Features:**
- Returns all bookings for the current date
- Sorted by time (earliest first)
- Includes summary statistics
- Primarily used for dashboard display

---

## Security

All routes implement:
- **Authentication**: NextAuth session validation
- **Authorization**: Role-based permission checks
- **Input Validation**: Zod schema validation
- **Access Control**: Resource ownership verification
- **SQL Injection Protection**: Prisma ORM parameterized queries

## Access Control Summary

| Endpoint | Student | Teacher | Admin |
|----------|---------|---------|-------|
| GET /api/bookings | ✓ (own) | ✓ (own) | ✓ (all) |
| GET /api/bookings/[id] | ✓ (own) | ✓ (own) | ✓ (all) |
| POST /api/bookings | ✗ | ✓ | ✓ |
| PATCH /api/bookings/[id] | ✗ | ✗ | ✓ |
| DELETE /api/bookings/[id] | ✗ | ✗ | ✓ |
| GET /api/bookings/today | ✓ (own) | ✓ (own) | ✓ (all) |

## Business Logic

### Hours Calculation
When a booking is created, updated, or cancelled, the student's `usedHours` field is automatically recalculated based on all **COMPLETED** bookings:

```typescript
const completedBookings = await prisma.booking.findMany({
  where: {
    studentId,
    status: BookingStatus.COMPLETED,
  },
  select: { duration: true },
});

const totalUsedHours = completedBookings.reduce((sum, b) => sum + b.duration, 0);

await prisma.student.update({
  where: { id: studentId },
  data: { usedHours: totalUsedHours },
});
```

### Booking Status Flow
1. **SCHEDULED**: Booking is created (manual or from API sync)
2. **COMPLETED**: Lesson was completed successfully (counts toward used hours)
3. **CANCELLED**: Booking was cancelled (does not count toward used hours)
4. **NO_SHOW**: Student did not attend (configurable whether it counts toward used hours)

### Validation Rules
- **Date**: Must be valid ISO 8601 format and in the future (for creation)
- **Duration**: Integer between 1 and 8 hours
- **Student Hours**: Student must have enough remaining hours before booking creation
- **User Active Status**: Both student and teacher must be active users

## Usage Examples

### List All Bookings (Admin)
```bash
curl "http://localhost:3000/api/bookings?page=1&limit=20" \
  -H "Cookie: session_token=..."
```

### Filter Bookings by Date Range
```bash
curl "http://localhost:3000/api/bookings?startDate=2025-12-01&endDate=2025-12-31" \
  -H "Cookie: session_token=..."
```

### Get Single Booking
```bash
curl "http://localhost:3000/api/bookings/booking_id" \
  -H "Cookie: session_token=..."
```

### Create Manual Booking
```bash
curl -X POST "http://localhost:3000/api/bookings" \
  -H "Content-Type: application/json" \
  -H "Cookie: session_token=..." \
  -d '{
    "studentId": "student_id",
    "teacherId": "teacher_id",
    "date": "2025-12-01T10:00:00.000Z",
    "duration": 2
  }'
```

### Update Booking (Admin)
```bash
curl -X PATCH "http://localhost:3000/api/bookings/booking_id" \
  -H "Content-Type: application/json" \
  -H "Cookie: session_token=..." \
  -d '{
    "status": "COMPLETED",
    "duration": 3
  }'
```

### Cancel Booking (Admin)
```bash
curl -X DELETE "http://localhost:3000/api/bookings/booking_id" \
  -H "Cookie: session_token=..."
```

### Get Today's Bookings
```bash
curl "http://localhost:3000/api/bookings/today" \
  -H "Cookie: session_token=..."
```

---

## Related Documentation

- [RBAC Guide](../../../RBAC_GUIDE.md) - Role-based access control
- [Student Management API](../students/README.md) - Student management endpoints
- [Teacher Management API](../teachers/README.md) - Teacher management endpoints
- [User Management API](../users/README.md) - User management endpoints
- [Prisma Schema](../../../prisma/schema.prisma) - Database models

## Integration Notes

### External Booking API Sync
Bookings created via the external Booking API sync will have:
- `source`: `"booking_api"` (vs `"manual"` for manually created bookings)
- Automatic creation without manual validation (sync job handles validation)
- Status determined by the external API

### Cron Job Integration
The booking sync cron job (`/api/cron/sync-bookings`) will:
1. Fetch bookings from external API
2. Upsert bookings to database (update if exists, create if new)
3. Update student `usedHours` based on completed bookings
4. Create sync log entries

See [Cron Jobs Documentation](../cron/README.md) for more details.
