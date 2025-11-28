# External API Integrations

This directory contains integration endpoints for synchronizing data with external APIs.

## Overview

The Educational Management Platform integrates with two external APIs:
1. **Booking API** - Provides scheduled lesson bookings
2. **French Government API** - Provides authorized training hours per student

These integrations ensure that the platform has up-to-date information from external systems.

---

## Booking API Integration

### GET /api/integrations/booking-sync

Synchronizes lesson bookings from the external Booking API to the local database.

**Authentication:** Required (Cron secret or admin token)

**Purpose:**
- Fetches all bookings from external API
- Creates new bookings or updates existing ones
- Updates student `usedHours` based on completed bookings
- Creates sync log entries for monitoring

**Authorization:**
```
Authorization: Bearer <CRON_SECRET>
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "summary": {
    "totalProcessed": 100,
    "created": 25,
    "updated": 65,
    "skipped": 8,
    "errors": 2,
    "duration": 3456,
    "studentsUpdated": 42
  },
  "details": [
    {
      "bookingId": "ext_booking_001",
      "action": "created"
    },
    {
      "bookingId": "ext_booking_002",
      "action": "updated"
    },
    {
      "bookingId": "ext_booking_003",
      "action": "skipped",
      "message": "Student not found with government ID: FR999999999"
    },
    {
      "bookingId": "ext_booking_004",
      "action": "error",
      "message": "Validation failed: Invalid durationHours"
    }
  ]
}
```

**Error Response (401 Unauthorized):**
```json
{
  "error": "Unauthorized"
}
```

**Error Response (500 Internal Server Error):**
```json
{
  "error": "Failed to fetch bookings from external API",
  "details": "Connection timeout after 30 seconds"
}
```

---

## External Booking API Data Format

The external Booking API returns data in the following format:

```typescript
interface ExternalBooking {
  bookingId: string;              // Unique identifier from external system
  studentGovernmentId: string;    // French government ID for student lookup
  teacherEmail: string;           // Teacher email for lookup
  scheduledDate: string;          // ISO 8601 format
  durationHours: number;          // Duration in hours (1-24)
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  createdAt: string;              // ISO 8601 format
  updatedAt?: string;             // ISO 8601 format (optional)
}
```

**External API Response:**
```json
{
  "success": true,
  "data": [
    {
      "bookingId": "ext_booking_001",
      "studentGovernmentId": "FR123456789",
      "teacherEmail": "teacher@example.com",
      "scheduledDate": "2025-12-01T10:00:00.000Z",
      "durationHours": 2,
      "status": "scheduled",
      "createdAt": "2025-11-28T00:00:00.000Z"
    }
  ],
  "total": 1
}
```

---

## Data Transformation

The sync process transforms external API data to match the internal database schema:

### Field Mapping:

| External Field | Internal Field | Transformation |
|----------------|----------------|----------------|
| `bookingId` | `source` | Prefixed with `"booking_api:"` for uniqueness |
| `studentGovernmentId` | `studentId` | Lookup student by `governmentId` |
| `teacherEmail` | `teacherId` | Lookup teacher by user email |
| `scheduledDate` | `date` | Convert ISO string to Date object |
| `durationHours` | `duration` | Direct copy (number) |
| `status` | `status` | Transform to internal enum |

### Status Mapping:

| External Status | Internal Status |
|----------------|-----------------|
| `scheduled` | `SCHEDULED` |
| `completed` | `COMPLETED` |
| `cancelled` | `CANCELLED` |
| `no-show` or `no_show` | `NO_SHOW` |

---

## Sync Process Flow

1. **Authentication Check**
   - Verify `Authorization` header contains valid `CRON_SECRET`
   - Reject unauthorized requests

2. **Fetch External Data**
   - Call external Booking API with retry logic (3 attempts)
   - 30-second timeout per request
   - Exponential backoff (1s, 2s, 4s)

3. **Validate Each Booking**
   - Check required fields exist
   - Validate data types and formats
   - Validate date is parseable
   - Validate duration is between 0-24 hours

