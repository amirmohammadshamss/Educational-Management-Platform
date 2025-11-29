# Email Service Documentation

This module provides a comprehensive email service for the Educational Management Platform, including SMTP configuration, email templates, and notification management.

## Features

- ✉️ SMTP email sending with nodemailer
- 🔄 Automatic retry logic with exponential backoff
- 📧 Pre-built responsive email templates (French language)
- 🎨 Mobile-responsive HTML emails with platform branding
- 📝 Email logging for tracking sent emails
- 🔒 User notification preference checking
- 🌐 Plain text alternatives for all HTML emails

## Installation

The required packages are already installed:
```bash
npm install nodemailer @types/nodemailer
```

## Configuration

Add the following environment variables to your `.env` file:

```bash
# Email Configuration (SMTP)
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_SECURE="false"  # true for 465, false for other ports
SMTP_USER="your-email@example.com"
SMTP_PASSWORD="your-smtp-password"
SMTP_FROM="noreply@yourplatform.com"

# Application URL (used in email links)
NEXTAUTH_URL="https://yourdomain.com"
```

### Development Setup

For development and testing, use one of these services:

**Option 1: Ethereal Email (Fake SMTP)**
1. Visit https://ethereal.email
2. Click "Create Ethereal Account"
3. Use the provided credentials in your `.env`
4. View sent emails at https://ethereal.email/messages

**Option 2: Mailtrap (Email Testing)**
1. Sign up at https://mailtrap.io
2. Get SMTP credentials from your inbox
3. Add to `.env` file

Example Ethereal config:
```bash
SMTP_HOST="smtp.ethereal.email"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-ethereal-user@ethereal.email"
SMTP_PASSWORD="your-ethereal-password"
```

### Production Setup

For production, use a reliable email service:

- **SendGrid** (recommended): https://sendgrid.com
- **Mailgun**: https://mailgun.com
- **AWS SES**: https://aws.amazon.com/ses/
- **Postmark**: https://postmarkapp.com

## Usage

### Basic Email Sending

```typescript
import { sendEmail } from '@/lib/email';

const result = await sendEmail({
  to: 'student@example.com',
  subject: 'Test Email',
  html: '<p>Hello World!</p>',
  text: 'Hello World!',
});

if (result.success) {
  console.log('Email sent:', result.messageId);
} else {
  console.error('Email failed:', result.error);
}
```

### Using Pre-built Notification Functions

The easiest way to send emails is using the notification wrapper functions:

```typescript
import {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendHomeworkReviewedEmail,
  sendClassReminderEmail,
  sendLowHoursWarningEmail,
  sendAssignmentNotificationEmail,
} from '@/lib/email';

// Welcome new user
await sendWelcomeEmail(
  userId,
  'user@example.com',
  'Jean Dupont',
  'STUDENT'
);

// Password reset
await sendPasswordResetEmail(
  userId,
  'user@example.com',
  'Jean Dupont',
  'https://yourplatform.com/reset-password?token=xxx'
);

// Homework reviewed
await sendHomeworkReviewedEmail(
  studentId,
  'student@example.com',
  'Jean Dupont',
  'Marie Martin',
  'APPROVED',
  'Excellent travail!'
);

// Class reminder
await sendClassReminderEmail(
  studentId,
  'student@example.com',
  'Jean Dupont',
  'Marie Martin',
  '15 décembre 2024',
  '14:00'
);

// Low hours warning
await sendLowHoursWarningEmail(
  studentId,
  'student@example.com',
  'Jean Dupont',
  5.5
);

// Assignment notification
await sendAssignmentNotificationEmail(
  studentId,
  'student@example.com',
  'Jean Dupont',
  'Marie Martin'
);
```

### Using Email Templates Directly

```typescript
import { welcomeEmail, sendEmail } from '@/lib/email';

const template = welcomeEmail('Jean Dupont', 'STUDENT');

await sendEmail({
  to: 'user@example.com',
  subject: template.subject,
  html: template.html,
  text: template.text,
});
```

## Available Email Templates

### 1. Welcome Email
Sent when a new user account is created.

```typescript
welcomeEmail(userName: string, userRole: string): EmailTemplate
```

### 2. Password Reset Email
Sent when a user requests a password reset.

```typescript
passwordResetEmail(userName: string, resetLink: string): EmailTemplate
```

### 3. Homework Reviewed Email
Sent when a teacher reviews student homework.

```typescript
homeworkReviewedEmail(
  studentName: string,
  teacherName: string,
  status: string,
  feedback?: string
): EmailTemplate
```

### 4. Class Reminder Email
Sent to remind students of upcoming classes.

```typescript
classReminderEmail(
  studentName: string,
  teacherName: string,
  date: string,
  time: string
): EmailTemplate
```

### 5. Low Hours Warning Email
Sent when a student has few remaining training hours.

```typescript
lowHoursWarningEmail(studentName: string, remainingHours: number): EmailTemplate
```

