"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import {
  Users,
  Briefcase,
  CheckSquare,
  DollarSign,
  TrendingUp,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Target,
  Activity,
  Zap,
  ChevronRight,
  BarChart3,
  PieChart,
  Plus,
} from "lucide-react";
import { StatCard, Card, CardHeader, Badge, StatusBadge, Progress, CircularProgress, PageLoading, StatCardSkeleton } from "@/components/ui";
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
}

interface DealByStage {
  _id: string;
  count: number;
  value: number;
}

interface RecentTask {
  id: string;
  _id: string;
  title: string;
  status: string;
  priority: string;
  type: string;
  dueDate?: string;
  customer?: { id: string; name: string };
}

const stageColors: Record<string, { bg: string; bar: string }> = {
  lead: { bg: "bg-neutral-500/20", bar: "bg-neutral-500" },
  qualified: { bg: "bg-blue-500/20", bar: "bg-blue-500" },
  proposal: { bg: "bg-amber-500/20", bar: "bg-amber-500" },
  negotiation: { bg: "bg-orange-500/20", bar: "bg-orange-500" },
  "closed-won": { bg: "bg-emerald-500/20", bar: "bg-emerald-500" },
  "closed-lost": { bg: "bg-red-500/20", bar: "bg-red-500" },
};

// Quick action card component
function QuickAction({ 
  icon: Icon, 
  title, 
  description, 
  href,
  color 
}: { 
  icon: any; 
  title: string; 
  description: string;
  href: string;
  color: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 p-4 bg-neutral-800/50 hover:bg-neutral-800 rounded-xl border border-neutral-800 hover:border-neutral-700 transition-all"
    >
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1">
        <h3 className="font-medium text-white group-hover:text-white transition-colors">{title}</h3>
        <p className="text-sm text-neutral-500">{description}</p>
      </div>
      <ChevronRight className="w-5 h-5 text-neutral-600 group-hover:text-neutral-400 group-hover:translate-x-1 transition-all" />
    </Link>
  );
}

