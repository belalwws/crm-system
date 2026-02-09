"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  TrendingUp,
  DollarSign,
  Target,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Activity,
  Calendar,
  Users,
  Briefcase,
  RefreshCw,
} from "lucide-react";
import { Card, CardHeader, StatCard, Badge, Progress, PageLoading } from "@/components/ui";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/hooks";

interface FunnelStage {
  stage: string;
  count: number;
  value: number;
  conversionRate: number;
}

interface AgingDeal {
  id: string;
  title: string;
  stage: string;
  value: number;
  daysOpen: number;
  daysSinceUpdate: number;
  isStale: boolean;
  riskLevel: string;
  customer: { name: string };
}

interface ForecastMonth {
  month: string;
  weighted: number;
  unweighted: number;
  count: number;
}

interface PerformanceMetrics {
  dealsCreated: number;
  dealsWon: number;
  dealsLost: number;
  winRate: number;
  revenue: number;
  avgDealSize: number;
  tasksCreated: number;
  tasksCompleted: number;
  taskCompletionRate: number;
  customersCreated: number;
  emailsSent: number;
}

export default function ReportsPage() {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"funnel" | "aging" | "forecast" | "performance">("funnel");
  const [funnel, setFunnel] = useState<FunnelStage[]>([]);
  const [aging, setAging] = useState<{ deals: AgingDeal[]; summary: any }>({ deals: [], summary: {} });
  const [forecast, setForecast] = useState<{ months: ForecastMonth[]; totalWeighted: number; totalUnweighted: number; wonThisQuarter: number }>({ months: [], totalWeighted: 0, totalUnweighted: 0, wonThisQuarter: 0 });
  const [performance, setPerformance] = useState<PerformanceMetrics | null>(null);
  const [days, setDays] = useState(30);

  const initApi = useCallback(async () => {
    const token = await getToken();
    if (token) api.setToken(token);
    return token;
  }, [getToken]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = await initApi();
      if (!token) return;

      if (activeTab === "funnel") {
        const res = await api.getConversionFunnel();
        setFunnel((res.data as FunnelStage[]) || []);
      } else if (activeTab === "aging") {
        const res = await api.getDealAging();
        setAging((res.data as any) || { deals: [], summary: {} });
      } else if (activeTab === "forecast") {
        const res = await api.getRevenueForecast();
        setForecast((res.data as any) || { months: [], totalWeighted: 0, totalUnweighted: 0, wonThisQuarter: 0 });
      } else if (activeTab === "performance") {
        const res = await api.getPerformanceMetrics(days);
        setPerformance((res.data as PerformanceMetrics) || null);
      }
    } catch (err) {
      console.error("Failed to fetch report data:", err);
    } finally {
      setLoading(false);
    }
  }, [initApi, activeTab, days]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const tabs = [
    { id: "funnel" as const, label: "Conversion Funnel", icon: Target },
    { id: "aging" as const, label: "Deal Aging", icon: Clock },
    { id: "forecast" as const, label: "Revenue Forecast", icon: TrendingUp },
    { id: "performance" as const, label: "Performance", icon: Activity },
  ];

  const riskColor = (level: string) => {
    switch (level) {
      case "high": return "text-red-600 bg-red-50 dark:bg-red-900/20";
      case "medium": return "text-amber-600 bg-amber-50 dark:bg-amber-900/20";
      default: return "text-green-600 bg-green-50 dark:bg-green-900/20";
    }
  };

  const maxFunnelCount = Math.max(...funnel.map(f => f.count), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Reports</h1>
          <p className="text-sm text-neutral-500 mt-1">Insights and analytics for your pipeline</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-neutral-100 dark:bg-neutral-800 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-colors ${
              activeTab === tab.id
                ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm font-medium"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <PageLoading />
      ) : (
        <>
          {/* Conversion Funnel */}
          {activeTab === "funnel" && (
            <div className="space-y-4">
              <Card>
                <CardHeader title="Deal Conversion Funnel" subtitle="How deals progress through stages" />
                <div className="p-6 space-y-4">
                  {funnel.length === 0 ? (
                    <p className="text-sm text-neutral-500 text-center py-8">No deal data available</p>
                  ) : (
                    funnel.map((stage, i) => (
                      <div key={stage.stage} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-neutral-900 dark:text-white w-32">
                              {stage.stage.replace(/_/g, " ")}
                            </span>
                            <span className="text-sm text-neutral-500">{stage.count} deals</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                              {formatCurrency(stage.value)}
                            </span>
                            {i > 0 && (
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                stage.conversionRate >= 50
                                  ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                                  : stage.conversionRate >= 25
                                  ? "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
                                  : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                              }`}>
                                {stage.conversionRate.toFixed(1)}% conversion
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-8 relative overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500 flex items-center justify-end pr-3"
                            style={{ width: `${Math.max((stage.count / maxFunnelCount) * 100, 8)}%` }}
                          >
                            <span className="text-xs font-medium text-white">{stage.count}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* Deal Aging */}
          {activeTab === "aging" && (
            <div className="space-y-4">
              {/* Summary cards */}
              {aging.summary && Object.keys(aging.summary).length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(aging.summary).map(([stage, data]: [string, any]) => (
                    <Card key={stage}>
                      <div className="p-4">
                        <p className="text-xs text-neutral-500 uppercase tracking-wider">{stage.replace(/_/g, " ")}</p>
                        <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">{data.count} deals</p>
                        <p className="text-sm text-neutral-500 mt-1">Avg {data.avgDays} days open</p>
                        <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                          {formatCurrency(data.totalValue)}
                        </p>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {/* Aging deals table */}
              <Card>
                <CardHeader title="Open Deal Aging" subtitle="Deals ranked by time in pipeline" />
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-neutral-200 dark:border-neutral-700">
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Deal</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Customer</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Stage</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Value</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Days Open</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Risk</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                      {aging.deals.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center text-sm text-neutral-500">
                            No open deals found
                          </td>
                        </tr>
                      ) : (
                        aging.deals.map((deal) => (
                          <tr key={deal.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                            <td className="px-6 py-4">
                              <p className="text-sm font-medium text-neutral-900 dark:text-white">{deal.title}</p>
                            </td>
                            <td className="px-6 py-4 text-sm text-neutral-600 dark:text-neutral-400">
                              {deal.customer?.name || "—"}
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                                {deal.stage.replace(/_/g, " ")}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                              {formatCurrency(deal.value)}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-neutral-900 dark:text-white">{deal.daysOpen}d</span>
                                {deal.isStale && (
                                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${riskColor(deal.riskLevel)}`}>
                                {deal.riskLevel}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* Revenue Forecast */}
          {activeTab === "forecast" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                  title="Weighted Pipeline"
                  value={formatCurrency(forecast.totalWeighted)}
                  icon={<TrendingUp className="w-5 h-5" />}
                  iconBg="bg-indigo-100 dark:bg-indigo-900/30"
                />
                <StatCard
                  title="Unweighted Pipeline"
                  value={formatCurrency(forecast.totalUnweighted)}
                  icon={<DollarSign className="w-5 h-5" />}
                  iconBg="bg-green-100 dark:bg-green-900/30"
                />
                <StatCard
                  title="Won This Quarter"
                  value={formatCurrency(forecast.wonThisQuarter)}
                  icon={<CheckCircle2 className="w-5 h-5" />}
                  iconBg="bg-emerald-100 dark:bg-emerald-900/30"
                />
              </div>

              <Card>
                <CardHeader title="Monthly Forecast" subtitle="Projected revenue by expected close date" />
                <div className="p-6 space-y-4">
                  {forecast.months.length === 0 ? (
                    <p className="text-sm text-neutral-500 text-center py-8">No forecast data available</p>
                  ) : (
                    forecast.months.map((month) => {
                      const maxVal = Math.max(...forecast.months.map(m => m.unweighted), 1);
                      return (
                        <div key={month.month} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-neutral-900 dark:text-white">
                              {month.month}
                            </span>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-neutral-500">{month.count} deals</span>
                              <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                                {formatCurrency(month.weighted)} weighted
                              </span>
                              <span className="text-neutral-700 dark:text-neutral-300">
                                {formatCurrency(month.unweighted)} total
                              </span>
                            </div>
                          </div>
                          <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-4 relative overflow-hidden">
                            <div
                              className="absolute h-full bg-neutral-300 dark:bg-neutral-600 rounded-full"
                              style={{ width: `${(month.unweighted / maxVal) * 100}%` }}
                            />
                            <div
                              className="absolute h-full bg-indigo-500 rounded-full"
                              style={{ width: `${(month.weighted / maxVal) * 100}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* Performance Metrics */}
          {activeTab === "performance" && performance && (
            <div className="space-y-4">
              {/* Period selector */}
              <div className="flex gap-2">
                {[7, 14, 30, 60, 90].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDays(d)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      days === d
                        ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-medium"
                        : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                    }`}
                  >
                    {d}d
                  </button>
                ))}
              </div>

              {/* Metrics grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Win Rate"
                  value={`${performance.winRate.toFixed(1)}%`}
                  icon={<Target className="w-5 h-5" />}
                  iconBg="bg-blue-100 dark:bg-blue-900/30"
                />
                <StatCard
                  title="Revenue"
                  value={formatCurrency(performance.revenue)}
                  icon={<DollarSign className="w-5 h-5" />}
                  iconBg="bg-green-100 dark:bg-green-900/30"
                />
                <StatCard
                  title="Deals Created"
                  value={String(performance.dealsCreated)}
                  icon={<Briefcase className="w-5 h-5" />}
                  iconBg="bg-purple-100 dark:bg-purple-900/30"
                />
                <StatCard
                  title="Task Completion"
                  value={`${performance.taskCompletionRate.toFixed(0)}%`}
                  icon={<CheckCircle2 className="w-5 h-5" />}
                  iconBg="bg-amber-100 dark:bg-amber-900/30"
                />
              </div>

              {/* Detailed breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader title="Deals" subtitle={`Last ${days} days`} />
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">Created</span>
                      <span className="text-sm font-medium text-neutral-900 dark:text-white">{performance.dealsCreated}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">Won</span>
                      <span className="text-sm font-medium text-green-600">{performance.dealsWon}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">Lost</span>
                      <span className="text-sm font-medium text-red-600">{performance.dealsLost}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">Win Rate</span>
                      <span className="text-sm font-bold text-neutral-900 dark:text-white">{performance.winRate.toFixed(1)}%</span>
                    </div>
                  </div>
                </Card>

                <Card>
                  <CardHeader title="Activity" subtitle={`Last ${days} days`} />
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">Tasks Created</span>
                      <span className="text-sm font-medium text-neutral-900 dark:text-white">{performance.tasksCreated}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">Tasks Completed</span>
                      <span className="text-sm font-medium text-green-600">{performance.tasksCompleted}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">Customers Added</span>
                      <span className="text-sm font-medium text-neutral-900 dark:text-white">{performance.customersCreated}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">Emails Sent</span>
                      <span className="text-sm font-medium text-neutral-900 dark:text-white">{performance.emailsSent}</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
