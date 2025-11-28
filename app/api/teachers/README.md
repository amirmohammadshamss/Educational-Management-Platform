# Teacher Management API

This directory contains API routes for managing teachers in the Educational Management Platform.

## Endpoints

### GET /api/teachers
Get a paginated list of all teachers.

**Authentication:** Required (Admin only)

**Permissions:** `READ_TEACHER`

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)
- `search`: Search by name or email (case-insensitive)
- `active`: Filter by active status (`true` or `false`)

**Example Request:**
```
GET /api/teachers?page=1&limit=20&search=john&active=true
```

**Success Response (200 OK):**
```json
{
  "teachers": [
    {
      "id": "teacher_id",
      "createdAt": "2025-11-28T00:00:00.000Z",
      "updatedAt": "2025-11-28T00:00:00.000Z",
      "user": {
        "id": "user_id",
        "name": "John Teacher",
        "email": "john.teacher@example.com",
        "active": true
      },
      "studentCount": 15,
      "bookingCount": 45,
      "homeworkCount": 30
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalCount": 25,
    "totalPages": 2,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

---

### GET /api/teachers/[id]
Get a single teacher with complete information.

**Authentication:** Required

**Permissions:**
- Teachers can view their own profile
- Admins can view any teacher with `READ_TEACHER` permission

**URL Parameters:**
- `id`: Teacher ID (CUID format)

**Success Response (200 OK):**
```json
{
  "teacher": {
    "id": "teacher_id",
    "createdAt": "2025-11-28T00:00:00.000Z",
    "updatedAt": "2025-11-28T00:00:00.000Z",
    "user": {
      "id": "user_id",
      "name": "John Teacher",
      "email": "john.teacher@example.com",
      "role": "TEACHER",
      "active": true,
      "createdAt": "2025-11-28T00:00:00.000Z",
      "updatedAt": "2025-11-28T00:00:00.000Z"
    },
    "students": [
      {
        "id": "assignment_id",
        "assignedAt": "2025-11-28T00:00:00.000Z",
        "student": {
          "id": "student_id",
          "governmentId": "FR123456789",
          "user": {
            "id": "user_id",
            "name": "Student Name",
            "email": "student@example.com",
            "active": true
          }
        }
      }
    ],
    "bookings": [
      {
        "id": "booking_id",
        "date": "2025-12-01T10:00:00.000Z",
        "duration": 2,
        "status": "SCHEDULED"
      }
    ],
    "homeworkAssigned": [
      {
        "id": "homework_id",
        "status": "PENDING",
        "submittedAt": "2025-11-28T00:00:00.000Z",
        "reviewedAt": null
      }
    ],
    "statistics": {
      "studentCount": 15,
      "homeworkStats": {
        "total": 30,
        "pending": 10,
        "approved": 15,
        "rejected": 3,
        "needsRevision": 2
      },
      "bookingStats": {
        "total": 45,
        "upcoming": 12,
        "past": 33
      }
    }
  }
}
```

**Features:**
- Complete user data
- List of assigned students
- Last 10 bookings
- Last 10 homework assignments
- Calculated statistics

---

### GET /api/teachers/[id]/students
Get all students assigned to a teacher.

**Authentication:** Required

**Permissions:**
- Teachers can view their own students
- Admins can view any teacher's students

**URL Parameters:**
- `id`: Teacher ID (CUID format)

**Success Response (200 OK):**
```json
{
  "teacher": {
    "id": "teacher_id",
    "name": "John Teacher"
  },
  "students": [
    {
      "assignmentId": "assignment_id",
      "assignedAt": "2025-11-28T00:00:00.000Z",
      "student": {
        "id": "student_id",
        "governmentId": "FR123456789",
        "totalAllowedHours": 100,
        "usedHours": 25,
        "remainingHours": 75,
        "user": {
          "id": "user_id",
          "name": "Student Name",
          "email": "student@example.com",
          "active": true
        },
        "recentBookings": [
          {
            "id": "booking_id",
            "date": "2025-12-01T10:00:00.000Z",
            "duration": 2,
            "status": "SCHEDULED"
          }
        ]
      }
    }
  ],
  "totalStudents": 15
}
```

**Features:**
- All assigned students
- Student hours information
- Last 5 bookings with this teacher for each student
- Calculated remaining hours

---

### POST /api/teachers/[id]/students/[studentId]
Assign a student to a teacher.

**Authentication:** Required

**Permissions:**
- Teachers can assign students to themselves
- Admins can assign students to any teacher

**URL Parameters:**
- `id`: Teacher ID (CUID format)
- `studentId`: Student ID (CUID format)

**Success Response (201 Created):**
```json
{
  "message": "Student assigned to teacher successfully",
  "assignment": {
    "id": "assignment_id",
    "assignedAt": "2025-11-28T00:00:00.000Z",
    "teacherName": "John Teacher",
    "studentName": "Student Name"
  }
}
```

**Validations:**
- Teacher must exist and be active
- Student must exist and be active
- Assignment must not already exist

**Error Responses:**
- `400 Bad Request`: Invalid ID or inactive user
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Teacher or student not found
- `409 Conflict`: Assignment already exists
- `500 Internal Server Error`: Server error

---

### GET /api/teachers/[id]/schedule
Get a teacher's schedule/bookings.

**Authentication:** Required

**Permissions:**
- Teachers can view their own schedule
- Admins can view any teacher's schedule

**URL Parameters:**
- `id`: Teacher ID (CUID format)

**Query Parameters:**
- `startDate`: Filter bookings from this date (ISO 8601 format)
- `endDate`: Filter bookings until this date (ISO 8601 format)
- `status`: Filter by booking status (`SCHEDULED`, `COMPLETED`, `CANCELLED`, `NO_SHOW`)

**Example Request:**
```
GET /api/teachers/teacher_id/schedule?startDate=2025-12-01&endDate=2025-12-31&status=SCHEDULED
```

**Success Response (200 OK):**
```json
{
  "teacher": {
    "id": "teacher_id",
    "name": "John Teacher",
    "email": "john.teacher@example.com"
  },
  "schedule": [
    {
      "id": "booking_id",
      "date": "2025-12-01T10:00:00.000Z",
      "duration": 2,
      "status": "SCHEDULED",
      "source": "booking_api",
      "createdAt": "2025-11-28T00:00:00.000Z",
      "student": {
        "id": "student_id",
        "governmentId": "FR123456789",
        "name": "Student Name",
        "email": "student@example.com"
      }
    }
  ],
  "summary": {
    "totalBookings": 45,
    "upcomingBookings": 12,
    "completedBookings": 30,
    "cancelledBookings": 3,
    "totalHours": 90,
    "completedHours": 60
  },
  "filters": {
    "startDate": "2025-12-01",
    "endDate": "2025-12-31",
    "status": "SCHEDULED"
  }
}
```

**Features:**
- All bookings in date range
- Student information for each booking
- Summary statistics
- Hours calculations
- Applied filters shown in response

---

## Security

All routes implement:
- **Authentication**: NextAuth session validation
- **Authorization**: Role-based permission checks
- **Input Validation**: Zod schema validation
- **Access Control**: Resource ownership verification
- **SQL Injection Protection**: Prisma ORM parameterized queries

## Access Control Summary

| Endpoint | Teacher (Own) | Teacher (Others) | Admin |
|----------|---------------|------------------|-------|
| GET /api/teachers | ✗ | ✗ | ✓ |
| GET /api/teachers/[id] | ✓ | ✗ | ✓ |
| GET /api/teachers/[id]/students | ✓ | ✗ | ✓ |
| POST /api/teachers/[id]/students/[studentId] | ✓ | ✗ | ✓ |
| GET /api/teachers/[id]/schedule | ✓ | ✗ | ✓ |

## Usage Examples

### List All Teachers (Admin)
```bash
curl "http://localhost:3000/api/teachers?page=1&limit=20" \
  -H "Cookie: session_token=..."
