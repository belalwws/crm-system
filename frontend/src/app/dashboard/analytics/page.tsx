"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Briefcase,
  CheckSquare,
  Calendar,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Target,
} from "lucide-react";
import { Card, CardHeader, StatCard, Badge, Progress, CircularProgress, PageLoading } from "@/components/ui";
import { BarChart, DonutChart, AreaChartComponent, LineChartComponent } from "@/components/ui/charts";
import { formatCurrency } from "@/lib/hooks";

interface AnalyticsData {
  totalCustomers: number;
  activeCustomers: number;
  totalDeals: number;
  wonDeals: number;
  lostDeals: number;
  totalPipeline: number;
  wonValue: number;
  lostValue: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  dealsByStage: { stage: string; count: number; value: number }[];
  revenueByMonth: { month: string; value: number }[];
  tasksByType: { type: string; count: number }[];
}

export default function AnalyticsPage() {
  const { getToken } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("month");

  const fetchAnalytics = useCallback(async () => {
    try {
      const token = await getToken();
      // Fetch dashboard stats which contains most of the analytics data
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/dashboard/stats`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const result = await response.json();
      
      if (result.success) {
        const summary = result.data.summary;
        const dealsByStage = result.data.dealsByStage || [];
        const monthlyData = result.data.monthlyData || [];
        
        // Build revenue by month from monthlyData
        const revenueByMonth = monthlyData.map((m: any) => ({
          month: m.month,
          value: m.value || 0,
        }));

        // Build tasks by type from separate API call
        let tasksByType: { type: string; count: number }[] = [];
        try {
          const tasksRes = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/tasks`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const tasksData = await tasksRes.json();
          if (tasksData.success && Array.isArray(tasksData.data)) {
            const typeCounts: Record<string, number> = {};
            tasksData.data.forEach((t: any) => {
              const type = t.type || 'other';
              typeCounts[type] = (typeCounts[type] || 0) + 1;
            });
            tasksByType = Object.entries(typeCounts).map(([type, count]) => ({ type, count }));
          }
        } catch {}
        
        setData({
          totalCustomers: summary.totalCustomers || 0,
          activeCustomers: summary.activeCustomers || 0,
          totalDeals: summary.totalDeals || 0,
          wonDeals: summary.wonDeals || 0,
          lostDeals: dealsByStage.find((s: any) => s._id === "closed-lost")?.count || 0,
          totalPipeline: summary.totalDealValue || 0,
          wonValue: summary.wonValue || 0,
          lostValue: dealsByStage.find((s: any) => s._id === "closed-lost")?.value || 0,
          totalTasks: summary.totalTasks || 0,
          completedTasks: (summary.totalTasks || 0) - (summary.pendingTasks || 0),
          pendingTasks: summary.pendingTasks || 0,
          dealsByStage: dealsByStage.map((s: any) => ({
            stage: s._id,
            count: s.count,
            value: s.value,
          })),
          revenueByMonth,
          tasksByType,
        });
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) {
    return <PageLoading />;
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-neutral-500">
        Failed to load analytics data
      </div>
    );
  }

  const winRate = data.totalDeals > 0 ? Math.round((data.wonDeals / data.totalDeals) * 100) : 0;
  const conversionRate = data.totalCustomers > 0 
    ? Math.round((data.activeCustomers / data.totalCustomers) * 100) 
    : 0;
  const taskCompletionRate = data.totalTasks > 0 
    ? Math.round((data.completedTasks / data.totalTasks) * 100) 
    : 0;
  const avgDealValue = data.totalDeals > 0 
    ? Math.round(data.totalPipeline / data.totalDeals) 
    : 0;

  const stageColors: Record<string, string> = {
    lead: "bg-neutral-500",
    qualified: "bg-blue-500",
    proposal: "bg-amber-500",
    negotiation: "bg-orange-500",
    "closed-won": "bg-emerald-500",
    "closed-lost": "bg-red-500",
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Analytics</h1>
          <p className="text-neutral-500 mt-1">Track your business performance and growth</p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-4 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-500 transition-colors"
        >
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="quarter">This Quarter</option>
          <option value="year">This Year</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="animate-slide-up stagger-1">
          <StatCard
            title="Total Revenue"
            value={formatCurrency(data.wonValue)}
            change={{ value: 15, type: "increase" }}
            icon={<DollarSign className="w-5 h-5 text-white" />}
            iconBg="bg-emerald-600"
          />
        </div>
        <div className="animate-slide-up stagger-2">
          <StatCard
            title="Win Rate"
            value={`${winRate}%`}
            change={{ value: 5, type: "increase" }}
            icon={<Target className="w-5 h-5 text-white" />}
            iconBg="bg-blue-600"
          />
        </div>
        <div className="animate-slide-up stagger-3">
          <StatCard
            title="Avg Deal Size"
            value={formatCurrency(avgDealValue)}
            icon={<Briefcase className="w-5 h-5 text-white" />}
            iconBg="bg-violet-600"
          />
        </div>
        <div className="animate-slide-up stagger-4">
          <StatCard
            title="Active Pipeline"
            value={formatCurrency(data.totalPipeline - data.wonValue - data.lostValue)}
            icon={<TrendingUp className="w-5 h-5 text-white" />}
            iconBg="bg-amber-600"
          />
        </div>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up">
        {/* Win/Loss Analysis */}
        <Card>
          <CardHeader
            title="Deal Performance"
            subtitle="Won vs Lost deals"
            icon={<BarChart3 className="w-4 h-4 text-blue-400" />}
            iconBg="bg-blue-500/20"
          />
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                <span className="text-neutral-500 dark:text-neutral-400">Won</span>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-neutral-900 dark:text-white">{data.wonDeals}</p>
                <p className="text-sm text-emerald-400">{formatCurrency(data.wonValue)}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-red-500 rounded-full" />
                <span className="text-neutral-500 dark:text-neutral-400">Lost</span>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-neutral-900 dark:text-white">{data.lostDeals}</p>
                <p className="text-sm text-red-400">{formatCurrency(data.lostValue)}</p>
              </div>
            </div>
            <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-neutral-500">Win Rate</span>
                <span className="text-sm font-medium text-neutral-900 dark:text-white">{winRate}%</span>
              </div>
              <Progress value={winRate} color="green" />
            </div>
          </div>
        </Card>

        {/* Customer Metrics */}
        <Card>
          <CardHeader
            title="Customer Insights"
            subtitle="Acquisition & engagement"
            icon={<Users className="w-4 h-4 text-emerald-400" />}
            iconBg="bg-emerald-500/20"
          />
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-neutral-100 dark:bg-neutral-800/50 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-neutral-900 dark:text-white">{data.totalCustomers}</p>
                <p className="text-sm text-neutral-500">Total</p>
              </div>
              <div className="bg-neutral-100 dark:bg-neutral-800/50 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-emerald-400">{data.activeCustomers}</p>
                <p className="text-sm text-neutral-500">Active</p>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-neutral-500">Conversion Rate</span>
                <span className="text-sm font-medium text-neutral-900 dark:text-white">{conversionRate}%</span>
              </div>
              <Progress value={conversionRate} color="blue" />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-500">Leads</span>
              <span className="text-neutral-900 dark:text-white font-medium">
                {data.totalCustomers - data.activeCustomers}
              </span>
            </div>
          </div>
        </Card>

        {/* Task Metrics */}
        <Card>
          <CardHeader
            title="Task Productivity"
            subtitle="Completion & efficiency"
            icon={<CheckSquare className="w-4 h-4 text-amber-400" />}
            iconBg="bg-amber-500/20"
          />
          <div className="space-y-6">
            <div className="flex items-center justify-center">
              <CircularProgress 
                value={taskCompletionRate} 
                size={100} 
                strokeWidth={8}
                color="#10b981" 
              />
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-xl font-bold text-neutral-900 dark:text-white">{data.totalTasks}</p>
                <p className="text-xs text-neutral-500">Total</p>
              </div>
              <div>
                <p className="text-xl font-bold text-emerald-400">{data.completedTasks}</p>
                <p className="text-xs text-neutral-500">Done</p>
              </div>
              <div>
                <p className="text-xl font-bold text-amber-400">{data.pendingTasks}</p>
                <p className="text-xs text-neutral-500">Pending</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Pipeline Analysis */}
      <Card className="animate-slide-up">
        <CardHeader
          title="Pipeline Analysis"
          subtitle="Deals by stage breakdown"
          icon={<PieChart className="w-4 h-4 text-violet-400" />}
          iconBg="bg-violet-500/20"
        />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Stage Distribution - Chart */}
          <div>
            {data.dealsByStage.length > 0 ? (
              <BarChart
                data={data.dealsByStage.map(s => ({
                  name: s.stage.replace('-', ' '),
                  value: s.value,
                  count: s.count,
                }))}
                dataKey="value"
                xKey="name"
                height={250}
                color="#8b5cf6"
                formatter={(v: number) => formatCurrency(v)}
              />
            ) : (
              <div className="text-center py-12 text-neutral-500">No deals data available</div>
            )}
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-neutral-100 dark:bg-neutral-800/50 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="text-sm text-neutral-500 dark:text-neutral-400">Best Stage</span>
              </div>
              <p className="text-lg font-semibold text-neutral-900 dark:text-white capitalize">
                {data.dealsByStage.length > 0 
                  ? data.dealsByStage.reduce((a, b) => a.value > b.value ? a : b).stage.replace("-", " ")
                  : "N/A"}
              </p>
            </div>
            <div className="bg-neutral-100 dark:bg-neutral-800/50 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Briefcase className="w-4 h-4 text-blue-400" />
                </div>
                <span className="text-sm text-neutral-500 dark:text-neutral-400">Total Deals</span>
              </div>
              <p className="text-lg font-semibold text-neutral-900 dark:text-white">{data.totalDeals}</p>
            </div>
            <div className="bg-neutral-100 dark:bg-neutral-800/50 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-violet-500/20 rounded-lg">
                  <DollarSign className="w-4 h-4 text-violet-400" />
                </div>
                <span className="text-sm text-neutral-500 dark:text-neutral-400">Pipeline Value</span>
              </div>
              <p className="text-lg font-semibold text-neutral-900 dark:text-white">{formatCurrency(data.totalPipeline)}</p>
            </div>
            <div className="bg-neutral-100 dark:bg-neutral-800/50 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-amber-500/20 rounded-lg">
                  <Target className="w-4 h-4 text-amber-400" />
                </div>
                <span className="text-sm text-neutral-500 dark:text-neutral-400">Avg. Deal</span>
              </div>
              <p className="text-lg font-semibold text-neutral-900 dark:text-white">{formatCurrency(avgDealValue)}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Revenue & Tasks Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up">
        <Card>
          <CardHeader
            title="Revenue Trend"
            subtitle="Monthly revenue overview"
            icon={<TrendingUp className="w-4 h-4 text-emerald-400" />}
            iconBg="bg-emerald-500/20"
          />
          {data.revenueByMonth.length > 0 ? (
            <AreaChartComponent
              data={data.revenueByMonth.map(r => ({ name: r.month.slice(0, 3), value: r.value }))}
              dataKey="value"
              xKey="name"
              height={250}
              color="#10b981"
              formatter={(v: number) => formatCurrency(v)}
            />
          ) : (
            <div className="text-center py-12 text-neutral-500">No revenue data yet</div>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Tasks by Type"
            subtitle="Distribution of task types"
            icon={<CheckSquare className="w-4 h-4 text-amber-400" />}
            iconBg="bg-amber-500/20"
          />
          {data.tasksByType.length > 0 ? (
            <DonutChart
              data={data.tasksByType.map(t => ({ name: t.type, value: t.count }))}
              height={250}
            />
          ) : (
            <div className="text-center py-12 text-neutral-500">No tasks data yet</div>
          )}
        </Card>
      </div>

      {/* Tips Card */}
      <Card className="animate-slide-up bg-gradient-to-br from-blue-500/10 to-violet-500/10 border-blue-500/20">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-500/20 rounded-xl">
            <TrendingUp className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">Performance Tips</h3>
            <ul className="space-y-2 text-sm text-neutral-500 dark:text-neutral-400">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                Focus on deals in the &quot;Negotiation&quot; stage for quick wins
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                Your win rate of {winRate}% is {winRate >= 30 ? "above" : "below"} industry average
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                Complete your {data.pendingTasks} pending tasks to improve productivity
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
