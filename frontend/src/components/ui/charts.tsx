'use client';

import { useId } from 'react';
import {
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart as RechartsLineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  AreaChart as RechartsAreaChart,
  Area,
  Legend,
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

interface ChartProps {
  data: Record<string, unknown>[];
  height?: number;
}

const darkTooltipStyle = {
  backgroundColor: '#1f2937',
  border: '1px solid #374151',
  borderRadius: '8px',
  color: '#f3f4f6',
  fontSize: '12px',
};

export function BarChart({ data, dataKey, xKey = 'name', height = 300, color = '#3b82f6', formatter }: ChartProps & { dataKey: string; xKey?: string; color?: string; formatter?: (v: number) => string }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
        <XAxis dataKey={xKey} tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={formatter} />
        <Tooltip contentStyle={darkTooltipStyle} formatter={formatter ? (v: unknown) => [formatter(Number(v))] : undefined} />
        <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} maxBarSize={32} />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}

export function LineChartComponent({ data, dataKey, xKey = 'name', height = 300, color = '#3b82f6', formatter }: ChartProps & { dataKey: string; xKey?: string; color?: string; formatter?: (v: number) => string }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
        <XAxis dataKey={xKey} tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={formatter} />
        <Tooltip contentStyle={darkTooltipStyle} formatter={formatter ? (v: unknown) => [formatter(Number(v))] : undefined} />
        <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={{ r: 4, fill: color }} activeDot={{ r: 6 }} />
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}

export function AreaChartComponent({ data, dataKey, xKey = 'name', height = 300, color = '#3b82f6', formatter }: ChartProps & { dataKey: string; xKey?: string; color?: string; formatter?: (v: number) => string }) {
  const gradientId = useId();
  const safeGradientId = `gradient-${gradientId.replace(/:/g, '')}-${dataKey}`;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsAreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
        <defs>
          <linearGradient id={safeGradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
        <XAxis dataKey={xKey} tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={formatter} />
        <Tooltip contentStyle={darkTooltipStyle} formatter={formatter ? (v: unknown) => [formatter(Number(v))] : undefined} />
        <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} fill={`url(#${safeGradientId})`} />
      </RechartsAreaChart>
    </ResponsiveContainer>
  );
}

export function DonutChart({ data, dataKey = 'value', nameKey = 'name', height = 300, colors = COLORS }: ChartProps & { dataKey?: string; nameKey?: string; colors?: string[] }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsPieChart>
        <Pie data={data} dataKey={dataKey} nameKey={nameKey} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3}>
          {data.map((_, index) => (
            <Cell key={index} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={darkTooltipStyle} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
      </RechartsPieChart>
    </ResponsiveContainer>
  );
}

export function MultiBarChart({ data, bars, xKey = 'name', height = 300, formatter }: ChartProps & { bars: { dataKey: string; color: string; name?: string }[]; xKey?: string; formatter?: (v: number) => string }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
        <XAxis dataKey={xKey} tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={formatter} />
        <Tooltip contentStyle={darkTooltipStyle} formatter={formatter ? (v: unknown) => [formatter(Number(v))] : undefined} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
        {bars.map((bar, i) => (
          <Bar key={i} dataKey={bar.dataKey} fill={bar.color} name={bar.name || bar.dataKey} radius={[4, 4, 0, 0]} maxBarSize={32} />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
