RFP – Educational Management Platform
Base Language: French (English available)
Platform: Web
Current Scope: Phase 1 – Administrative dashboard, reporting module, and role-based
panels
1. Project Overview
This project aims to build a web-based management system for educational institutions.
The platform will manage lesson bookings between teachers and students by integrating
with:


A Booking API that provides scheduled lessons (teacher, student, date, duration)
A French Government API that provides the total number of authorized training
hours per student
The system will synchronize both data sources, calculate total used and remaining hours per
student, and present this information in a centralized dashboard.
In addition to administrative features, the platform will also include dedicated panels for
Admin, Teacher, and Student, supporting schedules, homework submission/management,
and user account operations.
2. Project Objectives




Integrate with the Booking API to retrieve all lesson reservations.
Integrate with the Government API to retrieve authorized training hours per student.
Synchronize all sources and compute used/remaining hours for each student.
Provide a complete Admin Dashboard, reporting, and user management tools.
1



Implement role-based access control (RBAC) with three roles (Admin, Teacher,
Student).
Provide Teacher and Student Panels for schedules, homework management, and
profile settings.
Design the system to be modular and ready for future extensions.
3. User Roles and Permissions
Role Description Access Level
Super
Admin
Full control, manages all system users and
Full Access
data
Admin Manages all students, teachers, schedules,
and reports
Full Access (except system
configuration)
Teacher Views all students, He can assign them to
his student list, manages his student list,
homework, views schedule
Limited Access
Student Views own schedule, submits homework,
manages profile, view his resource
Limited Access
4. Core Features (Phase 1)
4.1 User Management Module (Admin Panel)
Admins can:

Add, edit, activate/deactivate, or delete:
2
○
Students
○
Teachers
○
Admin users

View full details for each user

Assign students to teachers

Access individual schedules for students or teachers

Edit personal and academic information

Manage user roles and permissions

Secure authentication system (JWT-based)
4.2 API Integration Module

Fetch bookings from the external Booking API

Fetch authorized training hours from the Government API

Automated synchronization (daily or configurable)

Store retrieved data in the database with timestamps

Maintain sync logs with error tracking
4.3 Admin Dashboard

View today’s bookings

View global metrics (total students, active teachers, completed lessons)

Track used vs. remaining authorized hours per student

Filter by date, teacher, or student
3

Statistical and visual charts (hours consumed, activity, etc.)

Export reports (Excel, PDF)
4.4 Reporting Module

Generate booking reports for custom periods

Export reports in Excel or PDF

Summaries grouped by student, teacher, or timeframe

Activity logs and sync logs
5. Additional Platform Panels
5.1 Teacher Panel
The teacher interface is divided into three main sections:
A. Schedule

View the teacher’s personal work calendar

View all upcoming and past class appointments

Filter by date or student
B. Students


View all students
He can assign students to his list

Access student homework submissions

Review homework (PDF, Word, Images)
4

Approve, reject, or comment on homework

Send results and feedback to students

Access shared files and resources
C. Account Settings

Update personal profile

Change password

Password recovery workflow
5.2 Student Panel
Students can access:
A. Personal Schedule

View only their own class appointments

Check completed and upcoming lessons
B. Homework Management

Submit homework in PDF, Word, Image formats

View all submitted homework

Delete or replace old submissions

Receive notifications when teachers review homework
C. Profile Settings

Change password

View/edit basic profile information
5
D. Shared Files

Access files shared by teachers or the system

Download or preview documents
6. General System Features

Secure login system with authentication and password recovery

Role-based access (Admin / Teacher / Student)

User account activation and deactivation

Notification system:
○
Teachers notified when students submit homework
○
Students notified when homework is reviewed

Email required for all user account creation

Admin has full control over all teachers and students
7. Technical Stack & Deployment Architecture

## 7.1 Technology Stack

### Backend
- **Runtime**: Node.js + TypeScript
- **Framework**: Next.js API Routes (Serverless Functions)
- **ORM**: Prisma
- **Database**: Vercel Postgres (PostgreSQL)
- **Scheduler**: Vercel Cron Jobs
- **Authentication**: JWT + NextAuth.js

### Frontend
- **Framework**: Next.js (TypeScript)
- **Styling**: TailwindCSS
- **Data Fetching**: React Query or SWR
- **UI**: Fully responsive (desktop & tablet)

