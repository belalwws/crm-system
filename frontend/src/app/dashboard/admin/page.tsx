'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import api from '@/lib/api';
import {
  Users, Briefcase, DollarSign, Smartphone,
  TrendingUp, ArrowRight, CreditCard, Shield, Activity,
} from 'lucide-react';

interface AdminDashboardData {
  overview: {
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    newUsersThisMonth: number;
    newUsersThisWeek: number;
    totalCustomers: number;
    totalDeals: number;
    totalTasks: number;
    revenue: { totalWon: number; dealsWon: number };
  };
  mobile: { registeredDevices: number };
  subscriptions: Record<string, number>;
  userGrowth: Array<{ date: string; count: number }>;
  recentActivity: Array<{
    id: string;
    action: string;
    entityType: string;
    entityName?: string;
    createdAt: string;
    user: { name: string; email: string; avatar?: string };
  }>;
}

function OverviewCard({ label, value, subtitle, icon: Icon, color, href }: {
  label: string; value: string | number; subtitle?: string;
  icon: React.ElementType; color: string; href?: string;
}) {
  const card = (
    <div className={`p-5 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 ${href ? 'hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors cursor-pointer' : ''}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{label}</p>
          <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">{value}</p>
          {subtitle && <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-2.5 rounded-lg ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
  return href ? <Link href={href}>{card}</Link> : card;
}

export default function AdminOverview() {
  const { getToken } = useAuth();
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const token = await getToken();
      api.setToken(token);
      const res = await api.getAdminDashboard();
      if (res.success) setData(res.data as AdminDashboardData);
      setError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('403') || msg.includes('permission')) {
        setError('Access denied. Admin privileges required.');
      } else {
        setError('Failed to load admin dashboard.');
      }
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <Shield className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">Access Denied</h2>
          <p className="text-neutral-500">{error}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-28 bg-neutral-200 dark:bg-neutral-800 rounded-xl" />)}
        </div>
        <div className="h-80 bg-neutral-200 dark:bg-neutral-800 rounded-xl" />
      </div>
    );
  }

  const d = data!;

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <OverviewCard label="Total Users" value={d.overview.totalUsers}
          subtitle={`${d.overview.activeUsers} active · ${d.overview.newUsersThisWeek} this week`}
          icon={Users} color="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
          href="/dashboard/admin/users" />
        <OverviewCard label="Total Revenue" value={`$${Number(d.overview.revenue.totalWon || 0).toLocaleString()}`}
          subtitle={`${d.overview.revenue.dealsWon} deals won`}
          icon={DollarSign} color="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" />
        <OverviewCard label="Subscriptions"
          value={Object.values(d.subscriptions).reduce((a, b) => a + b, 0)}
          subtitle={Object.entries(d.subscriptions).map(([k, v]) => `${v} ${k.toLowerCase()}`).join(' · ')}
          icon={CreditCard} color="bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400"
          href="/dashboard/admin/subscriptions" />
        <OverviewCard label="Platform Data"
          value={d.overview.totalCustomers}
          subtitle={`${d.overview.totalDeals} deals · ${d.overview.totalTasks} tasks`}
          icon={Briefcase} color="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" />
        <OverviewCard label="Mobile Devices" value={d.mobile.registeredDevices}
          subtitle="Active push tokens"
          icon={Smartphone} color="bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400"
          href="/dashboard/admin/mobile" />
        <OverviewCard label="Growth" value={`+${d.overview.newUsersThisMonth}`}
          subtitle="New users this month"
          icon={TrendingUp} color="bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400" />
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
          <h3 className="font-semibold text-neutral-900 dark:text-white mb-4">User Growth (30 days)</h3>
          {d.userGrowth && d.userGrowth.length > 0 ? (
            <div className="space-y-2">
              {d.userGrowth.slice(-14).map((day, i) => {
                const maxCount = Math.max(...d.userGrowth.map(g => g.count), 1);
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-neutral-500 w-16 flex-shrink-0">
                      {new Date(day.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                    </span>
                    <div className="flex-1 bg-neutral-100 dark:bg-neutral-800 rounded-full h-5 overflow-hidden">
                      <div className="h-full bg-blue-500 dark:bg-blue-600 rounded-full transition-all"
                        style={{ width: `${Math.max(5, (day.count / maxCount) * 100)}%` }} />
                    </div>
                    <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300 w-8 text-right">{day.count}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-neutral-500 text-sm">No growth data yet</p>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-neutral-900 dark:text-white">Recent Activity</h3>
            <Link href="/dashboard/audit-logs" className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {d.recentActivity.slice(0, 15).map((log) => (
              <div key={log.id} className="flex items-start gap-3 py-2 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-xs font-medium text-neutral-600 dark:text-neutral-400 flex-shrink-0">
                  {log.user.avatar
                    ? <img src={log.user.avatar} alt="" className="w-8 h-8 rounded-full" />
                    : log.user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-neutral-900 dark:text-white">
                    <span className="font-medium">{log.user.name}</span>{' '}
                    <span className="text-neutral-500">{log.action.toLowerCase()} {log.entityType.toLowerCase()}</span>{' '}
                    {log.entityName && <span className="font-medium">{log.entityName}</span>}
                  </p>
                  <p className="text-xs text-neutral-400 mt-0.5">{new Date(log.createdAt).toLocaleString()}</p>
                </div>
              </div>
            ))}
            {d.recentActivity.length === 0 && (
              <p className="text-neutral-500 text-sm text-center py-4">No recent activity</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { href: '/dashboard/admin/users', icon: Users, color: 'text-blue-500', title: 'Manage Users', desc: 'Invite, deactivate, change roles' },
          { href: '/dashboard/admin/notifications', icon: Activity, color: 'text-violet-500', title: 'Send Notification', desc: 'Push to all devices or specific users' },
          { href: '/dashboard/admin/subscriptions', icon: CreditCard, color: 'text-emerald-500', title: 'Manage Plans', desc: 'View and override subscriptions' },
        ].map((item) => (
          <Link key={item.href} href={item.href} className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors group">
            <div className="flex items-center gap-3">
              <item.icon className={`w-5 h-5 ${item.color}`} />
              <div>
                <p className="font-medium text-neutral-900 dark:text-white group-hover:underline">{item.title}</p>
                <p className="text-xs text-neutral-500">{item.desc}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-neutral-400 ml-auto" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
