"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  Users,
  Database,
  Server,
  Activity,
  HardDrive,
  Cpu,
  MemoryStick,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  LogOut,
  FileText,
  Settings,
  Trash2,
  Edit,
  Search,
  ChevronDown,
  Globe,
  Zap,
  TrendingUp,
  Calendar,
  BarChart3,
  Lock,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";

interface Overview {
  totalUsers: number;
  totalCustomers: number;
  totalDeals: number;
  totalContacts: number;
  totalTasks: number;
  totalActivities: number;
  usersByRole: Record<string, number>;
  recentSignups: number;
  activeUsersToday: number;
}

interface SystemHealth {
  status: string;
  uptime: number;
  memory: { used: number; total: number; percentage: number };
  cpu: { cores: number; model: string; loadAvg: number[] };
  platform: string;
  nodeVersion: string;
  timestamp: string;
}

interface DbStats {
  tables: { name: string; count: number }[];
  connectionPool: { active: number; idle: number; total: number };
}

interface User {
  id: string;
  email: string;
  name: string;
  company: string | null;
  role: string;
  avatar: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  subscription?: { plan: string; status: string };
  _count?: { customers: number; deals: number; tasksAssigned: number };
}

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  userId: string;
  user: { id: string; name: string; email: string; avatar: string | null };
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

type Tab = "overview" | "users" | "health" | "logs" | "settings";

