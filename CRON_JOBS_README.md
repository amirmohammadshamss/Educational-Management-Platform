# Cron Jobs Documentation

This document explains the automated cron jobs in the Educational Management Platform.

## Overview

The platform uses Vercel Cron Jobs to automate daily synchronization tasks with external APIs.

**Scheduled Jobs:**
1. **Booking Sync** - 2:00 AM UTC
2. **Government Hours Sync** - 3:00 AM UTC (runs after booking sync)
3. **Hours Calculation** - 4:00 AM UTC (runs after both syncs)

## Booking Sync Cron Job

### Purpose
Synchronizes booking data from the external Booking API and updates student hours automatically.

### Schedule
- **Frequency**: Daily
- **Time**: 2:00 AM UTC (3:00 AM CET / 4:00 AM CEST)
- **Configuration**: `vercel.json`

### What It Does

1. **Fetch Bookings**: Retrieves all bookings from the external Booking API
2. **Process Bookings**:
   - Creates new booking records in the database
   - Updates existing bookings if they've changed
   - Uses booking ID for idempotency (prevents duplicates)
3. **Update Hours**: Calculates and updates each student's used hours based on completed bookings
4. **Log Results**: Creates detailed sync logs in the database
5. **Error Handling**: Continues processing even if individual bookings fail

### Security

The cron endpoint is protected by a `CRON_SECRET` environment variable:

```
Authorization: Bearer <CRON_SECRET>
```

Only requests with the correct authorization header can execute the cron job.

## Government Hours Sync Cron Job

### Purpose
Synchronizes authorized training hours from the French Government API and updates student records.

### Schedule
- **Frequency**: Daily
- **Time**: 3:00 AM UTC (4:00 AM CET / 5:00 AM CEST)
- **Order**: Runs after booking sync to ensure accurate hour calculations
- **Configuration**: `vercel.json`

### What It Does

1. **Fetch Students**: Retrieves all students with Government IDs from database
2. **Query API**: For each student, fetches authorized hours from Government API
3. **Validate Hours**:
   - Ensures hours are positive numbers
   - Checks for reasonable values (max 10,000 hours)
   - Logs anomalies (e.g., zero hours, unusually high values)
4. **Update Records**: Updates `totalAllowedHours` for students with changes
5. **Track Changes**: Logs all updates with old and new values
6. **Error Handling**: Continues processing other students if one fails
7. **Rate Limiting**: Includes delays between requests to avoid API limits

### Dry Run Mode

Test the sync without making changes:

```bash
curl -X GET "http://localhost:3000/api/cron/sync-government-hours?dryRun=true" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

This will show what would be updated without committing changes to the database.

### Security

Uses the same `CRON_SECRET` as the booking sync job:

```
Authorization: Bearer <CRON_SECRET>
```

## Hours Calculation Cron Job

### Purpose
Calculates student used hours based on completed bookings and identifies students with low or exceeded hours.

### Schedule
- **Frequency**: Daily
- **Time**: 4:00 AM UTC (5:00 AM CET / 6:00 AM CEST)
- **Order**: Runs after both booking and government syncs for accurate calculations
- **Configuration**: `vercel.json`

### What It Does

1. **Aggregate Bookings**: Sums all completed booking durations per student using efficient SQL aggregation
2. **Calculate Hours**: Converts minutes to hours (rounded to 2 decimals)
3. **Update Records**: Updates `usedHours` for students with changes
4. **Calculate Remaining**: Computes remaining hours (total allowed - used)
5. **Identify Warnings**:
   - Students with < 20% hours remaining (low hours warning)
   - Students who exceeded their allowed hours (over limit alert)
6. **Send Notifications**: Optional email alerts to students and admins
7. **Performance Monitoring**: Alerts if execution exceeds 30 seconds

### Warnings and Alerts

The job tracks two types of warnings:

**Low Hours Warning (< 20% remaining):**
- Logs students approaching their hour limit
- Can trigger email notifications to students
- Helps students plan remaining training time

**Over Limit Alert (exceeded allowed hours):**
- Logs students who have used more than their allocated hours
- Alerts administrators for follow-up
- May indicate billing or compliance issues

### Security

Uses the same `CRON_SECRET` as other cron jobs:

```
Authorization: Bearer <CRON_SECRET>
```

## Manual Sync Trigger

### Purpose
Allows administrators to manually trigger all sync jobs in sequence for testing or on-demand synchronization.

### Endpoint
`POST /api/cron/trigger-all`

### Access
- **Admin only** - Requires authenticated admin or super admin user
- **Session-based** authentication (not CRON_SECRET)

### What It Does

Executes all three cron jobs in sequence:
1. **Booking Sync** (with 1s delay)
2. **Government Hours Sync** (with 1s delay)
3. **Hours Calculation**

Returns a combined summary of all operations.

### Usage

**Via Browser/Postman:**
```http
POST /api/cron/trigger-all
```

**Response:**
```json
{
  "success": true,
  "triggeredBy": {
    "userId": "admin123",
    "userName": "Admin User",
    "userEmail": "admin@example.com"
  },
  "results": {
    "bookingSync": { "status": "SUCCESS", "..." },
    "governmentHoursSync": { "status": "SUCCESS", "..." },
    "hoursCalculation": { "status": "SUCCESS", "..." }
  },
  "totalDuration": "15234ms",
  "timestamp": "2025-11-28T10:00:00.000Z"
}
```

### Use Cases

- **Testing**: Verify all cron jobs work correctly before deployment
- **On-Demand Sync**: Manually sync data when needed (e.g., after data migration)
- **Debugging**: Troubleshoot sync issues with immediate feedback
- **Data Recovery**: Re-sync data after fixing API issues

## Environment Variables

Required environment variables:

```env
# Cron Job Security
CRON_SECRET=your-secret-token-here

