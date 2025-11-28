# Sync Logs & Monitoring API

This directory contains API routes for managing and monitoring API synchronization logs.

## Overview

The sync logging system provides comprehensive monitoring and logging capabilities for all external API synchronization operations. It tracks sync attempts, successes, failures, and provides detailed analytics for system health monitoring.

---

## API Endpoints

### GET /api/sync-logs

Retrieve sync logs with filtering and pagination.

**Authentication:** Required (Admin only)

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `source`: Filter by sync source (`BOOKING_API`, `GOVERNMENT_API`)
- `status`: Filter by status (`SUCCESS`, `FAILED`, `IN_PROGRESS`)
- `startDate`: Filter logs from this date (ISO 8601 format)
- `endDate`: Filter logs until this date (ISO 8601 format)

**Example Request:**
```bash
curl "http://localhost:3000/api/sync-logs?source=BOOKING_API&status=SUCCESS&page=1&limit=20" \
  -H "Cookie: session_token=..."
```

**Success Response (200 OK):**
```json
{
  "logs": [
    {
      "id": "log_id_123",
      "source": "BOOKING_API",
      "status": "SUCCESS",
      "message": "Processed 100 bookings: 25 created, 65 updated, 8 skipped, 2 errors. Duration: 3456ms",
      "lastSyncTime": "2025-11-28T02:00:00.000Z",
      "createdAt": "2025-11-28T02:00:03.456Z"
    },
    {
      "id": "log_id_124",
      "source": "GOVERNMENT_API",
      "status": "SUCCESS",
      "message": "Processed 50 students: 35 updated, 10 unchanged, 3 not found, 2 errors. Duration: 2145ms",
      "lastSyncTime": "2025-11-28T03:00:00.000Z",
      "createdAt": "2025-11-28T03:00:02.145Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalCount": 150,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid query parameters
- `403 Forbidden`: Insufficient permissions (non-admin)
- `500 Internal Server Error`: Server error

---

### GET /api/sync-logs/latest

Get latest sync status for each source (for dashboard).

**Authentication:** Required (Admin only)

**Purpose:**
- Dashboard widget displaying current sync health
- Shows last sync time and status for each API
- Calculates time since last sync

**Example Request:**
```bash
curl "http://localhost:3000/api/sync-logs/latest" \
  -H "Cookie: session_token=..."
```

**Success Response (200 OK):**
```json
{
  "statuses": [
    {
      "source": "BOOKING_API",
      "status": "SUCCESS",
      "lastSyncTime": "2025-11-28T02:00:00.000Z",
      "message": "Processed 100 bookings: 25 created, 65 updated, 8 skipped, 2 errors. Duration: 3456ms",
      "timeSinceLastSync": 3600000,
      "timeSinceLastSyncFormatted": "1 hour ago"
    },
    {
      "source": "GOVERNMENT_API",
      "status": "SUCCESS",
      "lastSyncTime": "2025-11-28T03:00:00.000Z",
      "message": "Processed 50 students: 35 updated, 10 unchanged, 3 not found, 2 errors. Duration: 2145ms",
      "timeSinceLastSync": 600000,
      "timeSinceLastSyncFormatted": "10 minutes ago"
    }
  ]
}
```

**Time Formatting:**
- Shows "Never" if no sync has occurred
- Formats as: "X days ago", "X hours ago", "X minutes ago", "X seconds ago"

**Error Responses:**
- `403 Forbidden`: Insufficient permissions
- `500 Internal Server Error`: Server error

---

## Sync Logger Utility Functions

### lib/sync-logger.ts

Centralized utility functions for sync logging operations.

#### logSyncStart(source, details?)

Log the start of a sync operation (sets status to IN_PROGRESS).

```typescript
import { logSyncStart } from '@/lib/sync-logger';

const syncLog = await logSyncStart('BOOKING_API', {
  message: 'Starting booking sync with date range filter',
  metadata: { startDate: '2025-01-01', endDate: '2025-12-31' }
});
```

**Parameters:**
- `source`: `'BOOKING_API'` or `'GOVERNMENT_API'`
- `details`: Optional `{ message?: string, metadata?: object }`

**Returns:** Promise<SyncLog>

---

#### logSyncSuccess(source, summary)

Log successful completion of a sync operation.

```typescript
import { logSyncSuccess } from '@/lib/sync-logger';

const syncLog = await logSyncSuccess('BOOKING_API', {
  totalProcessed: 100,
  created: 25,
  updated: 65,
  skipped: 8,
  errors: 2,
  duration: 3456
});
```

**Parameters:**
- `source`: Sync source
- `summary`: Object with sync statistics
  - `totalProcessed`: number (required)
  - `created?`: number
  - `updated?`: number
  - `skipped?`: number
  - `notFound?`: number
  - `noChange?`: number
  - `errors?`: number
  - `duration?`: number (milliseconds)

**Returns:** Promise<SyncLog>

**Status Logic:**
- Status = `SUCCESS` if `errors` is 0 or undefined
- Status = `FAILED` if `errors` > 0

---

#### logSyncError(source, error)

Log a sync error.

```typescript
import { logSyncError } from '@/lib/sync-logger';