### Infrastructure
- **Hosting**: Vercel (Frontend + Backend)
- **Database**: Vercel Postgres
- **File Storage**: Vercel Blob Storage
- **Scheduled Jobs**: Vercel Cron

## 7.2 Deployment Architecture

```
┌─────────────────────────────────────────┐
│         Vercel Edge Network             │
│  (Global CDN - France + Worldwide)      │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         Next.js Application             │
│                                         │
│  ┌──────────────┐  ┌─────────────────┐ │
│  │   Frontend   │  │  API Routes     │ │
│  │  (React/UI)  │  │  (Serverless)   │ │
│  └──────────────┘  └─────────────────┘ │
└─────────────────────────────────────────┘
         ↓                    ↓
┌──────────────────┐  ┌──────────────────┐
│ Vercel Postgres  │  │  Vercel Blob     │
│   (Database)     │  │  (File Storage)  │
└──────────────────┘  └──────────────────┘
         ↓
┌──────────────────────────────────────────┐
│        External APIs                     │
│  • Booking API                           │
│  • French Government API                 │
└──────────────────────────────────────────┘
```

## 7.3 Project Structure

Single Next.js Monorepo:
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

## 7.4 Key Infrastructure Benefits

### All-in-One Platform
- Single deployment for frontend, backend, database, storage, and cron jobs
- Simplified DevOps and reduced complexity
- Unified monitoring and logging

### Serverless Auto-Scaling
- Automatic scaling based on traffic
- No server management required
- Handles traffic spikes during peak usage (homework submission deadlines)

### Global CDN
- Optimized performance for French users
- Low latency worldwide
- Automatic edge caching

### Security
- Built-in DDoS protection
- Automatic SSL/TLS certificates
- Environment secrets encryption
- GDPR compliance (important for French Government API)

### Developer Experience
- Preview deployments for every git push
- Automatic HTTPS certificates
- Environment variable management
- Built-in CI/CD pipeline

## 7.5 Vercel Services Utilization

### 1. Vercel Postgres (Database)
Managed PostgreSQL database integrated with Vercel infrastructure.

**Use for storing:**
- Users (Admin, Teachers, Students)
- Bookings (from Booking API)
- Student authorized hours (from Government API)
- Homework submissions metadata
- Sync logs
- Teacher-student assignments

**Features:**
- Serverless-ready with connection pooling
- Automatic backups and scaling
- Integrated with Vercel infrastructure
- Database branching for preview environments

**Recommended ORM:** Prisma (provides type safety and migration management)

### 2. Vercel Cron Jobs
Serverless scheduled tasks without needing external cron services.

**Use for:**
- Daily synchronization with Booking API (2:00 AM)
- Daily synchronization with Government API (3:00 AM)
- Automated calculation of used/remaining hours (4:00 AM)
- Cleanup of old sync logs
- Scheduled report generation

**Configuration Example:**
```json
{
  "crons": [
    {
      "path": "/api/cron/sync-bookings",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/cron/sync-government-hours",
      "schedule": "0 3 * * *"
    },
    {
      "path": "/api/cron/calculate-hours",
      "schedule": "0 4 * * *"
    }
  ]
}
```

**Security Implementation:**
```typescript
// app/api/cron/sync-bookings/route.ts
export async function GET(request: Request) {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Fetch from Booking API
  // Store in database
  // Log sync status

  return Response.json({ success: true });
}
```

### 3. Vercel Blob Storage
Object storage for large files with automatic CDN distribution.

**Use for:**
- Homework submissions (PDF, Word, Images)
- Shared files and resources from teachers
- User profile images
- Report exports (Excel, PDF)

**Features:**
- Direct uploads from client
- Presigned URLs for secure access
- Automatic CDN distribution
- Automatic image optimization

**Homework Upload Implementation:**
```typescript
// app/api/homework/upload/route.ts
import { put } from '@vercel/blob';

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get('file') as File;

  const blob = await put(file.name, file, {
    access: 'public',
    addRandomSuffix: true,
  });

  // Save metadata to database
  await prisma.homework.create({
    data: {
      studentId: userId,
      teacherId: teacherId,
      fileUrl: blob.url,
      fileName: file.name,
      fileSize: file.size,
    },
  });

  return Response.json({ url: blob.url });
}
```

## 7.6 Environment Variables

