# Vercel Deployment Guide - Educational Management Platform

## Overview
This document outlines the recommended Vercel services and deployment strategy for the Educational Management Platform as described in the RFP.

---

## Recommended Vercel Services

### 1. Vercel (Frontend + Backend)
Deploy as a **monorepo** with:
- **Next.js App** (Frontend) - Hosted on Vercel's edge network
- **Next.js API Routes** (Backend) - Serverless functions

**Benefits:**
- Unified deployment pipeline
- Automatic HTTPS and SSL certificates
- Global CDN for fast content delivery
- Built-in preview deployments for testing

### 2. Vercel Postgres (Database)
- Managed PostgreSQL database integrated with Vercel infrastructure
- Serverless-ready with connection pooling
- Automatic backups and scaling

**Use for storing:**
- Users (Admin, Teachers, Students)
- Bookings (from Booking API)
- Student authorized hours (from Government API)
- Homework submissions
- Sync logs
- Teacher-student assignments

**Recommended ORM:** Prisma (as mentioned in RFP tech stack)

### 3. Vercel Cron Jobs
- Serverless scheduled tasks
- No need for external cron services or always-running servers

**Use for:**
- Daily synchronization with Booking API
- Daily synchronization with Government API
- Automated calculation of used/remaining hours
- Cleanup of old sync logs
- Scheduled report generation

**Configuration:**
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
    }
  ]
}
```

### 4. Vercel Blob Storage
- Object storage for large files
- Optimized for uploads and downloads
- Automatic CDN distribution

**Use for:**
- Homework submissions (PDF, Word, Images)
- Shared files and resources from teachers
- User profile images
- Report exports (Excel, PDF)

**Features:**
- Direct uploads from client
- Presigned URLs for secure access
- Automatic image optimization



## Recommended Project Structure



 Single Next.js App
```
/
├── app/
│   ├── (admin)/
│   ├── (teacher)/
│   ├── (student)/
│   └── api/
│       ├── auth/
│       ├── bookings/
│       ├── students/
│       ├── teachers/
│       ├── homework/
│       └── cron/
├── components/
├── lib/
├── prisma/
│   └── schema.prisma
└── public/
```

---

## Deployment Architecture

### Hosting Model
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

---

## Key Benefits

### 1. All-in-One Deployment
- Single platform for frontend, backend, database, storage, and cron jobs
- Simplified DevOps and reduced complexity
- Unified monitoring and logging

### 2. Serverless Auto-Scaling
- Automatic scaling based on traffic
- No server management required
- Handles traffic spikes during peak usage (e.g., homework submission deadlines)

### 3. Global CDN
- Fast performance for French users
- Low latency worldwide
- Automatic edge caching

### 4. Developer Experience
- Preview deployments for every git push
- Automatic HTTPS certificates
- Environment variable management
- Built-in CI/CD pipeline

### 5. Cost-Effective
- Pay-as-you-go pricing
- No costs for idle time
- Free tier available for development/testing

### 6. Security
- Built-in DDoS protection
- Automatic SSL/TLS
- Environment secrets encryption
- Compliance with GDPR (important for French Government API)

---

## Deployment Environments

### 1. Production
- Main branch deployment
- Production database
- Production API keys

### 2. Preview (Staging)
- Automatic deployments for pull requests
- Separate database or database branching
- Test API keys

### 3. Development
- Local development environment
- Local database or development database
- Mock API responses

---

## Environment Variables Configuration

### Required Environment Variables
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

# Email (for notifications)
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="your-email@example.com"
SMTP_PASSWORD="your-password"

# Optional: Vercel KV
KV_REST_API_URL="https://..."
KV_REST_API_TOKEN="..."
```

---

## Cron Job Implementation

### API Sync Jobs