try {
  // Sync operation
} catch (error) {
  await logSyncError('BOOKING_API', error);
}
```

**Parameters:**
- `source`: Sync source
- `error`: Error object or string message

**Returns:** Promise<SyncLog>

**Note:** Always sets status to `FAILED`

---

#### getSyncStatus(source)

Get current sync status for a specific source.

```typescript
import { getSyncStatus } from '@/lib/sync-logger';

const status = await getSyncStatus('BOOKING_API');
console.log(status.status); // SUCCESS, FAILED, IN_PROGRESS, or null
console.log(status.lastSyncTime); // Date or null
console.log(status.message); // Last sync message
console.log(status.timeSinceLastSync); // Milliseconds since last sync
```

**Returns:**
```typescript
{
  source: 'BOOKING_API' | 'GOVERNMENT_API',
  status: SyncStatus | null,
  lastSyncTime: Date | null,
  message: string | null,
  timeSinceLastSync: number | null // milliseconds
}
```

---

#### getAllSyncStatuses()

Get sync status for all sources.

```typescript
import { getAllSyncStatuses } from '@/lib/sync-logger';

const statuses = await getAllSyncStatuses();
// Returns array of SyncStatusInfo for each source
```

**Returns:** Promise<SyncStatusInfo[]>

---

#### isSyncInProgress(source)

Check if a sync is currently in progress.

```typescript
import { isSyncInProgress } from '@/lib/sync-logger';

const inProgress = await isSyncInProgress('BOOKING_API');
if (inProgress) {
  console.log('Sync already running, please wait');
}
```

**Returns:** Promise<boolean>

**Use Case:** Prevent duplicate concurrent syncs

---

#### getLastSuccessfulSync(source)

Get the timestamp of the last successful sync.

```typescript
import { getLastSuccessfulSync } from '@/lib/sync-logger';

const lastSuccess = await getLastSuccessfulSync('BOOKING_API');
if (lastSuccess) {
  console.log(`Last successful sync: ${lastSuccess.toISOString()}`);
}
```

**Returns:** Promise<Date | null>

---

#### getSyncStatistics(source, startDate, endDate)

Get sync statistics for a time period.

```typescript
import { getSyncStatistics } from '@/lib/sync-logger';

const startDate = new Date('2025-11-01');
const endDate = new Date('2025-11-30');

const stats = await getSyncStatistics('BOOKING_API', startDate, endDate);
console.log(`Success rate: ${stats.successRate}%`);
```

**Returns:**
```typescript
{
  total: number,
  successful: number,
  failed: number,
  inProgress: number,
  successRate: number // percentage
}
```

---

## Admin UI Component

### components/admin/SyncLogsTable.tsx

React component for displaying sync logs in the admin panel.

**Features:**
- Filterable by source and status
- Paginated results (20 per page default)
- Color-coded status badges:
  - Green: SUCCESS
  - Red: FAILED
  - Yellow: IN_PROGRESS
- Formatted timestamps
- Refresh button
- Reset filters button
- Responsive design

**Usage:**
```tsx
import SyncLogsTable from '@/components/admin/SyncLogsTable';

export default function SyncLogsPage() {
  return (
    <div className="container mx-auto p-6">
      <SyncLogsTable initialPage={1} initialLimit={20} />
    </div>
  );
}
```

**Props:**
- `initialPage?`: number (default: 1)
- `initialLimit?`: number (default: 20)

**State Management:**
- Uses React hooks for state
- Fetches data from `/api/sync-logs`
- Updates on filter changes
- Shows loading and error states

---

## Database Schema

### SyncLog Model

```prisma
model SyncLog {
  id           String     @id @default(cuid())
  source       String     // "BOOKING_API" or "GOVERNMENT_API"
  status       SyncStatus // SUCCESS, FAILED, IN_PROGRESS
  message      String     // Detailed sync summary
  lastSyncTime DateTime   // When sync was attempted
  createdAt    DateTime   @default(now())

  @@index([source])
  @@index([status])
  @@index([lastSyncTime])
  @@map("sync_logs")
}

enum SyncStatus {
  SUCCESS
  FAILED
  IN_PROGRESS
}
```

**Indexes:**
- `source` - Fast filtering by API source
- `status` - Fast filtering by status
- `lastSyncTime` - Efficient latest sync queries

---

## Usage Patterns

### Pattern 1: Simple Sync Logging

```typescript
import { logSyncSuccess, logSyncError } from '@/lib/sync-logger';

