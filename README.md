# Educational Management Platform

A web-based Educational Management Platform designed for French educational institutions to manage lesson bookings, track student training hours, and facilitate homework submission between teachers and students.

## Project Status

**Phase 1: Project Setup & Infrastructure** - ✅ Complete

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript (Strict Mode)
- **Styling:** TailwindCSS
- **Database:** Vercel Postgres (PostgreSQL)
- **ORM:** Prisma
- **Authentication:** NextAuth.js + JWT
- **Hosting:** Vercel
- **File Storage:** Vercel Blob Storage

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- PostgreSQL database (or Vercel Postgres)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` with your actual values.

4. Set up the database (after configuring Prisma):
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
/app
  /(admin)      # Admin dashboard routes
  /(teacher)    # Teacher panel routes
  /(student)    # Student panel routes
  /api
    /auth       # Authentication endpoints
    /bookings   # Booking management
    /students   # Student operations
    /teachers   # Teacher operations
    /homework   # Homework submission/review
    /cron       # Scheduled sync jobs
/components
  /ui           # Shared UI components
  /admin        # Admin-specific components
  /teacher      # Teacher-specific components
  /student      # Student-specific components
  /shared       # Shared components across roles
/lib            # Utility functions and helpers
/prisma         # Database schema and migrations
/types          # TypeScript type definitions
/hooks          # Custom React hooks
/utils          # Utility functions
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## User Roles

1. **Super Admin** - Full system control
2. **Admin** - Manage users, schedules, and reports
3. **Teacher** - Manage students, homework, and personal schedule
4. **Student** - View schedule, submit homework, access resources

## Next Steps

- [ ] Set up Prisma schema
- [ ] Configure authentication with NextAuth.js
- [ ] Implement admin dashboard
- [ ] Set up API integrations
- [ ] Build teacher and student panels

## Documentation

- [Project Requirements](./Educational%20Management%20Platform.md)
- [Claude Code Guide](./CLAUDE.md)
- [Task & Prompts](./PROJECT_TASKS_AND_PROMPTS.md)
- [Vercel Deployment Guide](./VERCEL_DEPLOYMENT_GUIDE.md)

## License

Private - All Rights Reserved
