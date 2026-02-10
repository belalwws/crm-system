'use client';

import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color?: 'violet' | 'blue' | 'green' | 'amber' | 'red' | 'indigo' | 'emerald' | 'orange';
  trend?: { value: number; label?: string };
}

const colorMap: Record<string, string> = {
  violet: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
  blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  amber: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  red: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  indigo: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
  emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
};

export function StatCard({ title, value, subtitle, icon, color = 'blue', trend }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colorMap[color] || colorMap.blue}`}>
          {icon}
        </div>
        <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{title}</span>
      </div>
      {value !== '' && value !== undefined && (
        <p className="text-2xl font-bold text-neutral-900 dark:text-white">{value}</p>
      )}
      {trend && (
        <p className={`text-xs mt-1 ${trend.value >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%{trend.label ? ` ${trend.label}` : ''}
        </p>
      )}
      {subtitle && <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{subtitle}</p>}
    </div>
  );
}

export default StatCard;
