"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import Link from "next/link";
import {
  Briefcase,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  CheckSquare,
  ArrowRight,
  Plus,
} from "lucide-react";
import { formatCurrency, formatRelativeTime } from "@/lib/hooks";

interface DashboardStats {
  totalCustomers: number;
  activeCustomers: number;
  totalDeals: number;
  totalTasks: number;
  pendingTasks: number;
  totalDealValue: number;
  wonDeals: number;
  wonValue: number;
  earningsThisMonth: number;
  earningsChangePercent: number;
  pipelineThisMonth: number;
  pipelineChangePercent: number;
  dealsThisMonth: number;
  customersChangePercent: number;
  newCustomersThisMonth: number;
  newCustomersPercent: number;
}

interface MonthlyData {
  month: string;
  value: number;
  count: number;
}

interface RecentDeal {
  id: string;
  _id: string;
  title: string;
  value: number;
  stage: string;
  createdAt?: string;
  customer?: { id: string; name: string; company?: string };
}

interface RecentTask {
  id: string;
  _id: string;
  title: string;
  status: string;
  priority: string;
  dueDate?: string;
  customer?: { id: string; name: string };
}

// Minimal Stat Card
function StatCard({
  label,
  value,
  change,
  changeType,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  change?: number;
  changeType?: "up" | "down" | "neutral";
  icon: React.ElementType;
}) {
  return (
    <div className="p-6 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{label}</p>
          <p className="text-2xl font-semibold text-neutral-900 dark:text-white mt-1">{value}</p>
          {change !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${
              changeType === "up" ? "text-emerald-600" : 
              changeType === "down" ? "text-red-500" : 
              "text-neutral-500"
            }`}>
              {changeType === "up" && <TrendingUp className="w-4 h-4" />}
              {changeType === "down" && <TrendingDown className="w-4 h-4" />}
              <span>{Math.abs(change)}% vs last month</span>
            </div>
          )}
        </div>
        <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
          <Icon className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
        </div>
      </div>
    </div>
  );
}

// Minimal Bar Chart
function MonthlyChart({ data, loading }: { data: MonthlyData[]; loading: boolean }) {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const currentMonth = new Date().getMonth();
  
  if (loading) {
    return (
      <div className="p-6 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
        <div className="animate-pulse">
          <div className="h-5 w-24 bg-neutral-200 dark:bg-neutral-800 rounded mb-6" />
          <div className="flex items-end gap-1 h-40">
            {Array(12).fill(0).map((_, i) => (
              <div key={i} className="flex-1 bg-neutral-200 dark:bg-neutral-800 rounded-sm" style={{ height: `${20 + Math.random() * 60}%` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const totalValue = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="p-6 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="font-medium text-neutral-900 dark:text-white">Revenue Overview</h3>
          <p className="text-2xl font-semibold text-neutral-900 dark:text-white mt-1">
            {formatCurrency(totalValue)}
          </p>
        </div>
        <span className="text-sm text-neutral-500">This Year</span>
      </div>
      
      <div className="flex items-end gap-1 h-40">
        {data.map((item, index) => {
          const height = maxValue > 0 ? (item.value / maxValue) * 100 : 5;
          const isCurrent = index === currentMonth;
          
          return (
            <div key={item.month} className="flex-1 flex flex-col items-center gap-2 group">
              <div className="relative w-full flex justify-center">
                {isCurrent && item.value > 0 && (
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                    {formatCurrency(item.value)}
                  </div>
                )}
                <div
                  className={`w-full max-w-[24px] rounded-sm transition-all ${
                    isCurrent 
                      ? "bg-neutral-900 dark:bg-white" 
                      : "bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600"
                  }`}
                  style={{ height: `${Math.max(height, 4)}%` }}
                  title={`${item.month}: ${formatCurrency(item.value)}`}
                />
              </div>
              <span className={`text-xs ${isCurrent ? "font-medium text-neutral-900 dark:text-white" : "text-neutral-400"}`}>
                {item.month.slice(0, 1)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Stage badge
function StageBadge({ stage }: { stage: string }) {
  const styles: Record<string, string> = {
    lead: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
    qualified: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
    proposal: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400",
    negotiation: "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400",
    "closed-won": "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
    "closed-lost": "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400",
  };
  
  return (
    <span className={`text-xs px-2 py-0.5 rounded capitalize ${styles[stage] || styles.lead}`}>
      {stage.replace("-", " ")}
    </span>
  );
}

// Recent Deals List
function RecentDeals({ deals, loading }: { deals: RecentDeal[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="p-6 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
        <div className="animate-pulse space-y-4">
          <div className="h-5 w-32 bg-neutral-200 dark:bg-neutral-800 rounded" />
          {[1,2,3,4].map(i => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-neutral-200 dark:bg-neutral-800" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-neutral-200 dark:bg-neutral-800 rounded" />
                <div className="h-3 w-20 bg-neutral-200 dark:bg-neutral-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-neutral-900 dark:text-white">Recent Deals</h3>
        <Link href="/dashboard/deals" className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1">
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      
      {deals.length > 0 ? (
        <div className="space-y-3">
          {deals.slice(0, 5).map((deal) => (
            <div key={deal.id || deal._id} className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-sm font-medium text-neutral-600 dark:text-neutral-400 flex-shrink-0">
                  {deal.title.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">{deal.title}</p>
                  <p className="text-xs text-neutral-500 truncate">{deal.customer?.name || "No customer"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <StageBadge stage={deal.stage} />
                <span className="text-sm font-medium text-neutral-900 dark:text-white">
                  {formatCurrency(deal.value)}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center">
          <Briefcase className="w-8 h-8 mx-auto text-neutral-300 dark:text-neutral-700 mb-2" />
          <p className="text-sm text-neutral-500">No deals yet</p>
          <Link href="/dashboard/deals" className="text-sm text-neutral-900 dark:text-white hover:underline mt-1 inline-block">
            Create your first deal
          </Link>
        </div>
      )}
    </div>
  );
}

// Recent Tasks List  
function RecentTasks({ tasks, loading }: { tasks: RecentTask[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="p-6 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
        <div className="animate-pulse space-y-4">
          <div className="h-5 w-32 bg-neutral-200 dark:bg-neutral-800 rounded" />
          {[1,2,3,4].map(i => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-4 h-4 rounded bg-neutral-200 dark:bg-neutral-800" />
              <div className="flex-1 h-4 bg-neutral-200 dark:bg-neutral-800 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const priorityColors: Record<string, string> = {
    high: "text-red-500",
    medium: "text-amber-500", 
    low: "text-neutral-400",
  };

  return (
    <div className="p-6 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-neutral-900 dark:text-white">Pending Tasks</h3>
        <Link href="/dashboard/tasks" className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1">
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      
      {tasks.length > 0 ? (
        <div className="space-y-2">
          {tasks.filter(t => t.status !== 'completed').slice(0, 5).map((task) => (
            <div key={task.id || task._id} className="flex items-start gap-3 py-2">
              <div className={`w-1.5 h-1.5 rounded-full mt-2 ${priorityColors[task.priority] || priorityColors.low}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-neutral-900 dark:text-white truncate">{task.title}</p>
                <p className="text-xs text-neutral-500">
                  {task.dueDate ? formatRelativeTime(task.dueDate) : "No due date"}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center">
          <CheckSquare className="w-8 h-8 mx-auto text-neutral-300 dark:text-neutral-700 mb-2" />
          <p className="text-sm text-neutral-500">No pending tasks</p>
          <Link href="/dashboard/tasks" className="text-sm text-neutral-900 dark:text-white hover:underline mt-1 inline-block">
            Create a task
          </Link>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [recentDeals, setRecentDeals] = useState<RecentDeal[]>([]);
  const [recentTasks, setRecentTasks] = useState<RecentTask[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const token = await getToken();
      const headers = { Authorization: `Bearer ${token}` };
      
      const [statsRes, dealsRes, tasksRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/stats`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/deals`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks`, { headers }),
      ]);
      
      const [statsData, dealsData, tasksData] = await Promise.all([
        statsRes.json(),
        dealsRes.json(),
        tasksRes.json(),
      ]);
      
      if (statsData.success) {
        setStats(statsData.data.summary);
        setMonthlyData(statsData.data.monthlyData || []);
      }
      
      if (dealsData.success) {
        setRecentDeals(dealsData.data || []);
      }
      
      if (tasksData.success) {
        setRecentTasks(tasksData.data || []);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const firstName = user?.firstName || "there";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">
            Welcome back, {firstName}
          </h1>
          <p className="text-neutral-500 mt-1">Here's what's happening with your business today.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/deals"
            className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-medium rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Deal
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Revenue"
          value={formatCurrency(stats?.wonValue || 0)}
          change={stats?.earningsChangePercent}
          changeType={
            stats?.earningsChangePercent && stats.earningsChangePercent > 0 ? "up" : 
            stats?.earningsChangePercent && stats.earningsChangePercent < 0 ? "down" : 
            "neutral"
          }
          icon={DollarSign}
        />
        <StatCard
          label="Pipeline Value"
          value={formatCurrency(stats?.totalDealValue || 0)}
          change={stats?.pipelineChangePercent}
          changeType={
            stats?.pipelineChangePercent && stats.pipelineChangePercent > 0 ? "up" : 
            stats?.pipelineChangePercent && stats.pipelineChangePercent < 0 ? "down" : 
            "neutral"
          }
          icon={Briefcase}
        />
        <StatCard
          label="Total Customers"
          value={stats?.totalCustomers || 0}
          change={stats?.customersChangePercent}
          changeType={
            stats?.customersChangePercent && stats.customersChangePercent > 0 ? "up" : 
            stats?.customersChangePercent && stats.customersChangePercent < 0 ? "down" : 
            "neutral"
          }
          icon={Users}
        />
        <StatCard
          label="Pending Tasks"
          value={stats?.pendingTasks || 0}
          icon={CheckSquare}
        />
      </div>

      {/* Charts & Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MonthlyChart data={monthlyData} loading={loading} />
        </div>
        <div>
          <RecentTasks tasks={recentTasks} loading={loading} />
        </div>
      </div>

      {/* Recent Deals */}
      <RecentDeals deals={recentDeals} loading={loading} />
    </div>
  );
}