```

### Search Teachers
```bash
curl "http://localhost:3000/api/teachers?search=john&active=true" \
  -H "Cookie: session_token=..."
```

### Get Teacher Details
```bash
curl "http://localhost:3000/api/teachers/teacher_id" \
  -H "Cookie: session_token=..."
```

### Get My Students (Teacher)
```bash
curl "http://localhost:3000/api/teachers/my_teacher_id/students" \
  -H "Cookie: session_token=..."
```

### Assign Student to Myself (Teacher)
```bash
curl -X POST "http://localhost:3000/api/teachers/my_teacher_id/students/student_id" \
  -H "Cookie: session_token=..."
```

### Get My Schedule (Teacher)
```bash
curl "http://localhost:3000/api/teachers/my_teacher_id/schedule" \
  -H "Cookie: session_token=..."
```

### Get Schedule with Date Range
```bash
curl "http://localhost:3000/api/teachers/teacher_id/schedule?startDate=2025-12-01&endDate=2025-12-31&status=SCHEDULED" \
  -H "Cookie: session_token=..."
```

---

## Related Documentation

- [RBAC Guide](../../../RBAC_GUIDE.md) - Role-based access control
- [Student Management API](../students/README.md) - Student management endpoints
- [User Management API](../users/README.md) - User management endpoints
- [Prisma Schema](../../../prisma/schema.prisma) - Database models