### Required Configuration
```bash
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Authentication
JWT_SECRET="your-secret-key"
JWT_EXPIRATION="7d"
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="https://yourdomain.com"

# External APIs
BOOKING_API_URL="https://booking-api.example.com"
BOOKING_API_KEY="your-api-key"
GOVERNMENT_API_URL="https://government-api.example.fr"
GOVERNMENT_API_KEY="your-api-key"

# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN="vercel_blob_..."

# Cron Security
CRON_SECRET="your-cron-secret"

# Email (for notifications)
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="your-email@example.com"
SMTP_PASSWORD="your-password"
```

## 7.7 Deployment Environments

### Production
- Main branch deployment
- Production database
- Production API keys
- Domain: yourdomain.com

### Preview (Staging)
- Automatic deployments for pull requests
- Separate database or database branching
- Test API keys
- Auto-generated preview URLs

### Development
- Local development environment
- Local database or development database
- Mock API responses
- localhost:3000
8. Database Schema (Prisma)

## 8.1 Core Models

```prisma
// prisma/schema.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id            String   @id @default(cuid())
  email         String   @unique
  name          String
  passwordHash  String
  role          Role
  active        Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  teacher       Teacher?
  student       Student?
}

enum Role {
  SUPER_ADMIN
  ADMIN
  TEACHER
  STUDENT
}

model Teacher {
  id              String   @id @default(cuid())
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id])

  students        StudentTeacher[]
  bookings        Booking[]
  homework        Homework[]

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model Student {
  id                    String   @id @default(cuid())
  userId                String   @unique
  user                  User     @relation(fields: [userId], references: [id])
  governmentId          String?  @unique
  totalAllowedHours     Float    @default(0)
  usedHours             Float    @default(0)

  teachers              StudentTeacher[]
  bookings              Booking[]
  homework              Homework[]

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}

model StudentTeacher {
  id          String   @id @default(cuid())
  studentId   String
  teacherId   String
  student     Student  @relation(fields: [studentId], references: [id])
  teacher     Teacher  @relation(fields: [teacherId], references: [id])
  assignedAt  DateTime @default(now())

  @@unique([studentId, teacherId])
}

model Booking {
  id          String   @id @default(cuid())
  studentId   String
  teacherId   String
  student     Student  @relation(fields: [studentId], references: [id])
  teacher     Teacher  @relation(fields: [teacherId], references: [id])

  date        DateTime
  duration    Float
  source      String
  status      String   @default("scheduled")

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Homework {
  id          String   @id @default(cuid())
  studentId   String
  teacherId   String
  student     Student  @relation(fields: [studentId], references: [id])
  teacher     Teacher  @relation(fields: [teacherId], references: [id])

  fileUrl     String
  fileName    String
  fileSize    Int
  status      HomeworkStatus @default(PENDING)
  feedback    String?

  submittedAt DateTime @default(now())
  reviewedAt  DateTime?
  updatedAt   DateTime @updatedAt
}

enum HomeworkStatus {
  PENDING
  APPROVED
  REJECTED
  NEEDS_REVISION
}

model SyncLog {
  id            String   @id @default(cuid())
  source        String
  status        String
  message       String?
  lastSyncTime  DateTime @default(now())

  createdAt     DateTime @default(now())
}
```

## 8.2 Entity Relationships

| Entity | Key Fields | Description |
|--------|-----------|-------------|
| **User** | id, email, name, role, passwordHash, active | System users with role-based access |
| **Teacher** | id, userId, students, bookings, homework | Teacher profiles linked to users |
| **Student** | id, userId, governmentId, totalAllowedHours, usedHours | Student profiles with hour tracking |
| **StudentTeacher** | studentId, teacherId, assignedAt | Many-to-many relationship between students and teachers |
| **Booking** | id, studentId, teacherId, date, duration, source | Lesson bookings from Booking API |
| **Homework** | id, studentId, teacherId, fileUrl, status, feedback | Homework submissions and reviews |
| **SyncLog** | id, source, status, message, lastSyncTime | API synchronization logs |

---

## 8.3 Deployment Steps

### Initial Setup

#### 1. Install Vercel CLI
```bash
# Install Vercel CLI globally
npm i -g vercel

# Login to Vercel
vercel login

# Link project to Vercel
vercel link
```

#### 2. Configure Vercel Postgres
```bash
# Create Vercel Postgres database
vercel postgres create

# This will automatically add DATABASE_URL and DIRECT_URL to your environment variables
# Pull environment variables to local
vercel env pull .env
```