4. **Lookup Related Records**
   - Find student by `governmentId`
   - Find teacher by email
   - Skip booking if student or teacher not found
   - Skip booking if student or teacher is inactive

5. **Upsert Booking**
   - Check if booking exists (by `source` field)
   - Update if exists, create if new
   - Track action (created/updated/skipped/error)

6. **Recalculate Student Hours**
   - For each affected student:
     - Sum all `COMPLETED` booking durations
     - Update student `usedHours` field

7. **Create Sync Log**
   - Record sync attempt with status (SUCCESS/FAILED)
   - Include summary statistics
   - Store timestamp and duration

8. **Return Summary**
   - Total processed, created, updated, skipped, errors
   - Duration in milliseconds
   - Number of students updated
   - Detailed results for each booking

---

## Error Handling

### Validation Errors
Bookings that fail validation are skipped and logged:
```json
{
  "bookingId": "ext_booking_123",
  "action": "error",
  "message": "Validation failed: Missing studentGovernmentId, Invalid durationHours"
}
```

### Missing Records
Bookings for non-existent students or teachers are skipped:
```json
{
  "bookingId": "ext_booking_456",
  "action": "skipped",
  "message": "Student not found with government ID: FR999999999"
}
```

### API Errors
External API failures are logged and returned:
```json
{
  "error": "Failed to fetch bookings from external API",
  "details": "Request timeout after 30 seconds"
}
```

### Individual Booking Errors
If one booking fails, others continue processing:
```json
{
  "bookingId": "ext_booking_789",
  "action": "error",
  "message": "Database error: Unique constraint violation"
}
```

---

## Retry Logic

The integration includes automatic retry logic for transient failures:

- **Max Retries:** 3 attempts
- **Initial Delay:** 1000ms
- **Backoff Multiplier:** 2x
- **Timeout:** 30 seconds per request

**Retry Sequence:**
1. First attempt - immediate
2. Second attempt - after 1s delay
3. Third attempt - after 2s delay
4. Fourth attempt - after 4s delay
5. Fail if all attempts exhausted

**Retried Errors:**
- Network errors (connection refused, DNS failure)
- Timeout errors
- Server errors (5xx status codes)

**Non-Retried Errors:**
- Client errors (4xx status codes)
- Authentication failures
- Validation errors

---

## Mock Data (Development)

For development and testing without access to the real external API, set:

```bash
BOOKING_API_URL=mock
BOOKING_API_KEY=any_value
```

This will use mock data defined in `lib/integrations/booking-api.ts`:

```typescript
// Mock data includes:
- 5 sample bookings
- Mix of statuses (scheduled, completed, no-show)
- Multiple students and teachers
- Past, present, and future dates
```

**Mock Data Response:**
```json
[
  {
    "bookingId": "ext_booking_001",
    "studentGovernmentId": "FR123456789",
    "teacherEmail": "teacher1@example.com",
    "scheduledDate": "2025-11-29T10:00:00.000Z",
    "durationHours": 2,
    "status": "scheduled",
    "createdAt": "2025-11-28T00:00:00.000Z"
  }
]
```

---

## Sync Log Tracking

Every sync operation creates a `SyncLog` record:

```prisma
model SyncLog {
  id           String     @id @default(cuid())
  source       String     // "BOOKING_API" or "GOVERNMENT_API"
  status       SyncStatus // SUCCESS, FAILED, IN_PROGRESS
  message      String     // Detailed sync summary
  lastSyncTime DateTime   // When sync was attempted
  createdAt    DateTime   @default(now())
}
```

**Example Sync Log Entry:**
```json
{
  "id": "cuid_abc123",
  "source": "BOOKING_API",
  "status": "SUCCESS",
  "message": "Processed 100 bookings: 25 created, 65 updated, 8 skipped, 2 errors. Duration: 3456ms",
  "lastSyncTime": "2025-11-28T02:00:00.000Z",
  "createdAt": "2025-11-28T02:00:03.456Z"
}
```

---

## Usage Examples