### 6. Assignment Notification Email
Sent when a new homework assignment is created.

```typescript
assignmentNotificationEmail(studentName: string, teacherName: string): EmailTemplate
```

## Integration Examples

### Example 1: Send Welcome Email After User Creation

```typescript
// app/api/auth/register/route.ts
import { sendWelcomeEmail } from '@/lib/email';

export async function POST(request: Request) {
  const { email, name, role } = await request.json();

  // Create user...
  const user = await prisma.user.create({
    data: { email, name, role, passwordHash },
  });

  // Send welcome email
  await sendWelcomeEmail(user.id, user.email, user.name || 'User', user.role);

  return Response.json({ success: true });
}
```

### Example 2: Send Homework Review Notification

```typescript
// app/api/homework/[id]/review/route.ts
import { sendHomeworkReviewedEmail } from '@/lib/email';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
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
  await sendHomeworkReviewedEmail(
    homework.student.userId,
    homework.student.user.email,
    homework.student.user.name || 'Student',
    homework.teacher.user.name || 'Teacher',
    status,
    feedback
  );

  return Response.json({ success: true });
}
```

### Example 3: Daily Class Reminders (Cron Job)

```typescript
// app/api/cron/send-class-reminders/route.ts
import { sendClassReminderEmail } from '@/lib/email';

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
      date: {
        gte: tomorrow,
        lt: nextDay,
      },
      status: 'SCHEDULED',
    },
    include: {
      student: { include: { user: true } },
      teacher: { include: { user: true } },
    },
  });

  // Send reminders
  for (const booking of bookings) {
    await sendClassReminderEmail(
      booking.student.userId,
      booking.student.user.email,
      booking.student.user.name || 'Student',
      booking.teacher.user.name || 'Teacher',
      booking.date.toLocaleDateString('fr-FR'),
      booking.date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    );
  }

  return Response.json({ sent: bookings.length });
}
```

## Email Logging

All emails are automatically logged with the following information:
- Recipient email address
- Subject
- Notification type
- Success/failure status
- Error message (if failed)
- Message ID (if successful)
- Timestamp

Currently, logs are written to the console. To persist logs, add an `EmailLog` table to your Prisma schema:

```prisma
model EmailLog {
  id        String   @id @default(cuid())
  to        String
  subject   String
  type      String
  success   Boolean
  error     String?
  messageId String?
  createdAt DateTime @default(now())

  @@index([createdAt])
  @@index([success])
  @@map("email_logs")
}
```

Then uncomment the database logging in `send-notification.ts:33`.

## User Notification Preferences

The system includes placeholder code for checking user notification preferences. To implement this feature:

1. Add a notification preferences table to Prisma schema:

```prisma
model UserNotificationPreferences {
  id                         String  @id @default(cuid())
  userId                     String  @unique
  emailEnabled               Boolean @default(true)
  welcomeEnabled             Boolean @default(true)
  passwordResetEnabled       Boolean @default(true)
  homeworkReviewedEnabled    Boolean @default(true)
  classReminderEnabled       Boolean @default(true)
  lowHoursWarningEnabled     Boolean @default(true)
  assignmentNotificationEnabled Boolean @default(true)

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_notification_preferences")
}
```

2. Uncomment the preference checking code in `send-notification.ts:48-53`.

## Testing Email Connection

Verify your SMTP configuration:

```typescript
import { verifyEmailConnection } from '@/lib/email';

const isConnected = await verifyEmailConnection();
if (isConnected) {
  console.log('SMTP connection successful!');
} else {
  console.error('SMTP connection failed!');
}
```

## Troubleshooting

### Emails not sending

1. Check SMTP credentials in `.env`
2. Verify SMTP_HOST and SMTP_PORT are correct
3. Check if SMTP_SECURE matches your port (true for 465, false for 587)
4. Review logs for error messages
5. Test connection with `verifyEmailConnection()`

### Emails going to spam

1. Use a verified sending domain
2. Set up SPF, DKIM, and DMARC records
3. Use a reputable email service (SendGrid, Mailgun, etc.)
4. Avoid spam trigger words in subject/content
5. Include unsubscribe link for compliance

### Rate limiting

If sending many emails, consider implementing a queue system:
- Use a job queue like Bull or BullMQ
- Batch emails and add delays between batches
- Monitor your email service provider's rate limits

## Future Enhancements

- [ ] Email queue system for rate limiting
- [ ] Database logging of sent emails
- [ ] User notification preferences UI
- [ ] Email analytics and tracking
- [ ] A/B testing for email templates
- [ ] Multi-language support (English translations)
- [ ] Email preview API endpoint
- [ ] Scheduled email sending

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the code comments in the module files
3. Consult the nodemailer documentation: https://nodemailer.com
4. Contact the development team

---

**Last Updated:** 2024-11-29
**Version:** 1.0.0
