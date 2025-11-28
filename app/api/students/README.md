# Student Management API

This directory contains API routes for managing students in the Educational Management Platform.

## Endpoints

### GET /api/students
Get a paginated list of all students.

**Authentication:** Required (Admin or Teacher)

**Permissions:** `READ_STUDENT` or ADMIN/TEACHER role

**Access Control:**
- Admins see all students
- Teachers see only assigned students

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)
- `search`: Search by name, email, or governmentId (case-insensitive)
- `active`: Filter by active status (`true` or `false`)

**Example Request:**
```
GET /api/students?page=1&limit=20&search=john&active=true
```

**Success Response (200 OK):**
```json
{
  "students": [
    {
      "id": "student_id",
      "governmentId": "FR123456789",
      "totalAllowedHours": 100,
      "usedHours": 25,
      "remainingHours": 75,
      "createdAt": "2025-11-28T00:00:00.000Z",
      "updatedAt": "2025-11-28T00:00:00.000Z",
      "user": {
        "id": "user_id",
        "name": "John Student",
        "email": "john.student@example.com",
        "active": true
      },
      "teachers": [
        {
          "id": "assignment_id",
          "assignedAt": "2025-11-28T00:00:00.000Z",
          "teacher": {
            "id": "teacher_id",
            "user": {
              "id": "user_id",
              "name": "Teacher Name",
              "email": "teacher@example.com"
            }
          }
        }
      ]
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

**Error Responses:**
- `400 Bad Request`: Invalid query parameters
- `403 Forbidden`: Insufficient permissions
- `500 Internal Server Error`: Server error

---

### GET /api/students/[id]
Get a single student with complete information.

**Authentication:** Required

**Permissions:**
- Students can view their own profile
- Teachers can view assigned students
- Admins can view any student with `READ_STUDENT` permission

**URL Parameters:**
- `id`: Student ID (CUID format)

**Success Response (200 OK):**
```json
{
  "student": {
    "id": "student_id",
    "governmentId": "FR123456789",
    "totalAllowedHours": 100,
    "usedHours": 25,
    "calculatedUsedHours": 24.5,
    "remainingHours": 75,
    "createdAt": "2025-11-28T00:00:00.000Z",
    "updatedAt": "2025-11-28T00:00:00.000Z",
    "user": {
      "id": "user_id",
      "name": "John Student",
      "email": "john.student@example.com",
      "role": "STUDENT",
      "active": true,
      "createdAt": "2025-11-28T00:00:00.000Z",
      "updatedAt": "2025-11-28T00:00:00.000Z"
    },
    "teachers": [
      {
        "id": "assignment_id",
        "assignedAt": "2025-11-28T00:00:00.000Z",
        "teacher": {
          "id": "teacher_id",
          "user": {
            "id": "user_id",
            "name": "Teacher Name",
            "email": "teacher@example.com",
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
        "status": "SCHEDULED",
        "source": "booking_api",
        "createdAt": "2025-11-28T00:00:00.000Z",
        "teacher": {
          "id": "teacher_id",
          "user": {
            "id": "user_id",
            "name": "Teacher Name"
          }
        }
      }
    ],
    "homeworkSubmitted": [
      {
        "id": "homework_id",
        "fileName": "assignment.pdf",
        "fileSize": 1024000,
        "status": "PENDING",
        "feedback": null,
        "submittedAt": "2025-11-28T00:00:00.000Z",
        "reviewedAt": null,
        "teacher": {
          "id": "teacher_id",
          "user": {
            "id": "user_id",
            "name": "Teacher Name"
          }
        }
      }
    ]
  }
}
```

**Features:**
- Includes last 20 bookings
- Includes last 10 homework submissions
- Calculates used hours from completed bookings
- Shows assigned teachers

**Error Responses:**
- `400 Bad Request`: Invalid student ID format
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Student not found
- `500 Internal Server Error`: Server error

---

### PATCH /api/students/[id]
Update student information.

**Authentication:** Required (Admin only)

**Permissions:** `UPDATE_STUDENT`

**URL Parameters:**
- `id`: Student ID (CUID format)

**Request Body (all fields optional):**
```json
{
  "governmentId": "FR987654321",
  "totalAllowedHours": 120
}
```

**Validation Rules:**
- `governmentId`: Max 50 characters, must be unique
- `totalAllowedHours`: Minimum 0, maximum 10000

**Success Response (200 OK):**
```json
{
  "message": "Student updated successfully",
  "student": {
    "id": "student_id",
    "governmentId": "FR987654321",
    "totalAllowedHours": 120,
    "usedHours": 25,
    "remainingHours": 95,
    "createdAt": "2025-11-28T00:00:00.000Z",
    "updatedAt": "2025-11-28T01:00:00.000Z",
    "user": {
      "id": "user_id",
      "name": "John Student",
      "email": "john.student@example.com",
      "active": true
    }
  }
}
```

**Error Responses:**
- `400 Bad Request`: Validation error
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Student not found
- `409 Conflict`: Government ID already in use
- `500 Internal Server Error`: Server error

---

### POST /api/students/[id]/assign-teacher
Assign a teacher to a student.

**Authentication:** Required (Teacher or Admin)

**Permissions:** `ASSIGN_STUDENT` or teacher assigning themselves

**Access Control:**
- Teachers can assign themselves to students
- Admins can assign any teacher to any student

**URL Parameters:**
- `id`: Student ID (CUID format)

**Request Body:**
```json
{
  "teacherId": "teacher_id"
}
```

**Success Response (201 Created):**
```json
{
  "message": "Teacher assigned to student successfully",
  "assignment": {
    "id": "assignment_id",
    "assignedAt": "2025-11-28T00:00:00.000Z",
    "student": {
      "id": "student_id",
      "name": "John Student",
      "email": "john.student@example.com"
    },
    "teacher": {
      "id": "teacher_id",
      "name": "Teacher Name",
      "email": "teacher@example.com"
    }
  }
}
```

**Validations:**
- Student must exist and be active
- Teacher must exist and be active
- Assignment must not already exist

**Error Responses:**
- `400 Bad Request`: Validation error or inactive user
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Student or teacher not found
- `409 Conflict`: Teacher already assigned to student
- `500 Internal Server Error`: Server error

---

### DELETE /api/students/[id]/teachers/[teacherId]
Remove a teacher assignment from a student.

**Authentication:** Required (Teacher or Admin)

**Permissions:** `ASSIGN_STUDENT` or teacher removing themselves

**Access Control:**
- Teachers can remove themselves from students
- Admins can remove any teacher assignment

**URL Parameters:**
- `id`: Student ID (CUID format)
- `teacherId`: Teacher ID (CUID format)

**Success Response (200 OK):**
```json
{
  "message": "Teacher assignment removed successfully",
  "details": {
    "studentName": "John Student",
    "teacherName": "Teacher Name"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid ID format
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Assignment not found
- `500 Internal Server Error`: Server error

---

### GET /api/students/[id]/hours
Get detailed hours breakdown for a student.

**Authentication:** Required

**Permissions:**
- Students can view their own hours
- Teachers can view assigned students' hours
- Admins can view any student's hours

**URL Parameters:**
- `id`: Student ID (CUID format)

**Success Response (200 OK):**
```json
{
  "student": {
    "id": "student_id",
    "name": "John Student",
    "governmentId": "FR123456789"
  },
  "hours": {
    "totalAllowed": 100,
    "used": 25,
    "remaining": 75,
    "completed": 24,
    "scheduled": 10,
    "available": 66
  },
  "breakdownByTeacher": [
    {
      "teacher": {
        "id": "teacher_id",
        "name": "Teacher Name",
        "email": "teacher@example.com"
      },
      "hours": {
        "completed": 20,
        "scheduled": 8,
        "cancelled": 2,
        "total": 28
      },
      "bookingsCount": 15
    }
  ],
  "recentBookings": [
    {
      "id": "booking_id",
      "date": "2025-12-01T10:00:00.000Z",
      "duration": 2,
      "status": "SCHEDULED",
      "source": "booking_api",
      "teacher": {
        "id": "teacher_id",
        "user": {
          "id": "user_id",
          "name": "Teacher Name"
        }
      }
    }
  ],
  "summary": {
    "totalBookings": 10,
    "activeTeachers": 2,
    "utilizationPercentage": "25.00"
  }
}
```

**Features:**
- Total allowed, used, and remaining hours
- Breakdown by teacher (completed, scheduled, cancelled)
- Last 10 recent bookings
- Utilization percentage
- Active teachers count

**Error Responses:**
- `400 Bad Request`: Invalid student ID format
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Student not found
- `500 Internal Server Error`: Server error

---

## Security

All routes implement:
- **Authentication**: NextAuth session validation
- **Authorization**: Role-based permission checks
- **Input Validation**: Zod schema validation
- **Access Control**: Resource ownership verification
- **SQL Injection Protection**: Prisma ORM parameterized queries

## Hours Calculation

The system tracks hours in multiple ways:

1. **totalAllowedHours**: Set manually by admins (from Government API)
2. **usedHours**: Stored field, can be synced from bookings
3. **calculatedUsedHours**: Real-time calculation from completed bookings
4. **remainingHours**: `totalAllowedHours - usedHours`
5. **available**: `totalAllowedHours - completed - scheduled`

## Usage Examples

### List All Students (Admin)
```bash
curl "http://localhost:3000/api/students?page=1&limit=20" \
  -H "Cookie: session_token=..."
```

### List My Students (Teacher)
```bash
curl "http://localhost:3000/api/students" \
  -H "Cookie: session_token=..."
# Automatically filtered to assigned students
```

### Search Students
```bash
curl "http://localhost:3000/api/students?search=john&active=true" \
  -H "Cookie: session_token=..."
```

### Get Student Details
```bash
curl "http://localhost:3000/api/students/student_id" \
  -H "Cookie: session_token=..."
```

### Update Student
```bash
curl -X PATCH "http://localhost:3000/api/students/student_id" \
  -H "Content-Type: application/json" \
  -H "Cookie: session_token=..." \
  -d '{
    "governmentId": "FR987654321",
    "totalAllowedHours": 120
  }'
```

### Assign Teacher
```bash
curl -X POST "http://localhost:3000/api/students/student_id/assign-teacher" \
  -H "Content-Type: application/json" \
  -H "Cookie: session_token=..." \
  -d '{
    "teacherId": "teacher_id"
  }'
```

### Remove Teacher Assignment
```bash
curl -X DELETE "http://localhost:3000/api/students/student_id/teachers/teacher_id" \
  -H "Cookie: session_token=..."
```

### Get Hours Breakdown
```bash
curl "http://localhost:3000/api/students/student_id/hours" \
  -H "Cookie: session_token=..."
```

---

## Related Documentation

- [RBAC Guide](../../../RBAC_GUIDE.md) - Role-based access control
- [User Management API](../users/README.md) - User management endpoints
- [Prisma Schema](../../../prisma/schema.prisma) - Database models
