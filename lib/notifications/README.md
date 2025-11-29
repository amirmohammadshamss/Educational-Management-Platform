# Notification System Documentation

This module provides a comprehensive in-app notification system for the Educational Management Platform, including database storage, API endpoints, UI components, and email integration.

## Features

- 🔔 In-app notifications with real-time updates
- 📧 Optional email notifications for important events
- 🎯 Type-based filtering and categorization
- 📱 Mobile-responsive notification bell component
- 📄 Full-page notification management interface
- ✅ Mark as read/unread functionality
- 🔗 Direct links to related resources
- 🎨 Type-specific icons and colors
- 📊 Pagination support for large notification lists

## Database Schema

The notification system uses the `Notification` model in Prisma:

```prisma
model Notification {
  id        String           @id @default(cuid())
  userId    String
  type      NotificationType
  title     String
  message   String
  isRead    Boolean          @default(false)
  link      String?
  createdAt DateTime         @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

enum NotificationType {
  HOMEWORK_REVIEWED
  HOMEWORK_SUBMITTED
  CLASS_REMINDER
  LOW_HOURS
  ASSIGNMENT
  STUDENT_ASSIGNED
  SYSTEM
}
```

## API Endpoints

### GET /api/notifications

Fetch user's notifications with filtering and pagination.

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 20, max: 100) - Items per page
- `isRead` (boolean) - Filter by read status
- `type` (NotificationType) - Filter by notification type

**Response:**
```json
{
  "notifications": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalCount": 45,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPreviousPage": false
  },
  "unreadCount": 12
}
```

### PATCH /api/notifications/[id]/read

Mark a specific notification as read.

**Response:**
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

### PATCH /api/notifications/mark-all-read

Mark all user's notifications as read.

**Response:**
```json
{
  "success": true,
  "message": "12 notification(s) marked as read",
  "count": 12
}
```

## Usage

### Creating Notifications

```typescript
import {
  notifyHomeworkReviewed,
  notifyHomeworkSubmitted,
  notifyClassReminder,
  notifyLowHours,
  notifyNewAssignment,
  notifyStudentAssigned,
  notifySystem,
} from '@/lib/notifications';

// Notify student when homework is reviewed
await notifyHomeworkReviewed(
  studentId,
  'Marie Martin',
  'APPROVED',
  'Excellent travail!'
);

// Notify teacher when homework is submitted
await notifyHomeworkSubmitted(
  teacherId,
  'Jean Dupont',
  homeworkId
);

// Send class reminder (24 hours before)
await notifyClassReminder(
  studentId,
  'Marie Martin',
  new Date('2024-12-15T14:00:00')
);

// Warn about low hours (< 20%)
await notifyLowHours(studentId);

// Notify about new assignment
await notifyNewAssignment(studentId, 'Marie Martin');

// Notify teacher about new student
await notifyStudentAssigned(teacherId, 'Jean Dupont', studentId);

// System-wide notification
await notifySystem('Maintenance prévue demain à 2h00', {
  title: 'Maintenance système',
  link: '/announcements',
  role: 'ADMIN', // Optional: target specific role
});
```

### Custom Notifications

```typescript
import { createNotification } from '@/lib/notifications';
import { NotificationType } from '@prisma/client';

await createNotification({
  userId: 'user-id',
  type: NotificationType.SYSTEM,
  title: 'Custom Notification',
  message: 'This is a custom notification',
  link: '/some-page',
  sendEmail: true, // Optional: also send email
});
```

### Using the NotificationBell Component

Add the notification bell to your layout:

```tsx
import NotificationBell from '@/components/shared/NotificationBell';

export default function Layout({ children }) {
  return (
    <div>
      <header>
        <NotificationBell refreshInterval={30000} />
      </header>
      {children}
    </div>
  );
}
```

**Props:**
- `refreshInterval` (number, optional, default: 30000) - Polling interval in milliseconds

**Features:**
- Bell icon with unread count badge
- Dropdown showing 5 most recent notifications
- Real-time updates via polling
- Mark as read on click
- Links to full notifications page

### Notifications Page

The full notifications page is available at `/notifications` and provides:

- **Filtering:** All, Unread, Read
- **Type Filter:** Filter by notification type
- **Pagination:** Navigate through all notifications
- **Bulk Actions:** Mark all as read
- **Interactive:** Click to navigate to related resources