try {
  // Perform sync operation
  const result = await syncBookings();

  await logSyncSuccess('BOOKING_API', {
    totalProcessed: result.total,
    created: result.created,
    updated: result.updated,
    errors: result.errors,
    duration: result.duration
  });
} catch (error) {
  await logSyncError('BOOKING_API', error);
}
```

### Pattern 2: Detailed Sync with Progress

```typescript
import { logSyncStart, logSyncSuccess, logSyncError } from '@/lib/sync-logger';

const startLog = await logSyncStart('BOOKING_API', {
  message: 'Starting booking sync'
});

try {
  const result = await syncBookings();

  await logSyncSuccess('BOOKING_API', {
    totalProcessed: result.total,
    created: result.created,
    updated: result.updated,
    duration: Date.now() - startLog.createdAt.getTime()
  });
} catch (error) {
  await logSyncError('BOOKING_API', error);
}
```

### Pattern 3: Prevent Concurrent Syncs

```typescript
import { isSyncInProgress, logSyncStart } from '@/lib/sync-logger';

// Check if sync already running
if (await isSyncInProgress('BOOKING_API')) {
  return { error: 'Sync already in progress' };
}

await logSyncStart('BOOKING_API');
// Perform sync...
```

### Pattern 4: Dashboard Status Display

```typescript
import { getAllSyncStatuses } from '@/lib/sync-logger';

export async function GET() {
  const statuses = await getAllSyncStatuses();

  return Response.json({
    bookingAPI: statuses.find(s => s.source === 'BOOKING_API'),
    governmentAPI: statuses.find(s => s.source === 'GOVERNMENT_API')
  });
}
```

---

## Monitoring Best Practices

### 1. Check Sync Health Regularly

```typescript
const status = await getSyncStatus('BOOKING_API');

if (status.status === 'FAILED') {
  // Alert administrators
  sendAlert('Booking API sync failed', status.message);
}

if (status.timeSinceLastSync && status.timeSinceLastSync > 24 * 60 * 60 * 1000) {
  // Alert if no sync in 24 hours
  sendAlert('Booking API sync overdue', 'No sync in 24 hours');
}
```

### 2. Monitor Success Rate

```typescript
const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
const now = new Date();

const stats = await getSyncStatistics('BOOKING_API', last30Days, now);

if (stats.successRate < 90) {
  sendAlert('Low sync success rate', `Success rate: ${stats.successRate}%`);
}
```

### 3. Track Sync Duration

Log duration in sync summary and alert on slow syncs:

```typescript
const summary = {
  totalProcessed: 100,
  duration: 60000 // 60 seconds
};

await logSyncSuccess('BOOKING_API', summary);

if (summary.duration > 30000) { // > 30 seconds
  sendAlert('Slow sync detected', `Duration: ${summary.duration}ms`);
}
```

---

## Integration with Cron Jobs

The sync logging system integrates seamlessly with cron jobs (Task 9.1, 9.2):

```typescript
// app/api/cron/sync-bookings/route.ts
import { logSyncStart, logSyncSuccess, logSyncError } from '@/lib/sync-logger';

export async function GET(request: NextRequest) {
  await logSyncStart('BOOKING_API');

  try {
    // Sync operation
    const result = await performBookingSync();

    await logSyncSuccess('BOOKING_API', result);
    return Response.json({ success: true });
  } catch (error) {
    await logSyncError('BOOKING_API', error);
    return Response.json({ error: 'Sync failed' }, { status: 500 });
  }
}
```

---

## Troubleshooting

### Issue: "Sync stuck in IN_PROGRESS"

**Cause:** Sync started but never completed (crash, timeout, etc.)

**Solution:**
```typescript
// Manually update status
await prisma.syncLog.update({
  where: { id: 'stuck_log_id' },
  data: { status: SyncStatus.FAILED, message: 'Sync timeout' }
});
```

### Issue: "No logs appearing"

**Cause:** Sync operations not using logger functions

**Solution:** Ensure all sync endpoints use `logSyncSuccess` or `logSyncError`

### Issue: "Duplicate logs"

**Cause:** Multiple sync processes running concurrently

**Solution:** Use `isSyncInProgress()` to check before starting

---

## Performance Considerations

- **Indexes**: Database indexes on `source`, `status`, and `lastSyncTime` ensure fast queries
- **Pagination**: Default 20 per page prevents large result sets
- **Async Logging**: Logging operations are async and don't block sync operations
- **Cleanup**: Consider archiving old logs (> 90 days) to maintain performance

**Recommended Cleanup:**
```typescript
// Delete logs older than 90 days
const cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

await prisma.syncLog.deleteMany({
  where: {
    createdAt: {
      lt: cutoffDate
    }
  }
});
```

---

## Related Documentation

- [Booking API Integration](../integrations/README.md#booking-api-integration)
- [Government API Integration](../integrations/README.md#government-api-integration)
- [Cron Jobs](../cron/README.md) (Task 9.1, 9.2)
- [Admin Dashboard](../../(admin)/dashboard/README.md) (Future task)
- [Prisma Schema](../../../prisma/schema.prisma)
