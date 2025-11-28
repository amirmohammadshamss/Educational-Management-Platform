'use client';

import { useState, useEffect } from 'react';
import BookingsReport from '@/components/admin/BookingsReport';
import HoursReport from '@/components/admin/HoursReport';
import TeacherPerformanceReport from '@/components/admin/TeacherPerformanceReport';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type ReportType = 'bookings' | 'hours' | 'teacher-performance' | 'student-progress';

export default function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>('bookings');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [status, setStatus] = useState('');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [teachers, setTeachers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);

  // Set default dates (last 30 days)
  useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);

    setEndDate(end.toISOString().split('T')[0]);
    setStartDate(start.toISOString().split('T')[0]);
  }, []);

  // Fetch teachers and students for filters
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [teachersRes, studentsRes] = await Promise.all([
          fetch('/api/teachers'),
          fetch('/api/students'),
        ]);

        if (teachersRes.ok) {
          const teachersData = await teachersRes.json();
          setTeachers(teachersData);
        }

        if (studentsRes.ok) {
          const studentsData = await studentsRes.json();
          setStudents(studentsData);
        }
      } catch (err) {
        console.error('Failed to fetch filters:', err);
      }
    };

    fetchFilters();
  }, []);

  const generateReport = async () => {
    setLoading(true);
    setError('');
    setReportData(null);

    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (teacherId) params.append('teacherId', teacherId);
      if (studentId) params.append('studentId', studentId);
      if (status) params.append('status', status);

      const response = await fetch(`/api/reports/${reportType}?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const data = await response.json();
      setReportData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = () => {
    if (!reportData) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Title
    doc.setFontSize(18);
    doc.text(getReportTitle(), pageWidth / 2, 15, { align: 'center' });

    // Date range
    doc.setFontSize(10);
    doc.text(
      `Period: ${new Date(startDate).toLocaleDateString('fr-FR')} - ${new Date(
        endDate
      ).toLocaleDateString('fr-FR')}`,
      pageWidth / 2,
      25,
      { align: 'center' }
    );

    let yPosition = 35;

    switch (reportType) {
      case 'bookings':
        // Summary
        doc.setFontSize(12);
        doc.text('Summary', 14, yPosition);
        yPosition += 7;

        autoTable(doc, {
          startY: yPosition,
          head: [['Metric', 'Value']],
          body: [
            ['Total Sessions', reportData.statistics.totalSessions.toString()],
            ['Total Hours', `${reportData.statistics.totalHours.toFixed(1)}h`],
          ],
        });

        yPosition = (doc as any).lastAutoTable.finalY + 10;

        // Bookings table
        doc.text('Detailed Bookings', 14, yPosition);
        yPosition += 7;

        autoTable(doc, {
          startY: yPosition,
          head: [['Date', 'Teacher', 'Student', 'Duration', 'Status']],
          body: reportData.bookings.map((b: any) => [
            new Date(b.date).toLocaleDateString('fr-FR'),
            b.teacher.user.name,
            b.student.user.name,
            `${b.duration}h`,
            b.status,
          ]),
        });
        break;

      case 'hours':
        // Summary
        doc.setFontSize(12);
        doc.text('Summary', 14, yPosition);
        yPosition += 7;

        autoTable(doc, {
          startY: yPosition,
          head: [['Metric', 'Value']],
          body: [
            ['Total Students', reportData.summary.totalStudents.toString()],
            ['Students with Low Hours', reportData.summary.lowHoursCount.toString()],
            ['Total Allocated', `${reportData.summary.totalHoursAllocated}h`],
            ['Total Used', `${reportData.summary.totalHoursUsed.toFixed(1)}h`],
          ],
        });

        yPosition = (doc as any).lastAutoTable.finalY + 10;

        // Students table
        doc.text('Student Hours', 14, yPosition);
        yPosition += 7;

        autoTable(doc, {
          startY: yPosition,
          head: [['Student', 'Allowed', 'Used', 'Remaining', '%']],
          body: reportData.students.map((s: any) => [
            s.name,
            `${s.totalAllowed}h`,
            `${s.used.toFixed(1)}h`,
            `${s.remaining.toFixed(1)}h`,
            `${s.percentage.toFixed(1)}%`,
          ]),
        });
        break;

      case 'teacher-performance':
        // Summary
        doc.setFontSize(12);
        doc.text('Summary', 14, yPosition);
        yPosition += 7;

        autoTable(doc, {
          startY: yPosition,
          head: [['Metric', 'Value']],
          body: [
            ['Total Teachers', reportData.summary.totalTeachers.toString()],
            ['Total Sessions', reportData.summary.totalSessions.toString()],
            ['Total Hours', `${reportData.summary.totalHours.toFixed(1)}h`],
            ['Homework Reviewed', reportData.summary.totalHomeworkReviewed.toString()],
          ],
        });

        yPosition = (doc as any).lastAutoTable.finalY + 10;

        // Teachers table
        doc.text('Teacher Performance', 14, yPosition);
        yPosition += 7;

        autoTable(doc, {
          startY: yPosition,
          head: [['Teacher', 'Sessions', 'Hours', 'Students', 'Homework', 'Avg Response']],
          body: reportData.teachers.map((t: any) => [
            t.name,
            t.totalSessions.toString(),
            `${t.totalHours.toFixed(1)}h`,
            t.uniqueStudents.toString(),
            `${t.homeworkStats.reviewed}/${t.homeworkStats.total}`,
            t.avgResponseTimeHours > 0 ? `${t.avgResponseTimeHours.toFixed(1)}h` : 'N/A',
          ]),
        });
        break;
    }

    // Save
    doc.save(
      `${reportType}-report-${new Date().toISOString().split('T')[0]}.pdf`
    );
  };

  const getReportTitle = () => {
    switch (reportType) {
      case 'bookings':
        return 'Bookings Report';
      case 'hours':
        return 'Student Hours Report';
      case 'teacher-performance':
        return 'Teacher Performance Report';
      case 'student-progress':
        return 'Student Progress Report';
      default:
        return 'Report';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-600 mt-2">
          Generate detailed reports and export them for analysis
        </p>
      </div>

      {/* Report Configuration */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">Report Configuration</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Report Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Type
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as ReportType)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="bookings">Bookings</option>
              <option value="hours">Student Hours</option>
              <option value="teacher-performance">Teacher Performance</option>
              <option value="student-progress">Student Progress</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Teacher Filter */}
          {(reportType === 'bookings' || reportType === 'teacher-performance') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Teacher (Optional)
              </label>
              <select
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Teachers</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.user.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Student Filter */}
          {(reportType === 'bookings' ||
            reportType === 'hours' ||
            reportType === 'student-progress') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Student (Optional)
              </label>
              <select
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Students</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.user.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Status Filter */}
          {reportType === 'bookings' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Status (Optional)
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="PENDING">Pending</option>
              </select>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-6">
          <button
            onClick={generateReport}
            disabled={loading || !startDate || !endDate}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Generating...' : 'Generate Report'}
          </button>

          {reportData && (
            <button
              onClick={exportToPDF}
              className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700"
            >
              Export to PDF
            </button>
          )}
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
            {error}
          </div>
        )}
      </div>

      {/* Report Display */}
      {loading && (
        <div className="bg-white p-12 rounded-lg shadow-md text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Generating report...</p>
        </div>
      )}

      {!loading && reportData && (
        <div className="bg-gray-50 p-6 rounded-lg">
          {reportType === 'bookings' && <BookingsReport data={reportData} />}
          {reportType === 'hours' && <HoursReport data={reportData} />}
          {reportType === 'teacher-performance' && (
            <TeacherPerformanceReport data={reportData} />
          )}
          {reportType === 'student-progress' && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Student Progress</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sessions
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hours
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Homework
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hours Utilization
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.students.map((student: any) => (
                      <tr key={student.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {student.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {student.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.totalSessions}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.totalHours.toFixed(1)}h
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div>Total: {student.homeworkStats.total}</div>
                          <div className="text-xs">
                            <span className="text-green-600">
                              ✓ {student.homeworkStats.approved}
                            </span>
                            {' / '}
                            <span className="text-red-600">
                              ✗ {student.homeworkStats.rejected}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div>
                            {student.hoursUtilization.used.toFixed(1)} /{' '}
                            {student.hoursUtilization.totalAllowed}h
                          </div>
                          <div className="text-xs text-gray-400">
                            {student.hoursUtilization.percentage.toFixed(1)}% used
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