### Manual Sync (Development)
```bash
curl -X GET "http://localhost:3000/api/integrations/booking-sync" \
  -H "Authorization: Bearer your_cron_secret"
```

### Automated Sync (Vercel Cron)
Configured in `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/integrations/booking-sync",
      "schedule": "0 2 * * *"
    }
  ]
}
```

Runs daily at 2:00 AM UTC.

### View Sync Logs
```bash
# Query sync logs via Prisma
const logs = await prisma.syncLog.findMany({
  where: { source: 'BOOKING_API' },
  orderBy: { createdAt: 'desc' },
  take: 10,
});
```

---

## Integration Functions

### lib/integrations/booking-api.ts

**Functions:**

1. **`fetchAllBookings()`**
   - Fetches all bookings from external API
   - Returns: `ExternalBooking[]`
   - Throws: Error on API failure

2. **`fetchBookingsByDateRange(startDate, endDate)`**
   - Fetches bookings within date range
   - Parameters: Date objects
   - Returns: `ExternalBooking[]`

3. **`fetchBookingsByStudent(governmentId)`**
   - Fetches bookings for specific student
   - Parameter: Student government ID string
   - Returns: `ExternalBooking[]`

4. **`validateExternalBooking(booking)`**
   - Validates booking data structure
   - Returns: `{ valid: boolean, errors: string[] }`

5. **`transformBookingStatus(externalStatus)`**
   - Transforms external status to internal enum
   - Returns: `BookingStatus`

---

## Performance Considerations

- **Batch Processing**: All bookings processed in a single transaction when possible
- **Parallel Lookups**: Student and teacher lookups optimized with indexes
- **Hour Recalculation**: Only recalculates hours for affected students
- **Upsert Strategy**: Uses `findFirst` + `update`/`create` for efficiency

**Expected Performance:**
- 100 bookings: ~3-5 seconds
- 1000 bookings: ~30-50 seconds
- Limited by database query time and external API response time

---

## Government API Integration

### GET /api/integrations/government-sync

Synchronizes authorized training hours from the French Government API to the local database.

**Authentication:** Required (Cron secret or admin token)

**Purpose:**
- Fetches authorized hours for all students from government API
- Matches students by `governmentId`
- Updates student `totalAllowedHours` in database
- Creates sync log entries for monitoring
- Identifies students not found in government system

**Authorization:**
```
Authorization: Bearer <CRON_SECRET>
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "summary": {
    "totalProcessed": 50,
    "updated": 35,
    "noChange": 10,
    "notFound": 3,
    "errors": 2,
    "duration": 2145,
    "missingFromGovernment": 1
  },
  "details": [
    {
      "governmentId": "FR123456789",
      "action": "updated",
      "previousHours": 100,
      "newHours": 120
    },
    {
      "governmentId": "FR987654321",
      "action": "no_change",
      "previousHours": 150,
      "newHours": 150
    },
    {
      "governmentId": "FR999999999",
      "action": "not_found",
      "message": "Student not found in local database",
      "newHours": 80
    },
    {
      "governmentId": "FR111222333",
      "action": "error",
      "message": "Validation failed: authorizedHours exceeds maximum allowed"
    }
  ],
  "warnings": {
    "missingStudents": [
      {
        "governmentId": "FR444555666",
        "currentHours": 100
      }
    ]
  }
}
```

**Error Response (401 Unauthorized):**
```json
{
  "error": "Unauthorized"
}
```

**Error Response (500 Internal Server Error):**
```json
{
  "error": "Failed to fetch student hours from government API",
  "details": "Connection timeout after 30 seconds"
}
```

---

### External Government API Data Format

The French Government API returns data in the following format:

```typescript
interface ExternalStudentHours {
  governmentId: string;           // French government ID
  authorizedHours: number;        // Total authorized training hours
  studentName: string;            // Student full name
  programType: string;            // Training program type
  validFrom: string;              // ISO 8601 format
  validUntil: string;             // ISO 8601 format
  lastUpdated: string;            // ISO 8601 format
}
```

