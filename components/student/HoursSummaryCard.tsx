'use client';

import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

interface HoursSummaryCardProps {
  totalAllowedHours: number;
  usedHours: number;
  remainingHours: number;
}

export default function HoursSummaryCard({
  totalAllowedHours,
  usedHours,
  remainingHours,
}: HoursSummaryCardProps) {
  const percentageUsed = (usedHours / totalAllowedHours) * 100;
  const percentageRemaining = (remainingHours / totalAllowedHours) * 100;
  const isLowHours = percentageRemaining < 20;

  // SVG circle parameters for circular progress
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentageUsed / 100) * circumference;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">
        Résumé des heures
      </h2>

      <div className="flex items-center justify-between">
        {/* Circular Progress Indicator */}
        <div className="relative w-48 h-48">
          <svg className="transform -rotate-90 w-48 h-48">
            {/* Background circle */}
            <circle
              cx="96"
              cy="96"
              r={radius}
              stroke="#e5e7eb"
              strokeWidth="12"
              fill="none"
            />
            {/* Progress circle */}
            <circle
              cx="96"
              cy="96"
              r={radius}
              stroke={isLowHours ? '#ef4444' : '#3b82f6'}
              strokeWidth="12"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
          </svg>

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-4xl font-bold text-gray-900">
              {remainingHours}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              heures restantes
            </div>
          </div>
        </div>

        {/* Hours Details */}
        <div className="flex-1 ml-8 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Total autorisé</span>
            <span className="text-2xl font-semibold text-gray-900">
              {totalAllowedHours}h
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-600">Heures utilisées</span>
            <span className="text-2xl font-semibold text-blue-600">
              {usedHours}h
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-600">Heures restantes</span>
            <span className={`text-2xl font-semibold ${isLowHours ? 'text-red-600' : 'text-green-600'}`}>
              {remainingHours}h
            </span>
          </div>

          {/* Progress bar */}
          <div className="pt-2">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${
                  isLowHours ? 'bg-red-600' : 'bg-blue-600'
                }`}
                style={{ width: `${percentageUsed}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0%</span>
              <span>{percentageUsed.toFixed(1)}% utilisé</span>
              <span>100%</span>
            </div>
          </div>

          {/* Warning if low hours */}
          {isLowHours && (
            <div className="flex items-center gap-2 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <span className="text-sm text-red-800">
                Attention : Il vous reste moins de 20% de vos heures autorisées
              </span>
            </div>
          )}

          {/* View Details Link */}
          <div className="pt-2">
            <Link
              href="/student/schedule"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center"
            >
              Voir les détails
              <svg
                className="w-4 h-4 ml-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
