'use client';

/**
 * StudentHoursChart Component
 *
 * Visual representation of student's training hours
 * Shows used vs remaining hours with warnings
 */

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

/**
 * Component props
 */
interface StudentHoursChartProps {
  totalAllowedHours: number;
  usedHours: number;
  remainingHours: number;
  studentName: string;
}

/**
 * Chart colors
 */
const COLORS = {
  used: '#3b82f6', // blue
  remaining: '#10b981', // green
  warning: '#f59e0b', // amber
  critical: '#ef4444', // red
};

/**
 * Custom label for pie chart
 */
const renderCustomLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: any) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent < 0.05) return null; // Don't show label if slice is too small

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      className="font-semibold text-sm"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

/**
 * StudentHoursChart Component
 */
export default function StudentHoursChart({
  totalAllowedHours,
  usedHours,
  remainingHours,
  studentName,
}: StudentHoursChartProps) {
  // Calculate percentage
  const percentage =
    totalAllowedHours > 0 ? (remainingHours / totalAllowedHours) * 100 : 0;

  // Determine status and color
  let status: 'good' | 'warning' | 'critical' | 'depleted';
  let statusColor: string;
  let statusMessage: string;

  if (remainingHours <= 0) {
    status = 'depleted';
    statusColor = COLORS.critical;
    statusMessage = 'All hours have been used';
  } else if (percentage <= 20) {
    status = 'critical';
    statusColor = COLORS.critical;
    statusMessage = 'Critical: Less than 20% remaining';
  } else if (percentage <= 40) {
    status = 'warning';
    statusColor = COLORS.warning;
    statusMessage = 'Warning: Less than 40% remaining';
  } else {
    status = 'good';
    statusColor = COLORS.remaining;
    statusMessage = 'Sufficient hours available';
  }

  // Prepare chart data
  const data = [
    {
      name: 'Used Hours',
      value: usedHours,
      color: COLORS.used,
    },
    {
      name: 'Remaining Hours',
      value: Math.max(remainingHours, 0),
      color: statusColor,
    },
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Training Hours Overview
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          {studentName}'s hour allocation and usage
        </p>
      </div>

      {/* Chart */}
      <div className="mb-6">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomLabel}
              outerRadius={100}
              innerRadius={60}
              fill="#8884d8"
              dataKey="value"
              animationBegin={0}
              animationDuration={800}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => `${value.toFixed(1)}h`}
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                padding: '8px 12px',
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value, entry: any) => (
                <span className="text-sm text-gray-700">
                  {value}: {entry.payload.value.toFixed(1)}h
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs font-medium text-gray-600 mb-1">Total</p>
          <p className="text-2xl font-bold text-gray-900">
            {totalAllowedHours.toFixed(1)}
          </p>
          <p className="text-xs text-gray-500">hours</p>
        </div>
        <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs font-medium text-blue-700 mb-1">Used</p>
          <p className="text-2xl font-bold text-blue-900">
            {usedHours.toFixed(1)}
          </p>
          <p className="text-xs text-blue-600">hours</p>
        </div>
        <div
          className={`text-center p-3 rounded-lg border ${
            status === 'good'
              ? 'bg-green-50 border-green-200'
              : status === 'warning'
              ? 'bg-amber-50 border-amber-200'
              : 'bg-red-50 border-red-200'
          }`}
        >
          <p
            className={`text-xs font-medium mb-1 ${
              status === 'good'
                ? 'text-green-700'
                : status === 'warning'
                ? 'text-amber-700'
                : 'text-red-700'
            }`}
          >
            Remaining
          </p>
          <p
            className={`text-2xl font-bold ${
              status === 'good'
                ? 'text-green-900'
                : status === 'warning'
                ? 'text-amber-900'
                : 'text-red-900'
            }`}
          >
            {Math.max(remainingHours, 0).toFixed(1)}
          </p>
          <p
            className={`text-xs ${
              status === 'good'
                ? 'text-green-600'
                : status === 'warning'
                ? 'text-amber-600'
                : 'text-red-600'
            }`}
          >
            hours
          </p>
        </div>
      </div>

      {/* Status Message */}
      <div
        className={`p-4 rounded-lg border ${
          status === 'good'
            ? 'bg-green-50 border-green-200'
            : status === 'warning'
            ? 'bg-amber-50 border-amber-200'
            : 'bg-red-50 border-red-200'
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="text-2xl flex-shrink-0">
            {status === 'good'
              ? '✅'
              : status === 'warning'
              ? '⚠️'
              : '❌'}
          </div>
          <div className="flex-1">
            <p
              className={`font-semibold text-sm ${
                status === 'good'
                  ? 'text-green-900'
                  : status === 'warning'
                  ? 'text-amber-900'
                  : 'text-red-900'
              }`}
            >
              {statusMessage}
            </p>
            <p
              className={`text-xs mt-1 ${
                status === 'good'
                  ? 'text-green-700'
                  : status === 'warning'
                  ? 'text-amber-700'
                  : 'text-red-700'
              }`}
            >
              {status === 'depleted' && (
                <>The student has used all their allocated training hours.</>
              )}
              {status === 'critical' && (
                <>
                  The student is running low on hours. Consider discussing their
                  remaining schedule.
                </>
              )}
              {status === 'warning' && (
                <>
                  The student should start planning to use their remaining hours
                  efficiently.
                </>
              )}
              {status === 'good' && (
                <>
                  The student has plenty of hours available for continued
                  training.
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-6">
        <div className="flex items-center justify-between text-xs font-medium text-gray-700 mb-2">
          <span>Usage Progress</span>
          <span>
            {totalAllowedHours > 0
              ? ((usedHours / totalAllowedHours) * 100).toFixed(1)
              : 0}
            % used
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <div
            className="h-4 bg-blue-500 rounded-full transition-all"
            style={{
              width: `${
                totalAllowedHours > 0
                  ? Math.min((usedHours / totalAllowedHours) * 100, 100)
                  : 0
              }%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