#### 3. Configure Vercel Blob Storage
```bash
# Enable Blob storage in Vercel dashboard
# Navigate to: Project Settings → Storage → Create Store → Blob
# The BLOB_READ_WRITE_TOKEN will be automatically added to environment variables
```

#### 4. Set Up Environment Variables
Add all required environment variables in Vercel Dashboard:
- Navigate to: Project Settings → Environment Variables
- Add variables for Production, Preview, and Development environments

#### 5. Deploy Application
```bash
# Deploy to preview environment
vercel

# Deploy to production
vercel --prod
```

#### 6. Run Database Migrations
```bash
# Generate Prisma client
npx prisma generate

# Push schema to database (for initial setup)
npx prisma db push

# Or run migrations (for production)
npx prisma migrate deploy
```

#### 7. Seed Initial Data (Optional)
```bash
# Create seed script
npx prisma db seed
```

### Continuous Deployment

#### Automatic Deployments
- **Production**: Automatic deployment on push to `main` branch
- **Preview**: Automatic deployment for every pull request
- **Development**: Local development with `npm run dev`

#### Git Workflow
```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "Add new feature"

# Push to remote (triggers preview deployment)
git push origin feature/new-feature

# Create pull request → Preview deployment URL generated
# After review, merge to main → Production deployment
```

---

## 8.4 Security Best Practices

### 1. Environment Variables
- **Never commit secrets to git**
- Store all sensitive data in Vercel Environment Variables
- Use different values for Production, Preview, and Development
- Rotate API keys and secrets regularly

### 2. API Authentication
- Use JWT with proper expiration times
- Implement refresh token mechanism
- Validate tokens on every API request
- Use NextAuth.js for session management

### 3. CORS Configuration
```typescript
// middleware.ts
export function middleware(request: Request) {
  const allowedOrigins = process.env.NODE_ENV === 'production'
    ? ['https://yourdomain.com']
    : ['http://localhost:3000'];

  // Verify origin
  // Add security headers
}
```

### 4. Rate Limiting
Implement rate limiting for authentication endpoints:
```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { kv } from '@vercel/kv';

export const ratelimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
});
```

### 5. File Upload Validation
- Validate file types (PDF, DOCX, Images only)
- Limit file sizes (e.g., max 10MB)
- Scan for malicious content
- Use presigned URLs for secure access

### 6. Database Security
- Use Prisma with parameterized queries (prevents SQL injection)
- Enable row-level security (RLS) in PostgreSQL
- Regular backups (automatic with Vercel Postgres)
- Encrypt sensitive data at rest

### 7. HTTPS Only
- Enforce HTTPS in production (automatic with Vercel)
- Use secure cookies with `httpOnly` and `secure` flags
- Implement HSTS headers

### 8. Role-Based Access Control (RBAC)
```typescript
// lib/auth.ts
export function checkPermission(user: User, action: string) {
  const permissions = {
    SUPER_ADMIN: ['*'],
    ADMIN: ['manage:users', 'view:reports', 'manage:bookings'],
    TEACHER: ['view:students', 'manage:homework', 'view:schedule'],
    STUDENT: ['view:own-schedule', 'submit:homework', 'view:own-profile'],
  };

  return permissions[user.role].includes(action) ||
         permissions[user.role].includes('*');
}
```

---

## 8.5 Monitoring and Logging

### Built-in Vercel Features
- **Real-time Logs**: View function execution logs in Vercel Dashboard
- **Function Execution Time**: Monitor serverless function performance
- **Error Tracking**: Automatic error detection and alerts
- **Traffic Analytics**: Track page views and API requests
- **Web Vitals**: Monitor Core Web Vitals for performance

### Recommended Additional Tools

#### 1. Sentry (Error Tracking)
```typescript
// sentry.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

#### 2. Axiom (Log Aggregation)
```typescript
// lib/logger.ts
import { Logger } from 'next-axiom';

export const logger = new Logger();

// Usage
logger.info('User logged in', { userId, email });
```

#### 3. Vercel Analytics (Performance)
```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### Custom Logging Strategy
```typescript
// lib/sync-logger.ts
export async function logSync(source: string, status: string, message?: string) {
  await prisma.syncLog.create({
    data: {
      source,
      status,
      message,
      lastSyncTime: new Date(),
    },
  });

  // Also log to external service
  logger.info('Sync completed', { source, status, message });
}
```

---

## 8.6 Scaling Considerations