**External API Response:**
```json
{
  "success": true,
  "data": [
    {
      "governmentId": "FR123456789",
      "authorizedHours": 100,
      "studentName": "Jean Dupont",
      "programType": "Formation Continue",
      "validFrom": "2025-01-01T00:00:00.000Z",
      "validUntil": "2025-12-31T23:59:59.999Z",
      "lastUpdated": "2025-11-28T00:00:00.000Z"
    }
  ],
  "total": 1
}
```

---

### Government API Sync Process Flow

1. **Authentication Check**
   - Verify `Authorization` header contains valid `CRON_SECRET`
   - Reject unauthorized requests

2. **Fetch External Data**
   - Call government API with retry logic (3 attempts)
   - 30-second timeout per request
   - Exponential backoff (1s, 2s, 4s)
   - Handle rate limiting (wait if necessary)

3. **Fetch Local Students**
   - Get all students with `governmentId` from database
   - Include current `totalAllowedHours` for comparison

4. **Validate Each Student Record**
   - Check required fields exist
   - Validate `authorizedHours` is a positive number (max: 10,000)
   - Validate dates are parseable
   - Ensure `validUntil` is after `validFrom`

5. **Match and Update**
   - Match by `governmentId`
   - Skip if student not found in local database
   - Skip if student is inactive
   - Compare hours - skip if no change
   - Update `totalAllowedHours` if changed

6. **Identify Missing Students**
   - Find students in local database not in government response
   - Log warning for investigation

7. **Create Sync Log**
   - Record sync attempt with status (SUCCESS/FAILED)
   - Include summary statistics
   - Store timestamp and duration

8. **Return Summary**
   - Total processed, updated, unchanged, not found, errors
   - Duration in milliseconds
   - Count of students missing from government API
   - Detailed results for each student
   - Warnings for missing students

---

### Rate Limiting

The Government API may enforce rate limits. Our integration handles this automatically:

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1701187200
```

**Handling:**
- Tracks rate limit info from response headers
- Waits until reset time if limit exceeded
- Adds 1-second buffer after reset
- Retries request after rate limit resets

**429 Rate Limit Response:**
- Extracts `Retry-After` header if available
- Waits specified time before retry
- Continues with exponential backoff if no `Retry-After`

---

### Validation Rules

**Government ID:**
- Must be a non-empty string
- Format depends on French government standards

**Authorized Hours:**
- Must be a positive number
- Maximum: 10,000 hours
- Realistic range check to catch data errors

**Dates:**
- Must be valid ISO 8601 format
- `validFrom` must be before `validUntil`
- Dates must be parseable

**Student Name:**
- Must be a non-empty string
- Used for logging and verification only

---

### Mock Data (Development)

For development and testing without access to the real government API, set:

```bash
GOVERNMENT_API_URL=mock
GOVERNMENT_API_KEY=any_value
```

This will use mock data defined in `lib/integrations/government-api.ts`:

```typescript
// Mock data includes:
- 5 sample students
- Various program types (Formation Continue, CPF, etc.)
- Realistic hour allocations (80-200 hours)
- Current year validity periods
```

**Mock Data Response:**
```json
[
  {
    "governmentId": "FR123456789",
    "authorizedHours": 100,
    "studentName": "Jean Dupont",
    "programType": "Formation Continue",
    "validFrom": "2025-01-01T00:00:00.000Z",
    "validUntil": "2025-12-31T23:59:59.999Z",
    "lastUpdated": "2025-11-28T00:00:00.000Z"
  }
]
```

---

### Usage Examples

#### Manual Sync (Development)
```bash
curl -X GET "http://localhost:3000/api/integrations/government-sync" \
  -H "Authorization: Bearer your_cron_secret"
