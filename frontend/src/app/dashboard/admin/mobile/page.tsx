'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import api from '@/lib/api';
import { Smartphone, Search, Wifi, WifiOff } from 'lucide-react';

interface PushToken {
  id: string;
  token: string;
  platform: string;
  deviceName: string | null;
  isActive: boolean;
  createdAt: string;
  user: { id: string; name: string; email: string; avatar?: string };
}

export default function MobileAppPage() {
  const { getToken } = useAuth();
  const [tokens, setTokens] = useState<PushToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [platformFilter, setPlatformFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [platformStats, setPlatformStats] = useState<Record<string, number>>({});

  const fetchData = useCallback(async () => {
    try {
      const token = await getToken();
      api.setToken(token);
      const res = await api.getAdminPushTokens({
        platform: platformFilter, page, limit: 20,
      });
      if (res.success) {
        setTokens((res.data as PushToken[]) || []);
        setTotalPages(res.totalPages || 1);
        setTotal(res.total as number || 0);
        setPlatformStats((res as any).platformStats || {});
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [getToken, platformFilter, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-neutral-200 dark:bg-neutral-800 rounded-xl" />)}
        </div>
        <div className="h-96 bg-neutral-200 dark:bg-neutral-800 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Smartphone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">Total Devices</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">{total}</p>
            </div>
          </div>
        </div>
        <div className="p-5 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
              <Wifi className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">Android Devices</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">{platformStats.android || 0}</p>
            </div>
          </div>
        </div>
        <div className="p-5 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-neutral-100 dark:bg-neutral-800">
              <Smartphone className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">iOS Devices</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">{platformStats.ios || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <p className="text-sm text-blue-700 dark:text-blue-400">
          <strong>Mobile App:</strong> The Nexus CRM mobile app is built with Expo (React Native).
          Users who install the app and sign in will automatically register their device for push notifications.
          You can manage devices here and send notifications from the{' '}
          <a href="/dashboard/admin/notifications" className="underline">Notifications</a> tab.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
        <div className="flex gap-3">
          <select value={platformFilter} onChange={e => { setPlatformFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white">
            <option value="">All Platforms</option>
            <option value="android">Android</option>
            <option value="ios">iOS</option>
            <option value="web">Web</option>
          </select>
        </div>
      </div>

      {/* Devices Table */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 dark:bg-neutral-800/50">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase">User</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase">Platform</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase">Device</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase">Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {tokens.map(t => (
                <tr key={t.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 text-sm font-medium">
                        {t.user.avatar
                          ? <img src={t.user.avatar} alt="" className="w-8 h-8 rounded-full" />
                          : t.user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-neutral-900 dark:text-white">{t.user.name}</p>
                        <p className="text-xs text-neutral-500">{t.user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                      t.platform === 'android' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : t.platform === 'ios' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                    }`}>
                      {t.platform}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-500">{t.deviceName || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                      t.isActive ? 'text-emerald-600' : 'text-neutral-400'
                    }`}>
                      {t.isActive ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                      {t.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-500">
                    {new Date(t.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {tokens.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-neutral-500">
                    No mobile devices registered yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200 dark:border-neutral-800">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1 text-sm text-neutral-600 dark:text-neutral-400 disabled:opacity-50">Previous</button>
            <span className="text-sm text-neutral-500">Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-3 py-1 text-sm text-neutral-600 dark:text-neutral-400 disabled:opacity-50">Next</button>
          </div>
        )}
      </div>
    </div>
  );
}