#### 1. Booking API Sync (`/api/cron/sync-bookings`)
```typescript
// app/api/cron/sync-bookings/route.ts
export async function GET(request: Request) {
  // Verify cron secret
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

#### 2. Government API Sync (`/api/cron/sync-government-hours`)
Similar implementation for fetching authorized training hours

### Vercel Cron Configuration
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

---

## File Upload Strategy

### Homework Submission Flow
1. Student initiates upload from frontend
2. Frontend requests presigned URL from API
3. Frontend uploads directly to Vercel Blob
4. Frontend sends blob URL to API
5. API stores metadata in database

### Implementation
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

  // Save to database
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

---

## Database Schema (Prisma)

### Core Models
```prisma
// packages/database/prisma/schema.prisma

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

---

## Deployment Steps

### 1. Initial Setup
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link project
vercel link
```

### 2. Configure Database
```bash
# Install Vercel Postgres
vercel postgres create

# Get connection string
vercel env pull
```

### 3. Configure Blob Storage
```bash
# Enable Blob storage in Vercel dashboard
# Add BLOB_READ_WRITE_TOKEN to environment variables
```

### 4. Deploy
```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### 5. Run Migrations
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy
```

---

## Monitoring and Logging

### Built-in Vercel Features
- Real-time logs
- Function execution time
- Error tracking
- Traffic analytics

### Recommended Additional Tools
- **Sentry**: Error tracking and monitoring
- **Axiom**: Log aggregation and analysis
- **Vercel Analytics**: Web vitals and performance

---

## Scaling Considerations

### Phase 1 (MVP)
- Vercel Hobby or Pro plan
- Small Vercel Postgres instance
- Basic Blob storage

### Phase 2 & 3
- Vercel Enterprise plan (if needed)
- Larger Postgres instance
- Consider database read replicas
- Implement caching strategies with Vercel KV

---

<!-- ## Alternative Deployment Options -->

<!-- ### Option 1: Full Vercel Stack (Recommended) -->
- **Frontend**: Vercel
- **Backend**: Next.js API Routes
- **Database**: Vercel Postgres
- **Storage**: Vercel Blob
- **Cron**: Vercel Cron



## Cost Estimation (Monthly)

### Development/Testing
- Vercel Hobby Plan: $0 (free tier)
- Vercel Postgres: ~$20-50
- Vercel Blob: Pay per use (~$5-20)
- **Total**: ~$25-70/month

### Production (Small Scale)
- Vercel Pro Plan: $20/user/month
- Vercel Postgres: ~$50-100
- Vercel Blob: ~$20-50
- Vercel KV (optional): ~$10-30
- **Total**: ~$100-200/month

### Production (Medium Scale)
- Vercel Enterprise: Custom pricing
- Larger database instances
- Higher bandwidth
- **Total**: $500-1000+/month

---

## Security Best Practices

1. **Environment Variables**: Never commit secrets to git
2. **API Authentication**: Use JWT with proper expiration
3. **CORS Configuration**: Restrict origins in production
4. **Rate Limiting**: Implement for authentication endpoints
5. **File Upload Validation**: Check file types and sizes
6. **Database Security**: Use Prisma with parameterized queries
7. **HTTPS Only**: Enforce secure connections
8. **RBAC Implementation**: Strict role-based access control

---

## Support and Resources

### Official Documentation
- Vercel Docs: https://vercel.com/docs
- Next.js Docs: https://nextjs.org/docs
- Prisma Docs: https://www.prisma.io/docs
- Vercel Postgres: https://vercel.com/docs/storage/vercel-postgres
- Vercel Blob: https://vercel.com/docs/storage/vercel-blob

### Community
- Vercel Discord
- Next.js GitHub Discussions
- Stack Overflow

---

## Conclusion

Vercel provides a comprehensive, integrated platform that aligns perfectly with the RFP requirements. The serverless architecture, combined with managed database and storage solutions, offers:

- **Rapid Development**: Focus on features, not infrastructure
- **Scalability**: Automatic scaling without configuration
- **Performance**: Global CDN and edge computing
- **Cost Efficiency**: Pay only for what you use
- **Developer Experience**: Best-in-class DX with preview deployments
- **Security**: Built-in protections and compliance

This stack is ideal for the Educational Management Platform and can easily support all three development phases outlined in the RFP.