### Phase 1 (MVP)
**Infrastructure:**
- Vercel Hobby or Pro plan
- Small Vercel Postgres instance (1GB storage, 60 compute hours)
- Basic Blob storage (~10GB)

**Expected Load:**
- ~50-100 concurrent users
- ~1,000 API requests/day
- ~100 file uploads/day

### Phase 2 (Growth)
**Infrastructure:**
- Vercel Pro plan
- Medium Postgres instance (10GB storage, 100 compute hours)
- Increased Blob storage (~50GB)
- Implement caching with Vercel KV

**Expected Load:**
- ~500-1,000 concurrent users
- ~10,000 API requests/day
- ~500 file uploads/day

**Optimizations:**
- Enable edge caching for static content
- Implement database query optimization
- Use React Query for client-side caching
- Add Redis caching for frequently accessed data

### Phase 3 (Enterprise)
**Infrastructure:**
- Vercel Enterprise plan
- Large Postgres instance or dedicated cluster
- High Blob storage (~200GB+)
- Vercel KV for caching
- Consider database read replicas

**Expected Load:**
- ~5,000+ concurrent users
- ~100,000+ API requests/day
- ~2,000+ file uploads/day

**Advanced Optimizations:**
- Implement CDN caching strategies
- Database connection pooling optimization
- Horizontal scaling with edge functions
- Load balancing and geographic distribution
- Advanced analytics and predictive scaling

---

## 8.7 Cost Estimation

### Development/Testing Environment
| Service | Cost |
|---------|------|
| Vercel Hobby Plan | $0 (free tier) |
| Vercel Postgres (Small) | ~$20-50/month |
| Vercel Blob Storage | ~$5-20/month (pay per use) |
| **Total** | **~$25-70/month** |

### Production (Small Scale - Phase 1)
| Service | Cost |
|---------|------|
| Vercel Pro Plan | $20/user/month |
| Vercel Postgres (Medium) | ~$50-100/month |
| Vercel Blob Storage | ~$20-50/month |
| Vercel KV (optional) | ~$10-30/month |
| Monitoring (Sentry, Axiom) | ~$20-50/month |
| **Total** | **~$120-250/month** |

### Production (Medium Scale - Phase 2)
| Service | Cost |
|---------|------|
| Vercel Pro Plan | $20/user/month (2-3 users) |
| Vercel Postgres (Large) | ~$100-200/month |
| Vercel Blob Storage | ~$50-100/month |
| Vercel KV | ~$30-50/month |
| Monitoring & Analytics | ~$50-100/month |
| **Total** | **~$300-600/month** |

### Production (Enterprise - Phase 3)
| Service | Cost |
|---------|------|
| Vercel Enterprise Plan | Custom pricing (~$500-1,000/month) |
| Vercel Postgres (Enterprise) | ~$200-500/month |
| Vercel Blob Storage | ~$100-300/month |
| Vercel KV | ~$50-100/month |
| Advanced Monitoring | ~$100-200/month |
| **Total** | **~$950-2,100+/month** |

**Note:** Costs are estimates and may vary based on actual usage. Vercel offers pay-as-you-go pricing for most services.

---

## 8.8 Support and Resources

### Official Documentation
- **Vercel**: https://vercel.com/docs
- **Next.js**: https://nextjs.org/docs
- **Prisma**: https://www.prisma.io/docs
- **Vercel Postgres**: https://vercel.com/docs/storage/vercel-postgres
- **Vercel Blob**: https://vercel.com/docs/storage/vercel-blob
- **Vercel Cron**: https://vercel.com/docs/cron-jobs

### Community Resources
- Vercel Discord Community
- Next.js GitHub Discussions
- Stack Overflow
- Prisma Community Slack

### Best Practices Guides
- Next.js Performance Optimization
- Vercel Deployment Best Practices
- Prisma Query Optimization
- React Query Patterns

---

9. Development Phases
Phase 1 (MVP)

Admin panel

API integrations

Dashboard & reporting

Teacher panel

Student panel

Authentication & roles
Deliverable: Fully functional educational management system
Phase 2

Notifications enhancement

File sharing module upgrade

Teacher performance metrics
Deliverable: Extended platform with richer interactions
Phase 3

Predictive analytics

Smart recommendations

Advanced reporting
Deliverable: Full-scale educational ecosystem
8
10. Key Functional Requirements





Secure and stable API integrations
Scheduled cron synchronization
Full logging and monitoring
Clean, modular, maintainable codebase
Scalable architecture to support future versions
9