## Integration Examples

### Example 1: Homework Review Notification

```typescript
// app/api/homework/[id]/review/route.ts
import { notifyHomeworkReviewed } from '@/lib/notifications';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { status, feedback } = await request.json();

  const homework = await prisma.homework.update({
    where: { id: params.id },
    data: { status, feedback, reviewedAt: new Date() },
    include: {
      student: { include: { user: true } },
      teacher: { include: { user: true } },
    },
  });

  // Send notification to student
  await notifyHomeworkReviewed(
    homework.studentId,
    homework.teacher.user.name || 'Teacher',
    status,
    feedback || undefined
  );

  return Response.json({ success: true });
}
```

### Example 2: Homework Submission Notification

```typescript
// app/api/homework/route.ts (POST)
import { notifyHomeworkSubmitted } from '@/lib/notifications';

export async function POST(request: Request) {
  const formData = await request.formData();
  // ... upload file and create homework

  const homework = await prisma.homework.create({
    data: { studentId, teacherId, fileUrl, fileName, fileSize },
    include: {
      student: { include: { user: true } },
    },
  });

  // Notify teacher
  await notifyHomeworkSubmitted(
    teacherId,
    homework.student.user.name || 'Student',
    homework.id
  );

  return Response.json({ success: true });
}
```

### Example 3: Daily Class Reminders (Cron Job)

```typescript
// app/api/cron/send-class-reminders/route.ts
import { notifyClassReminder } from '@/lib/notifications';

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Get tomorrow's bookings
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const nextDay = new Date(tomorrow);
  nextDay.setDate(nextDay.getDate() + 1);

  const bookings = await prisma.booking.findMany({
    where: {
      date: { gte: tomorrow, lt: nextDay },
      status: 'SCHEDULED',
    },
    include: {
      student: { include: { user: true } },
      teacher: { include: { user: true } },
    },
  });

  // Send reminders
  for (const booking of bookings) {
    await notifyClassReminder(
      booking.studentId,
      booking.teacher.user.name || 'Teacher',
      booking.date
    );
  }

  return Response.json({ sent: bookings.length });
}
```

### Example 4: Low Hours Check (Cron Job)

```typescript
// app/api/cron/check-low-hours/route.ts
import { notifyLowHours } from '@/lib/notifications';

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Find students with low hours
  const students = await prisma.student.findMany({
    where: {
      totalAllowedHours: { gt: 0 },
    },
  });

  let notifiedCount = 0;

  for (const student of students) {
    const remaining = student.totalAllowedHours - student.usedHours;
    const percentage = (remaining / student.totalAllowedHours) * 100;

    if (percentage < 20 && percentage > 0) {
      await notifyLowHours(student.id);
      notifiedCount++;
    }
  }

  return Response.json({ notified: notifiedCount });
}
```

### Example 5: Student Assignment Notification

```typescript
// app/api/teachers/[id]/students/route.ts (POST)
import { notifyStudentAssigned } from '@/lib/notifications';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { studentId } = await request.json();

  await prisma.studentTeacher.create({
    data: {
      teacherId: params.id,
      studentId,
    },
  });

  // Get student name
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { user: true },
  });

  // Notify teacher
  await notifyStudentAssigned(
    params.id,
    student?.user.name || 'Student',
    studentId
  );

  return Response.json({ success: true });
}
```

## Notification Types

### HOMEWORK_REVIEWED
- **Trigger:** Teacher reviews student homework
- **Recipients:** Student
- **Email:** Yes
- **Icon:** ✅
- **Color:** Green

### HOMEWORK_SUBMITTED
- **Trigger:** Student submits homework
- **Recipients:** Teacher
- **Email:** Yes
- **Icon:** 📝
- **Color:** Blue

### CLASS_REMINDER
- **Trigger:** 24 hours before scheduled class
- **Recipients:** Student
- **Email:** Yes
- **Icon:** ⏰
- **Color:** Yellow

### LOW_HOURS
- **Trigger:** Student has < 20% hours remaining
- **Recipients:** Student, Admins
- **Email:** Yes (student only)
- **Icon:** ⚠️
- **Color:** Red

