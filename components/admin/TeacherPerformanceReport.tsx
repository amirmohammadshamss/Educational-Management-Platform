'use client';

import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';

interface Teacher {
  id: string;
  name: string;
  email: string;
  subject: string;
  totalSessions: number;
  totalHours: number;
  uniqueStudents: number;
  homeworkStats: {
    total: number;
    reviewed: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  avgResponseTimeHours: number;
}

interface TeacherPerformanceReportProps {
  data: {
    teachers: Teacher[];
    summary: {
      totalTeachers: number;
      totalSessions: number;
      totalHours: number;
      totalHomeworkReviewed: number;
    };
  };
}

export default function TeacherPerformanceReport({
  data,
}: TeacherPerformanceReportProps) {
  const [sortBy, setSortBy] = useState<
    'name' | 'sessions' | 'hours' | 'students' | 'responseTime'
  >('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Ensure teachers is always an array
  const teachers = Array.isArray(data?.teachers) ? data.teachers : [];

  // Ensure summary exists with defaults
  const summary = data?.summary || {
    totalTeachers: 0,
    totalSessions: 0,
    totalHours: 0,
    totalHomeworkReviewed: 0,
  };

  // Sort teachers
  const sortedTeachers = [...teachers].sort((a, b) => {
    let compareValue = 0;

    switch (sortBy) {
      case 'name':
        compareValue = a.name.localeCompare(b.name);
        break;
      case 'sessions':
        compareValue = a.totalSessions - b.totalSessions;
        break;
      case 'hours':
        compareValue = a.totalHours - b.totalHours;
        break;
      case 'students':
        compareValue = a.uniqueStudents - b.uniqueStudents;
        break;
      case 'responseTime':
        compareValue = a.avgResponseTimeHours - b.avgResponseTimeHours;
        break;
    }

    return sortOrder === 'asc' ? compareValue : -compareValue;
  });

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  // Prepare chart data
  const sessionsChartData = sortedTeachers.map((t) => ({
    name: t.name,
    sessions: t.totalSessions,
    hours: t.totalHours,
  }));

  const homeworkChartData = sortedTeachers.map((t) => ({
    name: t.name,
    reviewed: t.homeworkStats.reviewed,
    pending: t.homeworkStats.pending,
  }));

  // Top performer radar chart (top 5 teachers)
  const topTeachers = [...teachers]
    .sort((a, b) => b.totalSessions - a.totalSessions)
    .slice(0, 5);

  const radarData = [
    {
      metric: 'Sessions',
      ...Object.fromEntries(
        topTeachers.map((t, i) => [
          `teacher${i}`,
          (t.totalSessions / Math.max(...topTeachers.map((x) => x.totalSessions))) * 100,
        ])
      ),
    },
    {
      metric: 'Hours',
      ...Object.fromEntries(
        topTeachers.map((t, i) => [
          `teacher${i}`,
          (t.totalHours / Math.max(...topTeachers.map((x) => x.totalHours))) * 100,
        ])
      ),
    },
    {
      metric: 'Students',
      ...Object.fromEntries(
        topTeachers.map((t, i) => [
          `teacher${i}`,
          (t.uniqueStudents / Math.max(...topTeachers.map((x) => x.uniqueStudents))) * 100,
        ])
      ),
    },
    {
      metric: 'Homework',
      ...Object.fromEntries(
        topTeachers.map((t, i) => [
          `teacher${i}`,
          (t.homeworkStats.reviewed /
            Math.max(...topTeachers.map((x) => x.homeworkStats.reviewed))) *
            100,
        ])
      ),
    },
  ];

  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  // Empty state
  if (teachers.length === 0) {
    return (
      <div className="bg-white p-12 rounded-lg shadow text-center">
        <p className="text-gray-500 text-lg">No teacher data available for the selected period.</p>
        <p className="text-gray-400 text-sm mt-2">Try adjusting your date range or filters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Teachers</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {summary.totalTeachers}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Sessions</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">
            {summary.totalSessions}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Hours</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {(summary.totalHours || 0).toFixed(1)}h
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Homework Reviewed</h3>
          <p className="text-3xl font-bold text-purple-600 mt-2">
            {summary.totalHomeworkReviewed}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sessions and Hours Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Sessions & Hours by Teacher</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sessionsChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="sessions" fill="#3B82F6" name="Sessions" />
              <Bar yAxisId="right" dataKey="hours" fill="#10B981" name="Hours" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Homework Review Status */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Homework Review Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={homeworkChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="reviewed" stackId="a" fill="#10B981" name="Reviewed" />
              <Bar dataKey="pending" stackId="a" fill="#F59E0B" name="Pending" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Performers Radar Chart */}
      {topTeachers.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">
            Top 5 Teachers Performance Comparison
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              {topTeachers.map((teacher, index) => (
                <Radar
                  key={teacher.id}
                  name={teacher.name}
                  dataKey={`teacher${index}`}
                  stroke={colors[index]}
                  fill={colors[index]}
                  fillOpacity={0.3}
                />
              ))}
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Detailed Table */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Detailed Performance Report</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('name')}
                >
                  Teacher {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subject
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('sessions')}
                >
                  Sessions {sortBy === 'sessions' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('hours')}
                >
                  Hours {sortBy === 'hours' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('students')}
                >
                  Students {sortBy === 'students' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Homework
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('responseTime')}
                >
                  Avg Response {sortBy === 'responseTime' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedTeachers.map((teacher) => (
                <tr key={teacher.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {teacher.name}
                    </div>
                    <div className="text-sm text-gray-500">{teacher.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {teacher.subject || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {teacher.totalSessions}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {teacher.totalHours.toFixed(1)}h
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {teacher.uniqueStudents}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {teacher.homeworkStats.reviewed}/{teacher.homeworkStats.total}
                    </div>
                    <div className="text-xs text-gray-500">
                      <span className="text-green-600">
                        ✓ {teacher.homeworkStats.approved}
                      </span>
                      {' / '}
                      <span className="text-red-600">
                        ✗ {teacher.homeworkStats.rejected}
                      </span>
                      {teacher.homeworkStats.pending > 0 && (
                        <>
                          {' / '}
                          <span className="text-yellow-600">
                            ⏳ {teacher.homeworkStats.pending}
                          </span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {teacher.avgResponseTimeHours > 0
                      ? `${teacher.avgResponseTimeHours.toFixed(1)}h`
                      : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">
          Performance Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h4 className="text-sm font-medium text-blue-800 mb-2">
              Most Active Teacher
            </h4>
            <p className="text-lg font-semibold text-blue-900">
              {[...teachers].sort((a, b) => b.totalSessions - a.totalSessions)[0]
                ?.name || 'N/A'}
            </p>
            <p className="text-sm text-blue-700">
              {[...teachers].sort((a, b) => b.totalSessions - a.totalSessions)[0]
                ?.totalSessions || 0}{' '}
              sessions
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-blue-800 mb-2">
              Most Hours Taught
            </h4>
            <p className="text-lg font-semibold text-blue-900">
              {[...teachers].sort((a, b) => b.totalHours - a.totalHours)[0]
                ?.name || 'N/A'}
            </p>
            <p className="text-sm text-blue-700">
              {[...teachers].sort((a, b) => b.totalHours - a.totalHours)[0]
                ?.totalHours.toFixed(1) || 0}
              h
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-blue-800 mb-2">
              Fastest Response Time
            </h4>
            <p className="text-lg font-semibold text-blue-900">
              {[...teachers]
                .filter((t) => t.avgResponseTimeHours > 0)
                .sort((a, b) => a.avgResponseTimeHours - b.avgResponseTimeHours)[0]
                ?.name || 'N/A'}
            </p>
            <p className="text-sm text-blue-700">
              {[...teachers]
                .filter((t) => t.avgResponseTimeHours > 0)
                .sort((a, b) => a.avgResponseTimeHours - b.avgResponseTimeHours)[0]
                ?.avgResponseTimeHours.toFixed(1) || 0}
              h avg
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