export default function PlatformAdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // Data states
  const [overview, setOverview] = useState<Overview | null>(null);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [dbStats, setDbStats] = useState<DbStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // User management
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const getToken = () => localStorage.getItem("platform_admin_token");

  const fetchWithAuth = useCallback(async (endpoint: string) => {
    const token = getToken();
    if (!token) {
      router.push("/platform-admin/login");
      return null;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    const res = await fetch(
      `${apiUrl}/platform-admin${endpoint}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (res.status === 401 || res.status === 403) {
      localStorage.removeItem("platform_admin_token");
      router.push("/platform-admin/login");
      return null;
    }

    return res.json();
  }, [router]);

  const loadData = useCallback(async () => {
    try {
      const [overviewRes, healthRes, dbRes, usersRes, logsRes] = await Promise.all([
        fetchWithAuth("/overview"),
        fetchWithAuth("/health"),
        fetchWithAuth("/db-stats"),
        fetchWithAuth("/users"),
        fetchWithAuth("/audit-logs?limit=100"),
      ]);

      // Transform overview data from backend structure
      if (overviewRes?.data) {
        const { users, data: entityData } = overviewRes.data;
        setOverview({
          totalUsers: users?.total ?? 0,
          totalCustomers: entityData?.customers ?? 0,
          totalDeals: entityData?.deals ?? 0,
          totalContacts: 0, // No contacts count in backend response
          totalTasks: entityData?.tasks ?? 0,
          totalActivities: entityData?.activities ?? 0,
          usersByRole: users?.byRole ?? {},
          recentSignups: users?.newLast7d ?? 0,
          activeUsersToday: users?.newLast24h ?? 0,
        });
      }
      
      // Transform health data from backend structure
      if (healthRes?.data) {
        const { status, timestamp, system } = healthRes.data;
        setHealth({
          status: status ?? 'unknown',
          timestamp: timestamp ?? new Date().toISOString(),
          uptime: system?.uptime ?? 0,
          memory: {
            used: system?.memory?.used ?? 0,
            total: system?.memory?.total ?? 1,
            percentage: parseFloat(system?.memory?.usagePercent ?? '0'),
          },
          cpu: {
            cores: system?.cpu?.cores ?? 0,
            model: system?.cpu?.model ?? 'Unknown',
            loadAvg: system?.cpu?.loadAvg ?? [0, 0, 0],
          },
          platform: system?.platform ?? 'unknown',
          nodeVersion: system?.nodeVersion ?? 'unknown',
        });
      }
      
      // Transform DB stats from backend structure
      if (dbRes?.data) {
        const tablesObj = dbRes.data.tables ?? {};
        const tablesArray = Object.entries(tablesObj).map(([name, count]) => ({
          name,
          count: count as number,
        }));
        setDbStats({
          tables: tablesArray,
          connectionPool: { active: 0, idle: 0, total: 0 }, // Not provided by backend
        });
      }
      
      if (usersRes?.data) setUsers(usersRes.data);
      if (logsRes?.data) setAuditLogs(logsRes.data);
    } catch (err) {
      setError("Failed to load data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchWithAuth]);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/platform-admin/login");
      return;
    }
    loadData();
  }, [loadData, router]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleLogout = () => {
    localStorage.removeItem("platform_admin_token");
    router.push("/platform-admin/login");
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    const token = getToken();

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const res = await fetch(
        `${apiUrl}/platform-admin/users/${selectedUser.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.ok) {
        setUsers(users.filter((u) => u.id !== selectedUser.id));
        setShowDeleteModal(false);
        setSelectedUser(null);
      }
    } catch {
      setError("Failed to delete user");
    }
  };

  const handleUpdateUser = async (role: string) => {
    if (!selectedUser) return;
    const token = getToken();

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const res = await fetch(
        `${apiUrl}/platform-admin/users/${selectedUser.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ role }),
        }
      );

      if (res.ok) {
        setUsers(users.map((u) => (u.id === selectedUser.id ? { ...u, role } : u)));
        setShowEditModal(false);
        setSelectedUser(null);
      }
    } catch {
      setError("Failed to update user");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "Passwords don't match" });
      return;
    }

    setPasswordLoading(true);
    setPasswordMessage(null);

    try {
      const token = getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const res = await fetch(
        `${apiUrl}/platform-admin/change-password`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ currentPassword, newPassword }),
        }
      );

      const data = await res.json();
      if (res.ok) {
        setPasswordMessage({ type: "success", text: "Password changed successfully" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPasswordMessage({ type: "error", text: data.message || "Failed to change password" });
      }
    } catch {
      setPasswordMessage({ type: "error", text: "Failed to change password" });
    } finally {
      setPasswordLoading(false);
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${mins}m`;
  };

  const formatBytes = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024);
    return gb.toFixed(2) + " GB";
  };

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.company?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
          <p className="text-neutral-400">Loading Platform Admin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Grid Background */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#1a1a1a_1px,transparent_1px),linear-gradient(to_bottom,#1a1a1a_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-neutral-950/90 backdrop-blur-xl border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h1 className="text-white font-bold">Platform Admin</h1>
                <p className="text-neutral-500 text-xs">Nexus CRM System</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 bg-neutral-800/50 hover:bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-400 hover:text-white transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-red-400 transition-all"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Error Banner */}
        {error && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
            <AlertTriangle className="w-5 h-5" />
            {error}
            <button onClick={() => setError("")} className="ml-auto hover:text-red-300">
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {[
            { id: "overview", label: "Overview", icon: BarChart3 },
            { id: "users", label: "Users", icon: Users },
            { id: "health", label: "System Health", icon: Activity },
            { id: "logs", label: "Audit Logs", icon: FileText },
            { id: "settings", label: "Settings", icon: Settings },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-red-500/10 text-red-400 border border-red-500/20"
                  : "bg-neutral-800/50 text-neutral-400 border border-neutral-700 hover:bg-neutral-800 hover:text-white"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && overview && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Users", value: overview.totalUsers ?? 0, icon: Users, color: "blue" },
                { label: "Customers", value: overview.totalCustomers ?? 0, icon: Globe, color: "green" },
                { label: "Deals", value: overview.totalDeals ?? 0, icon: Zap, color: "amber" },
                { label: "Contacts", value: overview.totalContacts ?? 0, icon: Users, color: "purple" },
                { label: "Tasks", value: overview.totalTasks ?? 0, icon: FileText, color: "pink" },
                { label: "Activities", value: overview.totalActivities ?? 0, icon: Activity, color: "cyan" },
                { label: "New Signups (7d)", value: overview.recentSignups ?? 0, icon: TrendingUp, color: "emerald" },
                { label: "Active Today", value: overview.activeUsersToday ?? 0, icon: Clock, color: "orange" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-5"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 bg-${stat.color}-500/10 rounded-lg`}>
                      <stat.icon className={`w-5 h-5 text-${stat.color}-400`} />
                    </div>
                    <span className="text-neutral-400 text-sm">{stat.label}</span>
                  </div>
                  <p className="text-3xl font-bold text-white">{stat.value.toLocaleString()}</p>
                </div>
              ))}
            </div>

            {/* Users by Role */}
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-neutral-400" />
                Users by Role
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {Object.entries(overview.usersByRole).map(([role, count]) => (
                  <div key={role} className="bg-neutral-800/50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-white">{count}</p>
                    <p className="text-neutral-400 text-sm capitalize">{role.toLowerCase()}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Database Stats */}
            {dbStats && (
              <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Database className="w-5 h-5 text-neutral-400" />
                  Database Statistics
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {dbStats.tables.map((table) => (
                    <div key={table.name} className="bg-neutral-800/50 rounded-lg p-3">
                      <p className="text-lg font-bold text-white">{table.count.toLocaleString()}</p>
                      <p className="text-neutral-500 text-xs capitalize">{table.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="space-y-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users by email or name..."
                className="w-full pl-12 pr-4 py-3 bg-neutral-900/50 border border-neutral-800 rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-red-500/50"
              />
            </div>

            {/* Users Table */}
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-neutral-800/50 border-b border-neutral-700">
                      <th className="text-left p-4 text-neutral-400 font-medium text-sm">User</th>
                      <th className="text-left p-4 text-neutral-400 font-medium text-sm">Role</th>
                      <th className="text-left p-4 text-neutral-400 font-medium text-sm">Plan</th>
                      <th className="text-left p-4 text-neutral-400 font-medium text-sm">Stats</th>
                      <th className="text-left p-4 text-neutral-400 font-medium text-sm">Status</th>
                      <th className="text-right p-4 text-neutral-400 font-medium text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b border-neutral-800 hover:bg-neutral-800/30">
                        <td className="p-4">
                          <div>
                            <p className="text-white font-medium">
                              {user.name || 'Unknown'}
                            </p>
                            <p className="text-neutral-500 text-sm truncate max-w-[200px]">{user.email}</p>
                            {user.company && <p className="text-neutral-600 text-xs">{user.company}</p>}
                          </div>
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                              user.role === "ADMIN"
                                ? "bg-red-500/10 text-red-400"
                                : user.role === "MANAGER"
                                ? "bg-amber-500/10 text-amber-400"
                                : "bg-neutral-500/10 text-neutral-400"
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                              user.subscription?.plan === "ENTERPRISE"
                                ? "bg-purple-500/10 text-purple-400"
                                : user.subscription?.plan === "PROFESSIONAL"
                                ? "bg-blue-500/10 text-blue-400"
                                : user.subscription?.plan === "STARTER"
                                ? "bg-green-500/10 text-green-400"
                                : "bg-neutral-500/10 text-neutral-400"
                            }`}
                          >
                            {user.subscription?.plan || "FREE"}
                          </span>
                        </td>
                        <td className="p-4 text-neutral-400 text-sm">
                          {user._count && (
                            <span>
                              {user._count.customers}C / {user._count.deals}D / {user._count.tasksAssigned}T
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                              user.isActive
                                ? "bg-green-500/10 text-green-400"
                                : "bg-red-500/10 text-red-400"
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? "bg-green-400" : "bg-red-400"}`} />
                            {user.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setShowEditModal(true);
                              }}
                              className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-neutral-400 hover:text-white transition-all"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setShowDeleteModal(true);
                              }}
                              className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-400 transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Health Tab */}
        {activeTab === "health" && health && (
          <div className="space-y-6">
            {/* Status Banner */}
            <div
              className={`p-6 rounded-xl border ${
                health.status === "healthy"
                  ? "bg-green-500/10 border-green-500/20"
                  : "bg-red-500/10 border-red-500/20"
              }`}
            >
              <div className="flex items-center gap-4">
                {health.status === "healthy" ? (
                  <CheckCircle className="w-8 h-8 text-green-400" />
                ) : (
                  <AlertTriangle className="w-8 h-8 text-red-400" />
                )}
                <div>
                  <h3 className="text-xl font-bold text-white capitalize">{health.status}</h3>
                  <p className="text-neutral-400">System is operating normally</p>
                </div>
              </div>
            </div>

            {/* System Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Uptime */}
              <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Clock className="w-5 h-5 text-blue-400" />
                  </div>
                  <span className="text-neutral-400 text-sm">Uptime</span>
                </div>
                <p className="text-2xl font-bold text-white font-mono">{formatUptime(health.uptime)}</p>
              </div>

              {/* Memory */}
              <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <MemoryStick className="w-5 h-5 text-purple-400" />
                  </div>
                  <span className="text-neutral-400 text-sm">Memory</span>
                </div>
                <p className="text-2xl font-bold text-white">{health.memory.percentage.toFixed(1)}%</p>
                <p className="text-neutral-500 text-xs mt-1">
                  {formatBytes(health.memory.used)} / {formatBytes(health.memory.total)}
                </p>
                <div className="mt-3 h-2 bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full"
                    style={{ width: `${health.memory.percentage}%` }}
                  />
                </div>
              </div>

              {/* CPU */}
              <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-amber-500/10 rounded-lg">
                    <Cpu className="w-5 h-5 text-amber-400" />
                  </div>
                  <span className="text-neutral-400 text-sm">CPU</span>
                </div>
                <p className="text-2xl font-bold text-white">{health.cpu.cores} Cores</p>
                <p className="text-neutral-500 text-xs mt-1 truncate">{health.cpu.model}</p>
              </div>

              {/* Platform */}
              <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <Server className="w-5 h-5 text-green-400" />
                  </div>
                  <span className="text-neutral-400 text-sm">Platform</span>
                </div>
                <p className="text-xl font-bold text-white capitalize">{health.platform}</p>
                <p className="text-neutral-500 text-xs mt-1">Node {health.nodeVersion}</p>
              </div>
            </div>

            {/* DB Connection Pool */}
            {dbStats && (
              <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Database className="w-5 h-5 text-neutral-400" />
                  Database Connection Pool
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-neutral-800/50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-green-400">{dbStats.connectionPool.active}</p>
                    <p className="text-neutral-500 text-sm">Active</p>
                  </div>
                  <div className="bg-neutral-800/50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-amber-400">{dbStats.connectionPool.idle}</p>
                    <p className="text-neutral-500 text-sm">Idle</p>
                  </div>
                  <div className="bg-neutral-800/50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-blue-400">{dbStats.connectionPool.total}</p>
                    <p className="text-neutral-500 text-sm">Total</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Logs Tab */}
        {activeTab === "logs" && (
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-neutral-800">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5 text-neutral-400" />
                Recent Audit Logs
              </h3>
            </div>
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-neutral-800/80 backdrop-blur-sm">
                  <tr>
                    <th className="text-left p-3 text-neutral-400 font-medium text-sm">Action</th>
                    <th className="text-left p-3 text-neutral-400 font-medium text-sm">Entity</th>
                    <th className="text-left p-3 text-neutral-400 font-medium text-sm">User</th>
                    <th className="text-left p-3 text-neutral-400 font-medium text-sm">IP</th>
                    <th className="text-left p-3 text-neutral-400 font-medium text-sm">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="border-b border-neutral-800/50 hover:bg-neutral-800/30">
                      <td className="p-3">
                        <span
                          className={`inline-flex px-2 py-1 rounded text-xs font-mono ${
                            log.action.includes("CREATE")
                              ? "bg-green-500/10 text-green-400"
                              : log.action.includes("DELETE")
                              ? "bg-red-500/10 text-red-400"
                              : log.action.includes("UPDATE")
                              ? "bg-amber-500/10 text-amber-400"
                              : "bg-blue-500/10 text-blue-400"
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="p-3 text-neutral-400 text-sm font-mono">
                        {log.entityType}
                        {log.entityId && <span className="text-neutral-600">#{log.entityId.slice(0, 8)}</span>}
                      </td>
                      <td className="p-3 text-neutral-300 text-sm">{log.user?.email || "System"}</td>
                      <td className="p-3 text-neutral-500 text-sm font-mono">{log.ipAddress || "-"}</td>
                      <td className="p-3 text-neutral-500 text-sm">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            {/* Change Password */}
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6">
              <h3 className="text-white font-semibold mb-6 flex items-center gap-2">
                <Lock className="w-5 h-5 text-neutral-400" />
                Change Admin Password
              </h3>

              <form onSubmit={handleChangePassword} className="max-w-md space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      className="w-full px-4 py-3 pr-12 bg-neutral-800/50 border border-neutral-700 rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400"
                    >
                      {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={12}
                      className="w-full px-4 py-3 pr-12 bg-neutral-800/50 border border-neutral-700 rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400"
                    >
                      {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700 rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 font-mono"
                  />
                </div>

                {passwordMessage && (
                  <div
                    className={`p-4 rounded-xl text-sm ${
                      passwordMessage.type === "success"
                        ? "bg-green-500/10 border border-green-500/20 text-green-400"
                        : "bg-red-500/10 border border-red-500/20 text-red-400"
                    }`}
                  >
                    {passwordMessage.text}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  {passwordLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Password"
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-2">Manage User</h3>
            <p className="text-neutral-500 text-sm mb-6 truncate">
              {selectedUser.email}
            </p>
            
            {/* User Info */}
            <div className="bg-neutral-800/30 border border-neutral-700/50 rounded-xl p-4 mb-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-neutral-500">Name:</span>
                  <p className="text-white">{selectedUser.name || 'Not set'}</p>
                </div>
                <div>
                  <span className="text-neutral-500">Company:</span>
                  <p className="text-white">{selectedUser.company || 'Not set'}</p>
                </div>
                <div>
                  <span className="text-neutral-500">Customers:</span>
                  <p className="text-white">{selectedUser._count?.customers || 0}</p>
                </div>
                <div>
                  <span className="text-neutral-500">Deals:</span>
                  <p className="text-white">{selectedUser._count?.deals || 0}</p>
                </div>
              </div>
            </div>

            {/* Role Selection */}
            <div className="mb-6">
              <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-neutral-400" />
                Role
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {["USER", "MANAGER", "ADMIN"].map((role) => (
                  <button
                    key={role}
                    onClick={() => handleUpdateUser(role)}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      selectedUser.role === role
                        ? "bg-red-500/10 border-red-500/30 text-red-400"
                        : "bg-neutral-800/50 border-neutral-700 text-neutral-300 hover:bg-neutral-800"
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            {/* Subscription Plan */}
            <div className="mb-6">
              <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-neutral-400" />
                Subscription Plan
                <span className="ml-auto text-xs text-neutral-500">
                  Current: {selectedUser.subscription?.plan || 'FREE'}
                </span>
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { plan: "FREE", desc: "Basic features", color: "neutral" },
                  { plan: "STARTER", desc: "For individuals", color: "green" },
                  { plan: "PROFESSIONAL", desc: "For teams", color: "blue" },
                  { plan: "ENTERPRISE", desc: "Unlimited", color: "purple" },
                ].map(({ plan, desc, color }) => (
                  <button
                    key={plan}
                    onClick={async () => {
                      const token = getToken();
                      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
                      try {
                        const res = await fetch(`${apiUrl}/platform-admin/users/${selectedUser.id}/subscription`, {
                          method: "PUT",
                          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                          body: JSON.stringify({ plan }),
                        });
                        if (res.ok) {
                          setUsers(users.map((u) => 
                            u.id === selectedUser.id 
                              ? { ...u, subscription: { ...u.subscription, plan, status: 'ACTIVE' } }
                              : u
                          ));
                          setSelectedUser({ ...selectedUser, subscription: { plan, status: 'ACTIVE' } });
                        }
                      } catch (e) {
                        setError("Failed to update subscription");
                      }
                    }}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selectedUser.subscription?.plan === plan
                        ? `bg-${color}-500/10 border-${color}-500/30 text-${color}-400`
                        : "bg-neutral-800/50 border-neutral-700 text-neutral-300 hover:bg-neutral-800"
                    }`}
                  >
                    <p className="font-medium">{plan}</p>
                    <p className="text-xs text-neutral-500">{desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Active Status */}
            <div className="mb-6">
              <h4 className="text-white font-medium mb-3">Account Status</h4>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    const token = getToken();
                    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
                    try {
                      const res = await fetch(`${apiUrl}/platform-admin/users/${selectedUser.id}`, {
                        method: "PUT",
                        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                        body: JSON.stringify({ isActive: true }),
                      });
                      if (res.ok) {
                        setUsers(users.map((u) => u.id === selectedUser.id ? { ...u, isActive: true } : u));
                        setSelectedUser({ ...selectedUser, isActive: true });
                      }
                    } catch (e) {
                      setError("Failed to update status");
                    }
                  }}
                  className={`flex-1 p-3 rounded-xl border transition-all ${
                    selectedUser.isActive
                      ? "bg-green-500/10 border-green-500/30 text-green-400"
                      : "bg-neutral-800/50 border-neutral-700 text-neutral-300 hover:bg-neutral-800"
                  }`}
                >
                  <CheckCircle className="w-4 h-4 inline mr-2" />
                  Active
                </button>
                <button
                  onClick={async () => {
                    const token = getToken();
                    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
                    try {
                      const res = await fetch(`${apiUrl}/platform-admin/users/${selectedUser.id}`, {
                        method: "PUT",
                        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                        body: JSON.stringify({ isActive: false }),
                      });
                      if (res.ok) {
                        setUsers(users.map((u) => u.id === selectedUser.id ? { ...u, isActive: false } : u));
                        setSelectedUser({ ...selectedUser, isActive: false });
                      }
                    } catch (e) {
                      setError("Failed to update status");
                    }
                  }}
                  className={`flex-1 p-3 rounded-xl border transition-all ${
                    !selectedUser.isActive
                      ? "bg-red-500/10 border-red-500/30 text-red-400"
                      : "bg-neutral-800/50 border-neutral-700 text-neutral-300 hover:bg-neutral-800"
                  }`}
                >
                  <XCircle className="w-4 h-4 inline mr-2" />
                  Suspended
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                setShowEditModal(false);
                setSelectedUser(null);
              }}
              className="w-full p-3 bg-neutral-800 hover:bg-neutral-700 rounded-xl text-neutral-300 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-red-500/10 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Delete User</h3>
            </div>
            <p className="text-neutral-400 mb-6">
              Are you sure you want to delete <strong className="text-white">{selectedUser.email}</strong>?
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedUser(null);
                }}
                className="flex-1 p-3 bg-neutral-800 hover:bg-neutral-700 rounded-xl text-neutral-300 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                className="flex-1 p-3 bg-red-600 hover:bg-red-500 rounded-xl text-white transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
