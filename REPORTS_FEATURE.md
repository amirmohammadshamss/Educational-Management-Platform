# Reports & Analytics Feature

## Overview

The Reports & Analytics interface allows administrators to generate detailed reports about bookings, student hours utilization, teacher performance, and student progress.

## Features

### 1. Reports Page (`/admin/reports`)
Main interface for generating and viewing reports with the following capabilities:
- Report type selection
- Date range filtering
- Teacher/Student filtering
- Export to PDF and Excel

### 2. Report Types

#### Bookings Report
- Total sessions and hours
- Bookings grouped by day/week/month
- Teacher and student breakdowns
- Visual charts (bar/line)
- Detailed bookings table with status

#### Hours Report
- Student hours utilization
- Students running low on hours (< 20% remaining)
- Total allocated vs used hours
- Sortable by multiple metrics
- Excel export functionality
- Visual charts (pie chart for overall utilization, bar chart for top users)

#### Teacher Performance Report
- Number of sessions per teacher
- Total hours taught
- Unique students count
- Homework review statistics
- Average feedback response time
- Radar chart for top 5 teachers comparison
- Performance insights

#### Student Progress Report
- Sessions and hours per student
- Teacher breakdown for each student
- Homework submission statistics
- Hours utilization percentage
- Detailed progress tracking

### 3. Export Capabilities

#### PDF Export
- Uses jsPDF and jspdf-autotable
- Professional formatting
- Summary statistics
- Detailed tables
- Includes date range

#### Excel Export (Hours Report)
- Uses ExcelJS
- Summary section
- Formatted headers
- Color-coded low hours
- Auto-fit columns
- Multiple worksheets support

### 4. Visualizations

Uses Recharts library for interactive charts:
- Bar charts
- Line charts
- Pie charts
- Radar charts
- Responsive design

## API Endpoints

### GET `/api/reports/[type]`

Generate reports based on type.

**Parameters:**
- `type`: Report type (bookings, hours, teacher-performance, student-progress)
- `startDate`: Start date for report (ISO format)
- `endDate`: End date for report (ISO format)
- `teacherId`: Filter by teacher (optional)
- `studentId`: Filter by student (optional)
- `status`: Filter by booking status (optional)

**Response:**
Returns JSON with report data and statistics.

**Example:**
```
GET /api/reports/bookings?startDate=2025-01-01&endDate=2025-01-31&teacherId=abc123
```

## Components

### BookingsReport
- `components/admin/BookingsReport.tsx`
- Displays booking analytics with charts and tables
- Grouping options (day/week/month)
- Chart type selection (bar/line)

### HoursReport
- `components/admin/HoursReport.tsx`
- Student hours utilization with sorting
- Low hours alerts
- Excel export functionality
- Visual utilization charts

### TeacherPerformanceReport
- `components/admin/TeacherPerformanceReport.tsx`
- Teacher metrics and comparisons
- Homework review statistics
- Performance insights
- Radar chart for top performers

## Usage

1. Navigate to `/admin/reports`
2. Select report type
3. Choose date range
4. Apply optional filters (teacher, student, status)
5. Click "Generate Report"
6. View visualizations and tables
7. Export to PDF or Excel as needed

## Technical Details

### Libraries Used
- **recharts**: Chart visualizations (^2.x)
- **exceljs**: Excel file generation (^4.x)
- **jspdf**: PDF generation (^2.x)
- **jspdf-autotable**: PDF table formatting (^3.x)

### Database Queries
All reports use optimized Prisma queries with:
- Selective field inclusion
- Date range filtering
- Relation loading
- Aggregation at application level

### Performance Considerations
- Queries are filtered by date range to limit data
- Optional filters reduce result set size
- Charts use memoization where appropriate
- Export operations run client-side

## Future Enhancements

Potential improvements for Phase 2:
- Scheduled report generation
- Email delivery of reports
- Custom report templates
- Report history and versioning
- Additional chart types (scatter, area)
- Comparison mode (year-over-year)
- Real-time data updates
- CSV export option

## Notes

- All reports require ADMIN or SUPER_ADMIN role
- Default date range is last 30 days
- Teacher "subject" field is not yet in schema (returns null)
- Low hours threshold is set at 20% remaining
- Response times are calculated in hours
- All dates display in French format (dd/mm/yyyy)