# Booking API Configuration
BOOKING_API_URL=https://booking-api.example.com
BOOKING_API_KEY=your-booking-api-key

# Government API Configuration
GOVERNMENT_API_URL=https://government-api.example.fr
GOVERNMENT_API_KEY=your-government-api-key

# Optional: Email Alerts
ADMIN_EMAIL=admin@yourdomain.com
SEND_SUCCESS_NOTIFICATIONS=false
```

## Testing Locally

You can test the cron job locally by making a manual HTTP request:

### Using curl

**Booking Sync:**
```bash
curl -X GET http://localhost:3000/api/cron/sync-bookings \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Government Hours Sync:**
```bash
curl -X GET http://localhost:3000/api/cron/sync-government-hours \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Government Hours Sync (Dry Run):**
```bash
curl -X GET "http://localhost:3000/api/cron/sync-government-hours?dryRun=true" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Hours Calculation:**
```bash
curl -X GET http://localhost:3000/api/cron/calculate-hours \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Manual Trigger (All Jobs):**
```bash
curl -X POST http://localhost:3000/api/cron/trigger-all \
  -H "Cookie: your-session-cookie"
```
Note: Requires admin authentication via session cookie.

### Using Postman

1. Method: `GET`
2. URL: `http://localhost:3000/api/cron/sync-bookings`
3. Headers:
   - `Authorization`: `Bearer YOUR_CRON_SECRET`

### Expected Responses

#### Booking Sync

**Success:**
```json
{
  "success": true,
  "status": "SUCCESS",
  "duration": "1234ms",
  "bookings": {
    "processed": 50,
    "created": 10,
    "updated": 40
  },
  "students": {
    "hoursUpdated": 25
  },
  "errors": [],
  "timestamp": "2025-11-28T10:00:00.000Z"
}
```

**Partial Success (with errors):**
```json
{
  "success": true,
  "status": "PARTIAL_SUCCESS",
  "duration": "1456ms",
  "bookings": {
    "processed": 50,
    "created": 8,
    "updated": 40
  },
  "students": {
    "hoursUpdated": 25
  },
  "errors": [
    "Student not found for booking ABC123",
    "Teacher not found for booking XYZ789"
  ],
  "timestamp": "2025-11-28T10:00:00.000Z"
}
```

**Failure:**
```json
{
  "success": false,
  "status": "FAILED",
  "duration": "234ms",
  "error": "Booking API configuration missing",
  "timestamp": "2025-11-28T10:00:00.000Z"
}
```

#### Government Hours Sync