```

#### Automated Sync (Vercel Cron)
Configured in `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/integrations/government-sync",
      "schedule": "0 3 * * *"
    }
  ]
}
```

Runs daily at 3:00 AM UTC (after booking sync).

#### View Sync Logs
```bash
# Query sync logs via Prisma
const logs = await prisma.syncLog.findMany({
  where: { source: 'GOVERNMENT_API' },
  orderBy: { createdAt: 'desc' },
  take: 10,
});
```

---

### Integration Functions

**lib/integrations/government-api.ts**

1. **`fetchAllStudentHours()`**
   - Fetches all student hours from government API
   - Returns: `ExternalStudentHours[]`
   - Throws: Error on API failure

2. **`fetchStudentHoursByGovernmentId(governmentId)`**
   - Fetches hours for specific student
   - Parameter: Government ID string
   - Returns: `ExternalStudentHours`
   - Throws: Error if student not found

3. **`validateStudentHours(studentHours)`**
   - Validates student hours data structure
   - Returns: `{ valid: boolean, errors: string[] }`

4. **`getRateLimitStatus()`**
   - Get current rate limit information
   - Returns: `RateLimitInfo | null`

5. **`resetRateLimit()`**
   - Reset rate limit tracking (for testing)
   - Returns: `void`

---

### Performance Considerations

- **Batch Processing**: All students processed efficiently
- **Indexed Lookups**: `governmentId` indexed for fast lookups
- **Selective Updates**: Only updates changed records
- **Rate Limit Awareness**: Respects API rate limits

**Expected Performance:**
- 50 students: ~2-4 seconds
- 500 students: ~20-40 seconds
- Limited by government API response time and rate limits

---

## Monitoring & Troubleshooting

### Check Last Sync Status
```typescript
const lastSync = await prisma.syncLog.findFirst({
  where: { source: 'BOOKING_API' },
  orderBy: { createdAt: 'desc' },
});

console.log(lastSync.status); // SUCCESS or FAILED
console.log(lastSync.message);
```

### Common Issues

**Issue: "Unauthorized"**
- Solution: Check `CRON_SECRET` environment variable
- Verify `Authorization` header is set correctly

**Issue: "Student not found"**
- Solution: Ensure students exist with matching `governmentId`
- Check student is marked as active

**Issue: "Teacher not found"**
- Solution: Ensure teachers exist with matching email
- Check teacher user is marked as active

**Issue: "Request timeout"**
- Solution: External API may be slow or down
- Retry will happen automatically
- Check external API status

**Issue: High error rate**
- Solution: Check validation errors in details
- Review external API data format
- Ensure database constraints are met

**Issue: "Student not found in government system" (Government API)**
- Solution: Verify `governmentId` is correct in local database
- Check if student is registered in government system
- Contact government API support if discrepancy exists

**Issue: "Hours exceed maximum" (Government API)**
- Solution: Government API returned > 10,000 hours
- Verify data is correct with government system
- May indicate data error in government system

**Issue: "Rate limit exceeded" (Government API)**
- Solution: Integration automatically waits and retries
- If persistent, check rate limit quotas with API provider
- Consider scheduling sync during off-peak hours

**Issue: "Missing students warning"**
- Solution: Students in local DB not found in government response
- Verify students still have active government registrations
- Update or remove students no longer in government system

---

## Security

- **Authentication**: Requires `CRON_SECRET` in Authorization header
- **Rate Limiting**: Should be added for manual calls (not needed for cron)
- **Input Validation**: All external data validated before database insertion
- **SQL Injection Protection**: Prisma ORM prevents SQL injection
- **Error Disclosure**: Sensitive errors not exposed to client

---

## Future Enhancements

1. **Incremental Sync**: Only fetch bookings updated since last sync
2. **Webhook Support**: Real-time updates instead of polling
3. **Conflict Resolution**: Handle booking conflicts more intelligently
4. **Notification System**: Alert on sync failures
5. **Metrics Dashboard**: Visualize sync performance and errors
6. **Selective Sync**: Sync specific date ranges or students

---

## Related Documentation

- [Booking Management API](../bookings/README.md)
- [Student Management API](../students/README.md)
- [Teacher Management API](../teachers/README.md)
- [Cron Jobs Configuration](../cron/README.md) (Task 9.1)
- [Prisma Schema](../../../prisma/schema.prisma)