### ASSIGNMENT
- **Trigger:** Teacher assigns new homework
- **Recipients:** Student
- **Email:** Yes
- **Icon:** 📋
- **Color:** Purple

### STUDENT_ASSIGNED
- **Trigger:** Student assigned to teacher
- **Recipients:** Teacher
- **Email:** Yes
- **Icon:** 👥
- **Color:** Indigo

### SYSTEM
- **Trigger:** System announcements, maintenance
- **Recipients:** All users or specific role
- **Email:** No
- **Icon:** 🔔
- **Color:** Gray

## Best Practices

### 1. Always Check User Preferences

The notification functions automatically check if users are active before sending. In the future, implement user notification preferences:

```typescript
// Future implementation
const preferences = await prisma.userNotificationPreferences.findUnique({
  where: { userId },
});

if (!preferences.homeworkReviewedEnabled) {
  return; // Skip notification
}
```

### 2. Include Relevant Links

Always provide a link to the related resource:

```typescript
await createNotification({
  userId,
  type: NotificationType.HOMEWORK_REVIEWED,
  title: 'Devoir évalué',
  message: 'Your homework has been reviewed',
  link: '/student/homework', // Direct link to homework page
});
```

### 3. Use Meaningful Messages

Keep messages concise but informative:

```typescript
// Good
message: `${teacherName} a évalué votre devoir (approuvé)`

// Bad
message: 'Homework reviewed'
```

### 4. Batch Notifications

When creating multiple notifications, use Promise.all:

```typescript
const notifications = students.map(student =>
  notifyNewAssignment(student.id, teacherName)
);

await Promise.all(notifications);
```

### 5. Error Handling

Notification failures should not break main functionality:

```typescript
try {
  await notifyHomeworkReviewed(studentId, teacherName, status);
} catch (error) {
  console.error('Failed to send notification:', error);
  // Continue with main operation
}
```

## Customization

### Changing Polling Interval

```tsx
<NotificationBell refreshInterval={60000} /> // 1 minute
```

### Custom Notification Icons

Edit `components/shared/NotificationBell.tsx`:

```typescript
function getNotificationIcon(type: NotificationType): string {
  switch (type) {
    case 'HOMEWORK_REVIEWED':
      return '🎓'; // Custom icon
    // ...
  }
}
```

### Custom Notification Colors

Edit `app/notifications/page.tsx`:

```typescript
function getNotificationStyle(type: NotificationType) {
  switch (type) {
    case 'HOMEWORK_REVIEWED':
      return { icon: '✅', color: 'bg-emerald-100 text-emerald-800' };
    // ...
  }
}
```

## Performance Considerations

### Pagination

Always paginate large notification lists:

```typescript
const { notifications, pagination } = await fetch('/api/notifications?page=1&limit=20');
```

### Indexing

The database includes indexes on:
- `userId` - Fast user notification lookups
- `isRead` - Efficient unread filtering
- `createdAt` - Quick time-based sorting
- `type` - Fast type filtering

### Polling vs WebSockets

Current implementation uses polling (30s default). For real-time updates, consider:

- **WebSockets:** Real-time push notifications
- **Server-Sent Events (SSE):** One-way real-time updates
- **Firebase Cloud Messaging:** Mobile push notifications

## Troubleshooting

### Notifications not appearing

1. Check if user is active: `user.active === true`
2. Verify notification was created in database
3. Check browser console for API errors
4. Ensure authentication is working

### Email not sending

Notifications create in-app notifications separately from emails. If emails aren't sending:

1. Check email service configuration (see `/lib/email/README.md`)
2. Verify `sendEmail` parameter is `true` (default)
3. Check email logs in console

### Unread count not updating

The NotificationBell component polls every 30 seconds. To force update:

- Refresh the page
- Wait for next polling cycle
- Reduce `refreshInterval` prop

## Future Enhancements

- [ ] WebSocket support for real-time updates
- [ ] Push notifications for mobile/desktop
- [ ] User notification preferences UI
- [ ] Notification categories and grouping
- [ ] Digest emails (daily/weekly summary)
- [ ] Read receipts and analytics
- [ ] Notification templates system
- [ ] Multi-language support

---

**Last Updated:** 2024-11-29
**Version:** 1.0.0
