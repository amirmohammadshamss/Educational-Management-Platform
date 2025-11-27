# Educational Management Platform - Claude Code Guide

## Project Overview

This is a **web-based Educational Management Platform** designed for French educational institutions to manage lesson bookings, track student training hours, and facilitate homework submission between teachers and students.

**Base Language:** French (English support available)
**Platform:** Web-based (Next.js)
**Current Phase:** Phase 1 - MVP Development

## Core Purpose

The platform integrates with two external APIs:
1. **Booking API** - Provides scheduled lessons (teacher, student, date, duration)
2. **French Government API** - Provides total authorized training hours per student

It synchronizes these data sources to:
- Calculate used vs. remaining hours per student
- Display centralized dashboards for different user roles
- Manage homework submissions and reviews
- Provide scheduling and reporting capabilities

## Tech Stack

### Backend
- **Runtime:** Node.js + TypeScript
- **Framework:** Next.js API Routes (Serverless Functions)
- **ORM:** Prisma
- **Database:** Vercel Postgres (PostgreSQL)
- **Scheduler:** Vercel Cron Jobs
- **Authentication:** JWT + NextAuth.js

### Frontend
- **Framework:** Next.js (TypeScript)
- **Styling:** TailwindCSS
- **Data Fetching:** React Query or SWR
- **UI:** Fully responsive (desktop & tablet)

### Infrastructure
- **Hosting:** Vercel (Full-stack deployment)
- **Database:** Vercel Postgres
- **File Storage:** Vercel Blob Storage
- **Scheduled Jobs:** Vercel Cron Jobs

## Project Structure

```
/
├── app/
│   ├── (admin)/           # Admin dashboard routes
│   ├── (teacher)/         # Teacher panel routes
│   ├── (student)/         # Student panel routes
│   └── api/
│       ├── auth/          # Authentication endpoints
│       ├── bookings/      # Booking management
│       ├── students/      # Student operations
│       ├── teachers/      # Teacher operations
│       ├── homework/      # Homework submission/review
│       └── cron/          # Scheduled sync jobs
├── components/            # Shared React components
├── lib/                   # Utilities and helpers
├── prisma/
│   └── schema.prisma      # Database schema
└── public/                # Static assets
```

## User Roles & Permissions

### 1. Super Admin
- **Access Level:** Full system control
- **Capabilities:** Manages all users, system configuration, and data

### 2. Admin
- **Access Level:** Full access (except system configuration)
- **Capabilities:**
  - Manage students, teachers, schedules
  - Generate reports
  - View all data
  - Assign students to teachers

### 3. Teacher
- **Access Level:** Limited access
- **Capabilities:**
  - View all students, assign to personal list
  - Manage homework submissions/reviews
  - View personal schedule
  - Access assigned students' information

### 4. Student
- **Access Level:** Limited access (own data only)
- **Capabilities:**
  - View personal schedule
  - Submit homework
  - View homework feedback
  - Access shared resources
  - Manage profile

## Core Features (Phase 1)

### 1. User Management Module (Admin)
- Add, edit, activate/deactivate, delete users
- Assign students to teachers
- Manage roles and permissions
- View user schedules and details

### 2. API Integration Module
- Fetch bookings from Booking API
- Fetch authorized hours from Government API
- Automated daily synchronization
- Sync logging and error tracking

### 3. Admin Dashboard
- Today's bookings overview
- Global metrics (students, teachers, lessons)
- Track used vs. remaining hours
- Filter by date, teacher, or student
- Statistical charts
- Export reports (Excel, PDF)

### 4. Reporting Module
- Generate booking reports for custom periods
- Export in Excel or PDF
- Group by student, teacher, or timeframe
- Activity and sync logs

### 5. Teacher Panel
- **Schedule:** View work calendar and class appointments
- **Students:** Manage student list, review homework, provide feedback
- **Account:** Update profile and password

### 6. Student Panel
- **Schedule:** View personal class appointments
- **Homework:** Submit, view, and manage homework
- **Profile:** Update personal information
- **Resources:** Access shared files from teachers

## Database Schema (Prisma)

### Key Models

#### User
- Core authentication and profile data
- Links to Teacher or Student profiles based on role
- Fields: id, email, name, passwordHash, role, active

#### Teacher
- Extended teacher profile
- Relations: students (many-to-many), bookings, homework

#### Student
- Extended student profile
- Hour tracking: totalAllowedHours, usedHours
- Fields: governmentId for API integration
- Relations: teachers (many-to-many), bookings, homework

#### Booking
- Lesson reservations from Booking API
- Links teacher and student
- Fields: date, duration, source, status

#### Homework
- File submissions and reviews
- Fields: fileUrl, fileName, fileSize, status, feedback
- Status: PENDING, APPROVED, REJECTED, NEEDS_REVISION

