'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import api from '@/lib/api';
import { StatCard } from '@/components/ui/stat-card';
import { Pagination } from '@/components/ui/pagination';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { RoleBadge } from '@/components/ui/status-badges';
import type { UserWithCounts, PlatformStats } from '@/lib/types';
import {
  Shield, Users, Search, MoreVertical, UserCheck, UserX,
  Crown, TrendingUp, BarChart3, UserPlus, Settings, X, Mail,
} from 'lucide-react';

export default function AdminPage() {
  const { getToken } = useAuth();
  const [users, setUsers] = useState<UserWithCounts[]>([]);
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
  const [activeTab, setActiveTab] = useState<'users' | 'invite' | 'settings'>('users');
  const actionMenuRef = useRef<HTMLDivElement>(null);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    variant: 'danger' | 'warning';
    onConfirm: () => void;
  }>({ open: false, title: '', message: '', confirmLabel: '', variant: 'danger', onConfirm: () => {} });

  // Invite form
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', role: 'USER' });
  const [inviteLoading, setInviteLoading] = useState(false);

  // Close action menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target as Node)) {
        setActionMenu(null);
      }
    };
    if (actionMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [actionMenu]);

  const fetchData = useCallback(async () => {
    try {
      const token = await getToken();
      api.setToken(token);

      const [usersRes, statsRes] = await Promise.all([
        api.getUsers({ search, role: roleFilter, isActive: statusFilter, page, limit: 20 }),
        api.getPlatformStats(),
      ]);

      if (usersRes.success) {
        setUsers((usersRes.data as UserWithCounts[]) || []);
        setTotalPages(usersRes.totalPages || 1);
      }
      if (statsRes.success) {
        setStats((statsRes.data as PlatformStats) || null);
      }
      setError(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '';
      if (message.includes('403') || message.includes('permission')) {
        setError('You do not have admin access. Only ADMIN users can access this page.');
      } else {
        setError('Failed to load admin data. Make sure you have admin privileges.');
      }
    } finally {
      setLoading(false);
    }
  }, [getToken, search, roleFilter, statusFilter, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleRoleChange = (userId: string, newRole: string) => {
    setConfirmDialog({
      open: true,
      title: 'Change User Role',
      message: `Are you sure you want to change this user's role to ${newRole}? This will change their permissions across the platform.`,
      confirmLabel: `Change to ${newRole}`,
      variant: newRole === 'ADMIN' ? 'danger' : 'warning',
      onConfirm: async () => {
        try {
          const token = await getToken();
          api.setToken(token);
          const res = await api.updateUserRole(userId, newRole);
          if (res.success) {
            showFeedback('success', `Role updated to ${newRole}`);
            fetchData();
          } else {
            showFeedback('error', 'Failed to update role');
          }
        } catch {
          showFeedback('error', 'Failed to update role');
        }
        setConfirmDialog(prev => ({ ...prev, open: false }));
      },
    });
    setActionMenu(null);
  };

  const handleToggleStatus = (userId: string, currentStatus: boolean) => {
    setConfirmDialog({
      open: true,
      title: currentStatus ? 'Deactivate User' : 'Activate User',
      message: currentStatus
        ? 'This user will no longer be able to access the platform. Their data will be preserved.'
        : 'This user will regain full access to the platform.',
      confirmLabel: currentStatus ? 'Deactivate' : 'Activate',
      variant: currentStatus ? 'danger' : 'warning',
      onConfirm: async () => {
        try {
          const token = await getToken();
          api.setToken(token);
          await api.toggleUserStatus(userId, !currentStatus);
          showFeedback('success', `User ${currentStatus ? 'deactivated' : 'activated'} successfully`);
          fetchData();
        } catch {
          showFeedback('error', 'Failed to toggle user status');
        }
        setConfirmDialog(prev => ({ ...prev, open: false }));
      },
    });
    setActionMenu(null);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteForm.name || !inviteForm.email) return;
    setInviteLoading(true);
    try {
      const token = await getToken();
      api.setToken(token);
      const res = await api.inviteUser(inviteForm);
      if (res.success) {
        showFeedback('success', `Invitation sent to ${inviteForm.email}`);
        setInviteForm({ name: '', email: '', role: 'USER' });
        fetchData();
      } else {
        showFeedback('error', res.message || 'Failed to send invitation');
      }
    } catch (err: unknown) {
      showFeedback('error', err instanceof Error ? err.message : 'Failed to send invitation');
    } finally {
      setInviteLoading(false);
    }
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
      {/* Header */}
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
          <button onClick={() => setFeedback(null)} className="ml-auto text-lg leading-none">&times;</button>
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

      {/* Tabs */}
      <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800/50 p-1 rounded-lg w-fit">
        {([
          { key: 'users', label: 'Users', icon: Users },
          { key: 'invite', label: 'Invite User', icon: UserPlus },
          { key: 'settings', label: 'Settings', icon: Settings },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <>
          {/* Filters */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                  className="w-full pl-10 pr-4 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent text-neutral-900 dark:text-white"
                  aria-label="Search users"
                />
              </div>
              <select
                value={roleFilter}
                onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
                className="px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white"
                aria-label="Filter by role"
              >
                <option value="">All Roles</option>
                <option value="ADMIN">Admin</option>
                <option value="MANAGER">Manager</option>
                <option value="USER">User</option>
              </select>
              <select
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                className="px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white"
                aria-label="Filter by status"
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
              <table className="w-full" role="table">
                <thead className="bg-neutral-50 dark:bg-neutral-800/50">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase" scope="col">User</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase" scope="col">Role</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase" scope="col">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase" scope="col">Stats</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase" scope="col">Joined</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase" scope="col">Actions</th>
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
                        <RoleBadge value={user.role} />
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
                        <div className="relative" ref={actionMenu === user.id ? actionMenuRef : null}>
                          <button
                            onClick={() => setActionMenu(actionMenu === user.id ? null : user.id)}
                            className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded"
                            aria-label={`Actions for ${user.name}`}
                            aria-expanded={actionMenu === user.id}
                            aria-haspopup="true"
                          >
                            <MoreVertical className="w-4 h-4 text-neutral-500" />
                          </button>
                          {actionMenu === user.id && (
                            <div
                              className="absolute right-0 top-8 w-48 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg z-10"
                              role="menu"
                            >
                              <div className="p-1">
                                <p className="px-3 py-1 text-xs text-neutral-400 uppercase">Change Role</p>
                                {(['ADMIN', 'MANAGER', 'USER'] as const).map(role => (
                                  <button
                                    key={role}
                                    onClick={() => handleRoleChange(user.id, role)}
                                    disabled={user.role === role}
                                    role="menuitem"
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
                                  role="menuitem"
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
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-neutral-500 dark:text-neutral-400">
                        No users found matching your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </>
      )}

      {/* Invite User Tab */}
      {activeTab === 'invite' && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6 max-w-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
              <Mail className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Invite New User</h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Send an invitation email to a new team member</p>
            </div>
          </div>

          <form onSubmit={handleInvite} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={inviteForm.name}
                onChange={e => setInviteForm(f => ({ ...f, name: e.target.value }))}
                placeholder="John Doe"
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={inviteForm.email}
                onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))}
                placeholder="john@company.com"
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Role
              </label>
              <select
                value={inviteForm.role}
                onChange={e => setInviteForm(f => ({ ...f, role: e.target.value }))}
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white"
              >
                <option value="USER">User</option>
                <option value="MANAGER">Manager</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={inviteLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4" />
              {inviteLoading ? 'Sending...' : 'Send Invitation'}
            </button>
          </form>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Settings className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Platform Settings</h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Configure platform-wide settings</p>
            </div>
          </div>

          <div className="grid gap-6 max-w-2xl">
            <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-700">
              <h3 className="text-sm font-medium text-neutral-900 dark:text-white mb-1">Platform Version</h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Nexus CRM v4.0.0</p>
            </div>
            <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-700">
              <h3 className="text-sm font-medium text-neutral-900 dark:text-white mb-1">Database</h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">PostgreSQL via Neon (Serverless)</p>
            </div>
            <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-700">
              <h3 className="text-sm font-medium text-neutral-900 dark:text-white mb-1">Authentication</h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Clerk + Local JWT</p>
            </div>
            <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-700">
              <h3 className="text-sm font-medium text-neutral-900 dark:text-white mb-1">Real-time</h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Socket.IO WebSocket</p>
            </div>
            <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-700">
              <h3 className="text-sm font-medium text-neutral-900 dark:text-white mb-1">Cache</h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Redis (with in-memory fallback)</p>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel}
        variant={confirmDialog.variant}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
      />
    </div>
  );
}
