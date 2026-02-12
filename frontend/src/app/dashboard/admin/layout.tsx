'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, CreditCard, Bell, Smartphone,
  Settings, ArrowLeft, Shield,
} from 'lucide-react';

const adminNav = [
  { name: 'Overview', href: '/dashboard/admin', icon: LayoutDashboard },
  { name: 'Users', href: '/dashboard/admin/users', icon: Users },
  { name: 'Subscriptions', href: '/dashboard/admin/subscriptions', icon: CreditCard },
  { name: 'Notifications', href: '/dashboard/admin/notifications', icon: Bell },
  { name: 'Mobile App', href: '/dashboard/admin/mobile', icon: Smartphone },
  { name: 'Settings', href: '/dashboard/admin/settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <Shield className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Admin Dashboard</h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Manage your platform, users, and subscriptions</p>
          </div>
        </div>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white bg-neutral-100 dark:bg-neutral-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to CRM
        </Link>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex gap-1 overflow-x-auto bg-neutral-100 dark:bg-neutral-800/50 p-1 rounded-xl">
        {adminNav.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/dashboard/admin' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-neutral-900/50'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.name}
            </Link>
          );
        })}
      </div>

      {/* Page Content */}
      {children}
    </div>
  );
}