// Pipeline visualization component
function PipelineChart({ stages, totalValue }: { stages: DealByStage[]; totalValue: number }) {
  const maxValue = Math.max(...stages.map(s => s.value), 1);
  
  return (
    <div className="space-y-4">
      {stages.map((stage, index) => {
        const percentage = totalValue > 0 ? (stage.value / totalValue) * 100 : 0;
        const colors = stageColors[stage._id] || stageColors.lead;
        
        return (
          <div key={stage._id} className="group animate-slide-up" style={{ animationDelay: `${index * 0.05}s` }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${colors.bar}`} />
                <span className="text-sm font-medium text-neutral-300 capitalize">
                  {stage._id.replace("-", " ")}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="neutral" size="sm">{stage.count} deals</Badge>
                <span className="text-sm font-semibold text-white">
                  {formatCurrency(stage.value)}
                </span>
              </div>
            </div>
            <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className={`h-full ${colors.bar} rounded-full transition-all duration-700 ease-out`}
                style={{ width: `${(stage.value / maxValue) * 100}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Activity item component
function ActivityItem({ task }: { task: RecentTask }) {
  const priorityColors = {
    high: "text-red-400",
    medium: "text-amber-400",
    low: "text-neutral-400",
  };

  return (
    <div className="flex items-start gap-4 p-3 hover:bg-neutral-800/50 rounded-xl transition-colors">
      <div className={`p-2 rounded-lg ${
        task.status === 'completed' ? 'bg-emerald-500/20' : 'bg-neutral-800'
      }`}>
        <CheckSquare className={`w-4 h-4 ${
          task.status === 'completed' ? 'text-emerald-400' : 'text-neutral-400'
        }`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${
          task.status === 'completed' ? 'text-neutral-500 line-through' : 'text-white'
        }`}>
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-xs ${priorityColors[task.priority as keyof typeof priorityColors] || 'text-neutral-500'}`}>
            {task.priority}
          </span>
          {task.customer && (
            <>
              <span className="text-neutral-600">•</span>
              <span className="text-xs text-neutral-500">{task.customer.name}</span>
            </>
          )}
          {task.dueDate && (
            <>
              <span className="text-neutral-600">•</span>
              <span className="text-xs text-neutral-500">
                {formatRelativeTime(task.dueDate)}
              </span>
            </>
          )}
        </div>
      </div>
      <StatusBadge status={task.status} size="sm" />
    </div>
  );
}

export default function DashboardPage() {
  const { getToken } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [dealsByStage, setDealsByStage] = useState<DealByStage[]>([]);
  const [recentTasks, setRecentTasks] = useState<RecentTask[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const token = await getToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/dashboard/stats`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        setStats(data.data.summary);
        setDealsByStage(data.data.dealsByStage || []);
        setRecentTasks(data.data.recentTasks || []);
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div>
          <div className="h-8 w-48 bg-neutral-800 rounded-lg animate-pulse mb-2" />
          <div className="h-4 w-64 bg-neutral-800 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  const winRate = stats?.totalDeals ? Math.round((stats.wonDeals / stats.totalDeals) * 100) : 0;
  const customerGrowth = 12; // This would come from API in real scenario
  const taskCompletion = stats?.totalTasks ? Math.round(((stats.totalTasks - stats.pendingTasks) / stats.totalTasks) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-neutral-500 mt-1">Welcome back! Here's your business overview.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/customers"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-neutral-800 text-white font-medium rounded-xl hover:bg-neutral-700 border border-neutral-700 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Customer</span>
          </Link>
          <Link
            href="/dashboard/deals"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-neutral-900 font-medium rounded-xl hover:bg-neutral-200 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Deal</span>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="animate-slide-up stagger-1">
          <StatCard
            title="Total Customers"
            value={stats?.totalCustomers || 0}
            change={{ value: customerGrowth, type: "increase" }}
            icon={<Users className="w-5 h-5 text-white" />}
            iconBg="bg-blue-600"
          />
        </div>
        <div className="animate-slide-up stagger-2">
          <StatCard
            title="Active Deals"
            value={stats?.totalDeals || 0}
            icon={<Briefcase className="w-5 h-5 text-white" />}
            iconBg="bg-emerald-600"
          />
        </div>
        <div className="animate-slide-up stagger-3">
          <StatCard
            title="Pending Tasks"
            value={stats?.pendingTasks || 0}
            icon={<CheckSquare className="w-5 h-5 text-white" />}
            iconBg="bg-amber-600"
          />
        </div>
        <div className="animate-slide-up stagger-4">
          <StatCard
            title="Total Pipeline"
            value={formatCurrency(stats?.totalDealValue || 0)}
            icon={<DollarSign className="w-5 h-5 text-white" />}
            iconBg="bg-violet-600"
          />
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline Overview - Takes 2 columns */}
        <div className="lg:col-span-2 animate-slide-up stagger-3">
          <Card>
            <CardHeader
              title="Sales Pipeline"
              subtitle="Deal distribution by stage"
              icon={<BarChart3 className="w-4 h-4 text-blue-400" />}
              iconBg="bg-blue-500/20"
              action={
                <Link href="/dashboard/deals" className="text-sm text-neutral-400 hover:text-white flex items-center gap-1 transition-colors">
                  View all <ChevronRight className="w-4 h-4" />
                </Link>
              }
            />
            {dealsByStage.length > 0 ? (
              <PipelineChart stages={dealsByStage} totalValue={stats?.totalDealValue || 0} />
            ) : (
              <div className="text-center py-8 text-neutral-500">
                <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No deals yet. Start building your pipeline!</p>
                <Link href="/dashboard/deals" className="text-blue-400 hover:text-blue-300 text-sm mt-2 inline-block">
                  Create your first deal →
                </Link>
              </div>
            )}
          </Card>
        </div>

        {/* Performance Metrics */}
        <div className="animate-slide-up stagger-4">
          <Card>
            <CardHeader
              title="Performance"
              subtitle="Key metrics this month"
              icon={<Target className="w-4 h-4 text-emerald-400" />}
              iconBg="bg-emerald-500/20"
            />
            <div className="space-y-6">
              {/* Win Rate */}
              <div className="flex items-center gap-4">
                <CircularProgress value={winRate} size={56} color="#10b981" />
                <div>
                  <p className="text-sm text-neutral-500">Win Rate</p>
                  <p className="text-xl font-bold text-white">{winRate}%</p>
                </div>
              </div>
              
              {/* Task Completion */}
              <div className="flex items-center gap-4">
                <CircularProgress value={taskCompletion} size={56} color="#3b82f6" />
                <div>
                  <p className="text-sm text-neutral-500">Tasks Completed</p>
                  <p className="text-xl font-bold text-white">{taskCompletion}%</p>
                </div>
              </div>

              {/* Revenue Won */}
              <div className="pt-4 border-t border-neutral-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-neutral-500">Revenue Won</span>
                  <span className="text-sm font-medium text-emerald-400 flex items-center gap-1">
                    <ArrowUpRight className="w-3 h-3" />
                    {stats?.wonDeals || 0} deals
                  </span>
                </div>
                <p className="text-2xl font-bold text-white">{formatCurrency(stats?.wonValue || 0)}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="animate-slide-up stagger-5">
          <Card padding="none">
            <div className="p-6 pb-0">
              <CardHeader
                title="Recent Tasks"
                subtitle="Your latest activities"
                icon={<Activity className="w-4 h-4 text-amber-400" />}
                iconBg="bg-amber-500/20"
                action={
                  <Link href="/dashboard/tasks" className="text-sm text-neutral-400 hover:text-white flex items-center gap-1 transition-colors">
                    View all <ChevronRight className="w-4 h-4" />
                  </Link>
                }
              />
            </div>
            <div className="px-3 pb-3">
              {recentTasks.length > 0 ? (
                <div className="space-y-1">
                  {recentTasks.slice(0, 5).map((task) => (
                    <ActivityItem key={task.id || task._id} task={task} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-neutral-500">
                  <CheckSquare className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No recent tasks</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="animate-slide-up stagger-6">
          <Card>
            <CardHeader
              title="Quick Actions"
              subtitle="Common tasks and shortcuts"
              icon={<Zap className="w-4 h-4 text-violet-400" />}
              iconBg="bg-violet-500/20"
            />
            <div className="space-y-3">
              <QuickAction
                icon={Users}
                title="Add New Customer"
                description="Create a new customer profile"
                href="/dashboard/customers"
                color="bg-blue-600"
              />
              <QuickAction
                icon={Briefcase}
                title="Create Deal"
                description="Start tracking a new opportunity"
                href="/dashboard/deals"
                color="bg-emerald-600"
              />
              <QuickAction
                icon={CheckSquare}
                title="Add Task"
                description="Schedule a follow-up or reminder"
                href="/dashboard/tasks"
                color="bg-amber-600"
              />
              <QuickAction
                icon={BarChart3}
                title="View Analytics"
                description="Analyze your sales performance"
                href="/dashboard/analytics"
                color="bg-violet-600"
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
