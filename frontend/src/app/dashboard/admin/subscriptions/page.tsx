'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import api from '@/lib/api';
import { CreditCard, Search, DollarSign, TrendingUp, Clock, AlertTriangle } from 'lucide-react';

interface SubStats {
  byPlan: Record<string, number>;
  byStatus: Record<string, number>;
  mrr: number;
  trialExpiring: number;
  totalSubscriptions: number;
}

interface Subscription {
  id: string;
  plan: string;
  status: string;
  customersUsed: number;
  dealsUsed: number;
  trialEnd: string | null;
  currentPeriodEnd: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string; avatar?: string };
}

const planColors: Record<string, string> = {
  FREE: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
  STARTER: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  PROFESSIONAL: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  ENTERPRISE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  TRIALING: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  PAST_DUE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  CANCELED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  UNPAID: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  PAUSED: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
};

export default function SubscriptionsPage() {
  const { getToken } = useAuth();
  const [stats, setStats] = useState<SubStats | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const token = await getToken();
      api.setToken(token);

      const [subsRes, statsRes] = await Promise.all([
        api.getAdminSubscriptions({ search, plan: planFilter, status: statusFilter, page, limit: 15 }),
        api.getAdminSubscriptionStats(),
      ]);

      if (subsRes.success) {
        setSubscriptions((subsRes.data as Subscription[]) || []);
        setTotalPages(subsRes.totalPages || 1);
      }
      if (statsRes.success) setStats(statsRes.data as SubStats);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [getToken, search, planFilter, statusFilter, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handlePlanChange = async (userId: string, plan: string) => {
    try {
      const token = await getToken();
      api.setToken(token);
      const res = await api.updateAdminSubscription(userId, { plan });
      if (res.success) {
        setFeedback({ type: 'success', message: `Plan updated to ${plan}` });
        fetchData();
      }
    } catch {
      setFeedback({ type: 'error', message: 'Failed to update plan' });
    }
    setTimeout(() => setFeedback(null), 3000);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-neutral-200 dark:bg-neutral-800 rounded-xl" />)}
        </div>
        <div className="h-96 bg-neutral-200 dark:bg-neutral-800 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Feedback */}
      {feedback && (
        <div className={`p-3 rounded-lg text-sm font-medium ${
          feedback.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
        }`}>
          {feedback.message}
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">Monthly Revenue</p>
                <p className="text-xl font-bold text-neutral-900 dark:text-white">${stats.mrr.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">Total Subscriptions</p>
                <p className="text-xl font-bold text-neutral-900 dark:text-white">{stats.totalSubscriptions}</p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30">
                <TrendingUp className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">Active Plans</p>
                <p className="text-xl font-bold text-neutral-900 dark:text-white">{stats.byStatus.ACTIVE || 0}</p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">Trials Expiring (3d)</p>
                <p className="text-xl font-bold text-neutral-900 dark:text-white">{stats.trialExpiring}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Plan Distribution */}
      {stats && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
          <h3 className="font-semibold text-neutral-900 dark:text-white mb-4">Plan Distribution</h3>
          <div className="flex gap-4 flex-wrap">
            {['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE'].map(plan => (
              <div key={plan} className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${planColors[plan]}`}>{plan}</span>
                <span className="text-sm font-semibold text-neutral-900 dark:text-white">{stats.byPlan[plan] || 0}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text" placeholder="Search by user name or email..."
              value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent text-neutral-900 dark:text-white"
            />
          </div>
          <select value={planFilter} onChange={e => { setPlanFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white">
            <option value="">All Plans</option>
            <option value="FREE">Free</option>
            <option value="STARTER">Starter</option>
            <option value="PROFESSIONAL">Professional</option>
            <option value="ENTERPRISE">Enterprise</option>
          </select>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white">
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="TRIALING">Trialing</option>
            <option value="PAST_DUE">Past Due</option>
            <option value="CANCELED">Canceled</option>
          </select>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 dark:bg-neutral-800/50">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase">User</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase">Plan</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase">Usage</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase">Expires</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-neutral-500 uppercase">Override</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {subscriptions.map(sub => (
                <tr key={sub.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 text-sm font-medium">
                        {sub.user.avatar
                          ? <img src={sub.user.avatar} alt="" className="w-8 h-8 rounded-full" />
                          : sub.user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-neutral-900 dark:text-white">{sub.user.name}</p>
                        <p className="text-xs text-neutral-500">{sub.user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${planColors[sub.plan] || planColors.FREE}`}>
                      {sub.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[sub.status] || statusColors.CANCELED}`}>
                      {sub.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-500">
                    {sub.customersUsed}c / {sub.dealsUsed}d
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-500">
                    {sub.trialEnd
                      ? new Date(sub.trialEnd).toLocaleDateString()
                      : sub.currentPeriodEnd
                        ? new Date(sub.currentPeriodEnd).toLocaleDateString()
                        : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <select
                      value={sub.plan}
                      onChange={e => handlePlanChange(sub.user.id, e.target.value)}
                      className="text-xs px-2 py-1 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded text-neutral-900 dark:text-white"
                    >
                      <option value="FREE">Free</option>
                      <option value="STARTER">Starter</option>
                      <option value="PROFESSIONAL">Professional</option>
                      <option value="ENTERPRISE">Enterprise</option>
                    </select>
                  </td>
                </tr>
              ))}
              {subscriptions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-neutral-500">
                    No subscriptions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200 dark:border-neutral-800">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white disabled:opacity-50">
              Previous
            </button>
            <span className="text-sm text-neutral-500">Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-3 py-1 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white disabled:opacity-50">
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
