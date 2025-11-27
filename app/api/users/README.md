# User Management API

This directory contains API routes for managing users in the Educational Management Platform.

## Endpoints

### POST /api/users
Create a new user account.

**Authentication:** Required (Admin or Super Admin)

**Permissions:** `CREATE_USER`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "SecurePass123",
  "role": "TEACHER",
  "governmentId": "FR123456789" // Required only for STUDENT role
}
```

**Validation Rules:**
- `name`: Required, max 100 characters
- `email`: Required, valid email format, unique
- `password`: Minimum 8 characters, must contain uppercase, lowercase, and number
- `role`: One of: `SUPER_ADMIN`, `ADMIN`, `TEACHER`, `STUDENT`
- `governmentId`: Required for STUDENT role, unique

**Success Response (201 Created):**
```json
{
  "message": "User created successfully",
  "user": {
    "id": "cuid123",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "role": "TEACHER",
    "active": true,
    "createdAt": "2025-11-28T00:00:00.000Z",
    "updatedAt": "2025-11-28T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Validation error or duplicate email/governmentId
- `403 Forbidden`: Insufficient permissions
- `409 Conflict`: Email or governmentId already exists
- `500 Internal Server Error`: Server error

**Automatic Record Creation:**
- Creates corresponding `Teacher` record for TEACHER role
- Creates corresponding `Student` record for STUDENT role

---

### GET /api/users
Get a paginated list of all users.

**Authentication:** Required (Admin or Super Admin)

**Permissions:** `READ_USER`

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)
- `role`: Filter by role (`SUPER_ADMIN`, `ADMIN`, `TEACHER`, `STUDENT`)
- `search`: Search by name or email (case-insensitive)
- `active`: Filter by active status (`true` or `false`)

**Example Request:**
```
GET /api/users?page=1&limit=20&role=TEACHER&search=john&active=true
```

**Success Response (200 OK):**
```json
{
  "users": [
    {
      "id": "cuid123",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "role": "TEACHER",
      "active": true,
      "createdAt": "2025-11-28T00:00:00.000Z",
      "updatedAt": "2025-11-28T00:00:00.000Z",
      "teacher": {
        "id": "cuid456"
      },
      "student": null
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

### GET /api/users/[id]
Get a single user by ID with related data.

**Authentication:** Required

**Permissions:**
- Users can view their own profile
- Admins can view any user with `READ_USER` permission

**URL Parameters:**
- `id`: User ID (CUID format)

**Success Response (200 OK):**

For a Teacher:
```json
{
  "user": {
    "id": "cuid123",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "role": "TEACHER",
    "active": true,
    "createdAt": "2025-11-28T00:00:00.000Z",
    "updatedAt": "2025-11-28T00:00:00.000Z",
    "teacher": {
      "id": "cuid456",
      "createdAt": "2025-11-28T00:00:00.000Z",
      "updatedAt": "2025-11-28T00:00:00.000Z",
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
      ]
    },
    "student": null
  }
}
```

For a Student:
```json
{
  "user": {
    "id": "cuid123",
    "name": "Jane Smith",
    "email": "jane.smith@example.com",
    "role": "STUDENT",
    "active": true,
    "createdAt": "2025-11-28T00:00:00.000Z",
    "updatedAt": "2025-11-28T00:00:00.000Z",
    "teacher": null,
    "student": {
      "id": "cuid789",
      "governmentId": "FR987654321",
      "totalAllowedHours": 100,
      "usedHours": 25,
      "createdAt": "2025-11-28T00:00:00.000Z",
      "updatedAt": "2025-11-28T00:00:00.000Z",
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
          "status": "SCHEDULED"
        }
      ]
    }
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid user ID format
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: User not found
- `500 Internal Server Error`: Server error

---

### PATCH /api/users/[id]
Update user information.

**Authentication:** Required

**Permissions:**
- Users can update their own `name` and `email`
- Admins can update any user with `UPDATE_USER` permission
- Only users with `MANAGE_USERS` permission can change roles