**Success:**
```json
{
  "success": true,
  "status": "SUCCESS",
  "dryRun": false,
  "duration": "2345ms",
  "students": {
    "processed": 25,
    "updated": 5,
    "skipped": 20,
    "notFound": 0
  },
  "changes": [
    {
      "studentId": "abc123",
      "governmentId": "FR12345",
      "oldHours": 100,
      "newHours": 120
    }
  ],
  "errors": [],
  "anomalies": [],
  "timestamp": "2025-11-28T10:00:00.000Z"
}
```

**Partial Success (with anomalies):**
```json
{
  "success": false,
  "status": "PARTIAL_SUCCESS",
  "dryRun": false,
  "duration": "3456ms",
  "students": {
    "processed": 25,
    "updated": 3,
    "skipped": 20,
    "notFound": 2
  },
  "changes": [
    {
      "studentId": "abc123",
      "governmentId": "FR12345",
      "oldHours": 100,
      "newHours": 120
    }
  ],
  "errors": [
    "Student not found in Government API: FR99999"
  ],
  "anomalies": [
    "Zero hours value for FR11111",
    "Unusually high hours value for FR22222: 5000"
  ],
  "timestamp": "2025-11-28T10:00:00.000Z"
}
```

**Dry Run:**
```json
{
  "success": true,
  "status": "SUCCESS",
  "dryRun": true,
  "duration": "1234ms",
  "students": {
    "processed": 25,
    "updated": 5,
    "skipped": 20,
    "notFound": 0
  },
  "changes": [
    {
      "studentId": "abc123",
      "governmentId": "FR12345",
      "oldHours": 100,
      "newHours": 120
    }
  ],
  "errors": [],
  "anomalies": [],
  "timestamp": "2025-11-28T10:00:00.000Z"
}
```

#### Hours Calculation

**Success:**
```json
{
  "success": true,
  "status": "SUCCESS",
  "duration": "1234ms",
  "students": {
    "processed": 50,
    "updated": 15,
    "totalHoursCalculated": 2345.5
  },
  "warnings": {
    "lowHours": [
      {
        "studentId": "student123",
        "remainingHours": 15.5,
        "percentageRemaining": 12.5
      }
    ],
    "overLimit": [
      {
        "studentId": "student456",
        "usedHours": 125.0,
        "allowedHours": 120.0,
        "overage": 5.0
      }
    ]
  },
  "errors": [],
  "executionWarning": null,
  "timestamp": "2025-11-28T10:00:00.000Z"
}
```

**With Execution Warning:**
```json
{
  "success": true,
  "status": "SUCCESS",
  "duration": "35234ms",
  "students": {
    "processed": 1000,
    "updated": 250,
    "totalHoursCalculated": 12345.75
  },
  "warnings": {
    "lowHours": [],
    "overLimit": []
  },
  "errors": [],
  "executionWarning": "Execution time exceeded 30 seconds",
  "timestamp": "2025-11-28T10:00:00.000Z"
}
```

#### Manual Trigger (All Jobs)

**Success:**
```json
{
  "success": true,
  "triggeredBy": {
    "userId": "admin123",
    "userName": "Admin User",
    "userEmail": "admin@example.com"
  },
  "results": {
    "bookingSync": {
      "success": true,
      "status": "SUCCESS",
      "bookings": {
        "processed": 50,
        "created": 5,
        "updated": 45
      }
    },
    "governmentHoursSync": {
      "success": true,
      "status": "SUCCESS",
      "students": {
        "processed": 25,
        "updated": 3
      }
    },
    "hoursCalculation": {
      "success": true,
      "status": "SUCCESS",
      "students": {
        "processed": 25,
        "updated": 10
      }
    }
  },
  "totalDuration": "8765ms",
  "timestamp": "2025-11-28T10:00:00.000Z"
}
```

## Monitoring

### Sync Logs

All cron job executions are logged in the `SyncLog` table:

```sql
-- Booking sync logs
SELECT * FROM "SyncLog"
WHERE source = 'BOOKING_API'
ORDER BY "lastSyncTime" DESC
LIMIT 10;

-- Government API sync logs
SELECT * FROM "SyncLog"
WHERE source = 'GOVERNMENT_API'
ORDER BY "lastSyncTime" DESC
LIMIT 10;

-- Hours calculation logs
SELECT * FROM "SyncLog"
WHERE source = 'HOURS_CALCULATION'
ORDER BY "lastSyncTime" DESC
LIMIT 10;

-- Manual trigger logs
SELECT * FROM "SyncLog"
WHERE source = 'MANUAL_TRIGGER'
ORDER BY "lastSyncTime" DESC
LIMIT 10;

-- All sync logs
SELECT * FROM "SyncLog"
ORDER BY "lastSyncTime" DESC
LIMIT 20;
```

### Log Statuses

- `IN_PROGRESS`: Job is currently running
- `SUCCESS`: Job completed without errors
- `PARTIAL_SUCCESS`: Job completed but some operations failed
- `FAILED`: Job failed completely

### Console Logs

Check Vercel deployment logs for detailed execution information:

1. Go to Vercel Dashboard
2. Select your project
3. Navigate to "Deployments" → "Functions"
4. View logs for `/api/cron/sync-bookings`

## Error Handling

### Idempotency

The cron job is idempotent, meaning:
- Running it multiple times won't create duplicate bookings
- Existing bookings are updated instead of creating new ones
- Safe to retry after failures

### Graceful Degradation

- Individual booking errors don't stop the entire sync
- Errors are logged and reported in the summary
- Continues processing remaining bookings even if some fail

### Alerting (Optional)

Configure email alerts for critical failures:

1. Set `ADMIN_EMAIL` environment variable
2. Integrate email service (SendGrid, Resend, etc.) in `lib/emailAlerts.ts`
3. Uncomment email sending code in the cron job

## Vercel Configuration

The `vercel.json` file configures the cron job:

```json
{
  "crons": [
    {
      "path": "/api/cron/sync-bookings",
      "schedule": "0 2 * * *"
    }
  ]
}
```

### Cron Schedule Format

The schedule uses standard cron syntax:

```
* * * * *
│ │ │ │ │
│ │ │ │ └─── Day of week (0-7, 0 and 7 are Sunday)
│ │ │ └───── Month (1-12)
│ │ └─────── Day of month (1-31)
│ └───────── Hour (0-23)
└─────────── Minute (0-59)
```

**Examples:**
- `0 2 * * *` - Daily at 2:00 AM
- `0 */6 * * *` - Every 6 hours
- `0 0 * * 0` - Weekly on Sunday at midnight
- `0 3 1 * *` - Monthly on the 1st at 3:00 AM

## Troubleshooting

### Job Not Running

1. Check Vercel dashboard for cron job status
2. Verify `vercel.json` is in the project root
3. Ensure project is deployed to Vercel (cron jobs don't run locally by default)
4. Check environment variables are set in Vercel

### Authentication Errors

- Verify `CRON_SECRET` matches in both Vercel environment and your test requests
- Check Authorization header format: `Bearer <SECRET>`

### API Connection Errors

- Verify `BOOKING_API_URL` and `BOOKING_API_KEY` are correct
- Test external API connectivity
- Check API rate limits and quotas

### Database Errors

- Check database connection string
- Verify Prisma schema is up to date
- Check for database constraints or conflicts

## Adding More Cron Jobs

To add additional cron jobs (e.g., Government API sync):

1. Create new endpoint: `app/api/cron/sync-government/route.ts`
2. Add to `vercel.json`:
   ```json
   {
     "crons": [
       {
         "path": "/api/cron/sync-bookings",
         "schedule": "0 2 * * *"
       },
       {
         "path": "/api/cron/sync-government",
         "schedule": "0 3 * * *"
       }
     ]
   }
   ```
3. Implement with same security pattern (CRON_SECRET)
4. Add logging and error handling

## Best Practices

1. **Always use idempotent operations** - Safe to retry
2. **Log everything** - Essential for debugging
3. **Handle errors gracefully** - Don't let one error stop everything
4. **Monitor execution time** - Optimize slow operations
5. **Test locally first** - Verify before deploying
6. **Set up alerts** - Know when things fail
7. **Document changes** - Update this README when adding new jobs

## Support

For issues or questions:
- Check Vercel logs first
- Review sync logs in database
- Test endpoint manually with correct authorization
- Contact system administrator if issues persist