#### SyncLog
- API synchronization tracking
- Fields: source, status, message, lastSyncTime

## Key Technical Considerations

### Security
- JWT-based authentication
- Role-based access control (RBAC)
- Secure file upload validation (PDF, DOCX, Images)
- Environment variable protection
- HTTPS enforcement
- SQL injection prevention via Prisma

### File Management
- Vercel Blob Storage for homework files
- Support for PDF, Word, and image formats
- File size limits and validation
- Presigned URLs for secure access

### Scheduled Jobs (Vercel Cron)
- **2:00 AM:** Sync with Booking API
- **3:00 AM:** Sync with Government API
- **4:00 AM:** Calculate used/remaining hours
- Cron endpoints protected with secret tokens

### API Integration Pattern
```typescript
// Secure cron endpoint example
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Perform sync operation
  // Log results

  return Response.json({ success: true });
}
```

### Environment Variables
```bash
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Authentication
JWT_SECRET="your-secret-key"
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="https://yourdomain.com"

# External APIs
BOOKING_API_URL="https://booking-api.example.com"
BOOKING_API_KEY="your-api-key"
GOVERNMENT_API_URL="https://government-api.example.fr"
GOVERNMENT_API_KEY="your-api-key"

# Vercel Services
BLOB_READ_WRITE_TOKEN="vercel_blob_..."
CRON_SECRET="your-cron-secret"

# Email
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="your-email@example.com"
SMTP_PASSWORD="your-password"
```

## Development Workflow

### Local Development
1. Install dependencies: `npm install`
2. Set up environment variables: `vercel env pull .env`
3. Generate Prisma client: `npx prisma generate`
4. Run migrations: `npx prisma db push` or `npx prisma migrate dev`
5. Start dev server: `npm run dev`

### Deployment
- **Production:** Push to `main` branch → Automatic deployment
- **Preview:** Create pull request → Preview deployment with unique URL
- **Database Migrations:** Run `npx prisma migrate deploy` in production

## Code Quality Standards

### TypeScript
- Strict mode enabled
- No `any` types unless absolutely necessary
- Proper type definitions for all API responses
- Use Prisma generated types

### Components
- Functional components with TypeScript
- Proper prop typing
- Separation of concerns (UI vs. logic)
- Reusable component library

### API Routes
- Proper error handling
- Consistent response format
- Authentication middleware
- Input validation

### Security Best Practices
- Never commit secrets to git
- Validate all user inputs
- Sanitize file uploads
- Implement rate limiting for auth endpoints
- Use parameterized queries (Prisma handles this)
- CORS configuration for production

## Common Patterns

### Protected API Route
```typescript
import { getServerSession } from 'next-auth';

export async function GET(request: Request) {
  const session = await getServerSession();

  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check role permissions
  if (!checkPermission(session.user, 'view:reports')) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Process request
}
```

### File Upload (Homework)
```typescript
import { put } from '@vercel/blob';

const blob = await put(file.name, file, {
  access: 'public',
  addRandomSuffix: true,
});

await prisma.homework.create({
  data: {
    studentId,
    teacherId,
    fileUrl: blob.url,
    fileName: file.name,
    fileSize: file.size,
  },
});
```

## Phase Roadmap

### Phase 1 (MVP) - Current
- Admin panel
- API integrations
- Dashboard & reporting
- Teacher panel
- Student panel
- Authentication & roles

### Phase 2 (Future)
- Enhanced notifications
- File sharing module upgrade
- Teacher performance metrics

### Phase 3 (Future)
- Predictive analytics
- Smart recommendations
- Advanced reporting

## Important Notes for Claude Code

1. **Language:** Base language is French, but code and documentation should be in English
2. **Architecture:** Serverless-first approach using Vercel platform features
3. **Modularity:** Code should be modular and maintainable for future phases
4. **Logging:** Comprehensive logging for all API synchronizations and errors
5. **Testing:** Consider test coverage for critical business logic
6. **Performance:** Optimize for serverless cold starts and database queries
7. **Scalability:** Design with future growth in mind (see scaling considerations in main doc)

## Resources

- **Main Requirements:** See "Educational Management Platform.md"
- **Deployment Guide:** See "VERCEL_DEPLOYMENT_GUIDE.md" (if exists)
- **Tasks & Prompts:** See "PROJECT_TASKS_AND_PROMPTS.md" (if exists)

## Questions to Consider During Development

1. **Data Sync:** How should we handle conflicts between Booking API and Government API data?
2. **Hour Calculation:** Should used hours be calculated in real-time or cached?
3. **Notifications:** What triggers should send email notifications?
4. **File Retention:** How long should homework files be retained?
5. **Error Recovery:** What should happen when API sync fails?
6. **Multi-language:** How deep should French/English support go?

---

**Last Updated:** 2025-11-27
**Project Status:** Initial Setup - Ready for Development