**URL Parameters:**
- `id`: User ID (CUID format)

**Request Body (all fields optional):**
```json
{
  "name": "Updated Name",
  "email": "updated.email@example.com",
  "active": false,
  "role": "ADMIN"
}
```

**Restrictions:**
- Users cannot change their own `active` status or `role`
- Admins cannot change roles of SUPER_ADMIN users (only SUPER_ADMIN can)
- Email must be unique if changed

**Success Response (200 OK):**
```json
{
  "message": "User updated successfully",
  "user": {
    "id": "cuid123",
    "name": "Updated Name",
    "email": "updated.email@example.com",
    "role": "TEACHER",
    "active": true,
    "createdAt": "2025-11-28T00:00:00.000Z",
    "updatedAt": "2025-11-28T01:00:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Validation error or invalid operation
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: User not found
- `409 Conflict`: Email already in use
- `500 Internal Server Error`: Server error

---

### DELETE /api/users/[id]
Soft delete a user (deactivate).

**Authentication:** Required (Admin or Super Admin)

**Permissions:** `DELETE_USER`

**URL Parameters:**
- `id`: User ID (CUID format)

**Behavior:**
- Sets `active` to `false` for the user
- Related Teacher/Student records remain (implicitly inactive when user is inactive)
- Does not permanently delete data
- Users cannot delete themselves

**Restrictions:**
- Super Admins can delete any user
- Admins can delete any user except SUPER_ADMIN
- Users cannot delete themselves

**Success Response (200 OK):**
```json
{
  "message": "User deactivated successfully"
}
```

**Error Responses:**
- `400 Bad Request`: Cannot delete own account
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: User not found
- `500 Internal Server Error`: Server error

---

## Security

All routes implement:
- **Authentication**: NextAuth session validation
- **Authorization**: Role-based permission checks
- **Input Validation**: Zod schema validation
- **Password Security**: Bcrypt hashing with 12 salt rounds
- **SQL Injection Protection**: Prisma ORM parameterized queries

## Data Consistency

User creation uses database transactions to ensure:
- User record is created
- Corresponding Teacher/Student record is created
- Rollback on any error

## Error Handling

All routes return consistent error formats:

**Validation Error:**
```json
{
  "error": "Validation error",
  "details": [
    {
      "field": "email",
      "message": "Please enter a valid email address"
    }
  ]
}
```

**Generic Error:**
```json
{
  "error": "Error message here"
}
```

## Usage Examples

### Create a Teacher
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Cookie: session_token=..." \
  -d '{
    "name": "John Teacher",
    "email": "john.teacher@example.com",
    "password": "SecurePass123",
    "role": "TEACHER"
  }'
```

### Create a Student
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Cookie: session_token=..." \
  -d '{
    "name": "Jane Student",
    "email": "jane.student@example.com",
    "password": "SecurePass123",
    "role": "STUDENT",
    "governmentId": "FR123456789"
  }'
```

### List Active Teachers
```bash
curl "http://localhost:3000/api/users?role=TEACHER&active=true&page=1&limit=20" \
  -H "Cookie: session_token=..."
```

### Search Users
```bash
curl "http://localhost:3000/api/users?search=john&page=1&limit=10" \
  -H "Cookie: session_token=..."
```

### Get User Details
```bash
curl http://localhost:3000/api/users/cuid123 \
  -H "Cookie: session_token=..."
```

### Update User
```bash
curl -X PATCH http://localhost:3000/api/users/cuid123 \
  -H "Content-Type: application/json" \
  -H "Cookie: session_token=..." \
  -d '{
    "name": "Updated Name",
    "email": "new.email@example.com"
  }'
```

### Deactivate User
```bash
curl -X DELETE http://localhost:3000/api/users/cuid123 \
  -H "Cookie: session_token=..."
```

---

## Related Documentation

- [RBAC Guide](../../../RBAC_GUIDE.md) - Role-based access control
- [Authentication Guide](../../../components/auth/README.md) - Authentication system
- [Prisma Schema](../../../prisma/schema.prisma) - Database models
