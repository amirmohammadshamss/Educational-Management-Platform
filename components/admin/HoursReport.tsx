'use client';

import { useState } from 'react';
import * as XLSX from 'exceljs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface Student {
  id: string;
  name: string;
  email: string;
  governmentId: string;
  totalAllowed: number;
  used: number;
  remaining: number;
  percentage: number;
  isLow: boolean;
  sessionsCount: number;
}

interface HoursReportProps {
  data: {
    students: Student[];
    summary: {
      totalStudents: number;
      lowHoursCount: number;
      totalHoursAllocated: number;
      totalHoursUsed: number;
    };
  };
}

export default function HoursReport({ data }: HoursReportProps) {
  const [sortBy, setSortBy] = useState<'name' | 'percentage' | 'remaining' | 'used'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Ensure students is always an array
  const students = Array.isArray(data?.students) ? data.students : [];

  // Ensure summary exists with defaults
  const summary = data?.summary || {
    totalStudents: 0,
    lowHoursCount: 0,
    totalHoursAllocated: 0,
    totalHoursUsed: 0,
  };

  // Sort students
  const sortedStudents = [...students].sort((a, b) => {
    let compareValue = 0;

    switch (sortBy) {
      case 'name':
        compareValue = a.name.localeCompare(b.name);
        break;
      case 'percentage':
        compareValue = a.percentage - b.percentage;
        break;
      case 'remaining':
        compareValue = a.remaining - b.remaining;
        break;
      case 'used':
        compareValue = a.used - b.used;
        break;
    }

    return sortOrder === 'asc' ? compareValue : -compareValue;
  });

  // Export to Excel
  const exportToExcel = async () => {
    const workbook = new XLSX.Workbook();
    const worksheet = workbook.addWorksheet('Hours Report');

    // Add title
    worksheet.mergeCells('A1:G1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'Student Hours Utilization Report';
    titleCell.font = { size: 16, bold: true };
    titleCell.alignment = { horizontal: 'center' };

    // Add summary
    worksheet.addRow([]);
    worksheet.addRow(['Summary']);
    worksheet.addRow(['Total Students', data.summary.totalStudents]);
    worksheet.addRow(['Students Running Low', data.summary.lowHoursCount]);
    worksheet.addRow(['Total Hours Allocated', data.summary.totalHoursAllocated]);
    worksheet.addRow(['Total Hours Used', data.summary.totalHoursUsed]);
    worksheet.addRow([]);

    // Add headers
    const headerRow = worksheet.addRow([
      'Student Name',
      'Email',
      'Government ID',
      'Total Allowed (h)',
      'Used (h)',
      'Remaining (h)',
      'Percentage (%)',
      'Sessions',
      'Status',
    ]);

    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // Add data
    sortedStudents.forEach((student) => {
      const row = worksheet.addRow([
        student.name,
        student.email,
        student.governmentId,
        student.totalAllowed,
        student.used,
        student.remaining,
        student.percentage,
        student.sessionsCount,
        student.isLow ? 'Low Hours' : 'OK',
      ]);

      // Color code low hours
      if (student.isLow) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFEBEE' },
        };
      }
    });

    // Auto-fit columns
    worksheet.columns.forEach((column) => {
      let maxLength = 0;
      column.eachCell?.({ includeEmpty: true }, (cell) => {
        const cellValue = cell.value ? cell.value.toString() : '';
        maxLength = Math.max(maxLength, cellValue.length);
      });
      column.width = Math.min(maxLength + 2, 50);
    });

    // Generate and download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hours-report-${new Date().toISOString().split('T')[0]}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  // Prepare chart data
  const utilizationData = [
    {
      name: 'Used',
      value: summary.totalHoursUsed,
      color: '#3B82F6',
    },
    {
      name: 'Remaining',
      value: summary.totalHoursAllocated - summary.totalHoursUsed,
      color: '#10B981',
    },
  ];

  // Top 10 students by usage
  const topStudents = [...students]
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 10)
    .map((s) => ({
      name: s.name,
      percentage: s.percentage,
    }));

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  // Empty state
  if (students.length === 0) {
    return (
      <div className="bg-white p-12 rounded-lg shadow text-center">
        <p className="text-gray-500 text-lg">No student data available for the selected period.</p>
        <p className="text-gray-400 text-sm mt-2">Try adjusting your date range or filters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Students</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {summary.totalStudents}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Low Hours Alert</h3>
          <p className="text-3xl font-bold text-red-600 mt-2">
            {summary.lowHoursCount}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Allocated</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {(summary.totalHoursAllocated || 0).toFixed(0)}h
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Used</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">
            {(summary.totalHoursUsed || 0).toFixed(0)}h
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Overall Utilization Pie Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Overall Hours Utilization</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={utilizationData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${((percent || 0) * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {utilizationData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top Students by Usage */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">
            Top 10 Students by Usage %
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={topStudents} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" width={100} />
              <Tooltip />
              <Bar dataKey="percentage" fill="#8B5CF6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Export Button */}
      <div className="bg-white p-4 rounded-lg shadow">
        <button
          onClick={exportToExcel}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
        >
          Export to Excel
        </button>
      </div>

      {/* Students Low on Hours */}
      {summary.lowHoursCount > 0 && (
        <div className="bg-red-50 border border-red-200 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-red-900 mb-4">
            Students Running Low on Hours ({summary.lowHoursCount})
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-red-200">
              <thead className="bg-red-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-red-900 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-red-900 uppercase tracking-wider">
                    Remaining
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-red-900 uppercase tracking-wider">
                    Used %
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-red-200">
                {sortedStudents
                  .filter((s) => s.isLow)
                  .map((student) => (
                    <tr key={student.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {student.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold">
                        {student.remaining.toFixed(1)}h
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.percentage.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detailed Table */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Detailed Hours Report</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('name')}
                >
                  Student {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Allowed
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('used')}
                >
                  Used {sortBy === 'used' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('remaining')}
                >
                  Remaining {sortBy === 'remaining' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('percentage')}
                >
                  Usage % {sortBy === 'percentage' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sessions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedStudents.map((student) => (
                <tr
                  key={student.id}
                  className={student.isLow ? 'bg-red-50' : ''}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {student.name}
                    {student.isLow && (
                      <span className="ml-2 text-xs text-red-600 font-semibold">
                        ⚠ Low
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {student.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {student.totalAllowed}h
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {student.used.toFixed(1)}h
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {student.remaining.toFixed(1)}h
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className={`h-2 rounded-full ${
                            student.percentage >= 80
                              ? 'bg-red-600'
                              : student.percentage >= 50
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(student.percentage, 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-900">
                        {student.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {student.sessionsCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
