'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import api from '@/lib/api';
import {
  Shield, Users, Search, MoreVertical, ChevronLeft, ChevronRight,
  UserCheck, UserX, Crown, TrendingUp, BarChart3,
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  company: string | null;
  role: string;
  avatar: string | null;
  phone: string | null;
  timezone: string | null;
  isActive: boolean;
  createdAt: string;
  _count: {
    customers: number;
    deals: number;
    tasksAssigned: number;
  };
}

interface PlatformStats {
  users: {
    total: number;
    active: number;
    inactive: number;
    byRole: Record<string, number>;
  };
  entities: {
    customers: number;
    deals: number;
    tasks: number;
  };
  revenue: {
    totalWon: number;
    dealsWon: number;
  };
}

export default function AdminPage() {
  const { getToken } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const token = await getToken();
      api.setToken(token);

      const [usersRes, statsRes] = await Promise.all([
        api.getUsers({ search, role: roleFilter, isActive: statusFilter, page, limit: 20 }),
        api.getPlatformStats(),
      ]);

      if (usersRes.success) {
        setUsers((usersRes.data as User[]) || []);
        setTotalPages((usersRes as any).totalPages || 1);
      }
      if (statsRes.success) {
        setStats((statsRes.data as PlatformStats) || null);
      }
      setError(null);
    } catch (err: any) {
      if (err?.message?.includes('403') || err?.message?.includes('permission')) {
        setError('You do not have admin access. Only ADMIN users can access this page.');
      } else {
        setError('Failed to load admin data. Make sure you have admin privileges.');
      }
    } finally {
      setLoading(false);
    }
  }, [getToken, search, roleFilter, statusFilter, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const token = await getToken();
      api.setToken(token);
      const res = await api.updateUserRole(userId, newRole);
      if (res.success) {
        setFeedback({ type: 'success', message: `Role updated to ${newRole}` });
        fetchData();
      } else {
        setFeedback({ type: 'error', message: 'Failed to update role' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Failed to update role' });
    }
    setActionMenu(null);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const token = await getToken();
      api.setToken(token);
      await api.toggleUserStatus(userId, !currentStatus);
      setFeedback({ type: 'success', message: `User ${currentStatus ? 'deactivated' : 'activated'} successfully` });
      fetchData();
    } catch {
      setFeedback({ type: 'error', message: 'Failed to toggle user status' });
    }
    setActionMenu(null);
    setTimeout(() => setFeedback(null), 3000);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Shield className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">Access Denied</h2>
          <p className="text-neutral-500 dark:text-neutral-400">{error}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-neutral-200 dark:bg-neutral-800 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-neutral-200 dark:bg-neutral-800 rounded-xl" />
          ))}
        </div>
        <div className="h-96 bg-neutral-200 dark:bg-neutral-800 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <Shield className="w-7 h-7 text-violet-600" />
            Admin Panel
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Manage users, roles, and platform settings
          </p>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div className={`flex items-center gap-3 p-3 rounded-lg text-sm font-medium ${
          feedback.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
        }`}>
          {feedback.message}
          <button onClick={() => setFeedback(null)} className="ml-auto">&times;</button>
        </div>
      )}

      {/* Platform Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Users"
            value={stats.users.total}
            subtitle={`${stats.users.active} active, ${stats.users.inactive} inactive`}
            icon={<Users className="w-5 h-5" />}
            color="violet"
          />
          <StatCard
            title="Customers"
            value={stats.entities.customers}
            subtitle={`${stats.entities.deals} deals, ${stats.entities.tasks} tasks`}
            icon={<BarChart3 className="w-5 h-5" />}
            color="blue"
          />
          <StatCard
            title="Revenue Won"
            value={`$${(stats.revenue.totalWon || 0).toLocaleString()}`}
            subtitle={`${stats.revenue.dealsWon} deals closed`}
            icon={<TrendingUp className="w-5 h-5" />}
            color="green"
          />
          <StatCard
            title="Roles"
            value=""
            subtitle={`${stats.users.byRole?.ADMIN || 0} admins, ${stats.users.byRole?.MANAGER || 0} managers, ${stats.users.byRole?.USER || 0} users`}
            icon={<Crown className="w-5 h-5" />}
            color="amber"
          />
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:text-white"
            />
          </div>
          <select
            value={roleFilter}
            onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm dark:text-white"
          >
            <option value="">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="MANAGER">Manager</option>
            <option value="USER">User</option>
          </select>
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm dark:text-white"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 dark:bg-neutral-800/50">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">User</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">Role</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">Stats</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">Joined</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 font-medium text-sm">
                        {user.avatar ? (
                          <img src={user.avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
                        ) : (
                          user.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900 dark:text-white text-sm">{user.name}</p>
                        <p className="text-xs text-neutral-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <RoleBadge role={user.role} />
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      user.isActive
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-500 dark:text-neutral-400">
                    {user._count.customers}c / {user._count.deals}d / {user._count.tasksAssigned}t
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-500 dark:text-neutral-400">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="relative">
                      <button
                        onClick={() => setActionMenu(actionMenu === user.id ? null : user.id)}
                        className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded"
                      >
                        <MoreVertical className="w-4 h-4 text-neutral-500" />
                      </button>
                      {actionMenu === user.id && (
                        <div className="absolute right-0 top-8 w-48 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg z-10">
                          <div className="p-1">
                            <p className="px-3 py-1 text-xs text-neutral-400 uppercase">Change Role</p>
                            {['ADMIN', 'MANAGER', 'USER'].map(role => (
                              <button
                                key={role}
                                onClick={() => handleRoleChange(user.id, role)}
                                disabled={user.role === role}
                                className={`w-full text-left px-3 py-1.5 text-sm rounded ${
                                  user.role === role
                                    ? 'text-neutral-400 cursor-not-allowed'
                                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                                }`}
                              >
                                {role === 'ADMIN' && <Crown className="inline w-3 h-3 mr-1" />}
                                {role}
                              </button>
                            ))}
                            <hr className="my-1 border-neutral-200 dark:border-neutral-700" />
                            <button
                              onClick={() => handleToggleStatus(user.id, user.isActive)}
                              className="w-full text-left px-3 py-1.5 text-sm rounded flex items-center gap-1 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                            >
                              {user.isActive ? (
                                <><UserX className="w-3 h-3" /> Deactivate</>
                              ) : (
                                <><UserCheck className="w-3 h-3" /> Activate</>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200 dark:border-neutral-800">
            <p className="text-sm text-neutral-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-40"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-40"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon, color }: {
  title: string; value: string | number; subtitle: string;
  icon: React.ReactNode; color: string;
}) {
  const colors: Record<string, string> = {
    violet: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    amber: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colors[color]}`}>
          {icon}
        </div>
        <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{title}</span>
      </div>
      {value && <p className="text-2xl font-bold text-neutral-900 dark:text-white">{value}</p>}
      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{subtitle}</p>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const config: Record<string, { bg: string; text: string }> = {
    ADMIN: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400' },
    MANAGER: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400' },
    USER: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400' },
  };
  const c = config[role] || config.USER;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      {role === 'ADMIN' && <Crown className="w-3 h-3 mr-1" />}
      {role}
    </span>
  );
}
