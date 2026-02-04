"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import Link from "next/link";
import {
  Briefcase,
  DollarSign,
  TrendingUp,
  Search,
  ChevronDown,
  MoreVertical,
  ArrowUpRight,
  ArrowDownRight,
  Users,
} from "lucide-react";
import { formatCurrency } from "@/lib/hooks";

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
  customer?: { id: string; name: string; company?: string };
}

// Stat Card with neutral theme
function StatCardNew({
  icon,
  iconBg,
  label,
  value,
  change,
  changeType,
  changeLabel,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
  change: string;
  changeType: "up" | "down" | "neutral";
  changeLabel: string;
}) {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        <div className={`w-14 h-14 ${iconBg} rounded-full flex items-center justify-center shadow-lg`}>
          {icon}
        </div>
        <div className="flex-1">
          <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium uppercase tracking-wide">{label}</p>
          <div className="flex items-baseline gap-3 mt-1">
            <span className="text-2xl font-bold text-neutral-900 dark:text-white">{value}</span>
          </div>
          <span className={`text-xs font-medium flex items-center gap-0.5 mt-1 ${
            changeType === "up" ? "text-emerald-600" : changeType === "down" ? "text-red-500" : "text-neutral-500"
          }`}>
            {changeType === "up" && <ArrowUpRight className="w-3 h-3" />}
            {changeType === "down" && <ArrowDownRight className="w-3 h-3" />}
            {change} {changeLabel}
          </span>
        </div>
      </div>
    </div>
  );
}

// Bar Chart Component with neutral theme
function OverviewChart({ data, loading }: { data: MonthlyData[]; loading: boolean }) {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const currentMonth = new Date().toLocaleString('en-US', { month: 'short' });
  
  if (loading) {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm h-full">
        <div className="animate-pulse">
          <div className="h-6 w-32 bg-neutral-200 dark:bg-neutral-800 rounded mb-2" />
          <div className="h-4 w-24 bg-neutral-200 dark:bg-neutral-800 rounded mb-6" />
          <div className="flex items-end justify-between gap-2 h-48">
            {[1,2,3,4,5,6,7,8,9,10,11,12].map(i => (
              <div key={i} className="flex-1 bg-neutral-200 dark:bg-neutral-800 rounded-t-lg" style={{ height: `${Math.random() * 80 + 20}%` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Overview</h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Monthly Deal Value</p>
        </div>
        <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
          This Year
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>
      
      <div className="flex items-end justify-between gap-2 h-48">
        {data.map((item) => {
          const height = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
          const isCurrentMonth = item.month === currentMonth;
          const hasValue = item.value > 0;
          
          return (
            <div key={item.month} className="flex-1 flex flex-col items-center gap-2">
              <div className="relative w-full flex justify-center">
                {isCurrentMonth && hasValue && (
                  <div className="absolute -top-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-medium px-2 py-1 rounded-md whitespace-nowrap">
                    {formatCurrency(item.value)}
                  </div>
                )}
                <div
                  className={`w-6 sm:w-8 rounded-t-lg transition-all duration-500 ${
                    isCurrentMonth 
                      ? "bg-neutral-900 dark:bg-white" 
                      : hasValue 
                        ? "bg-neutral-300 dark:bg-neutral-700" 
                        : "bg-neutral-200 dark:bg-neutral-800"
                  }`}
                  style={{ height: `${Math.max(height, 8)}%`, minHeight: "8px" }}
                />
              </div>
              <span className={`text-xs ${
                isCurrentMonth 
                  ? "font-medium text-neutral-900 dark:text-white bg-neutral-200 dark:bg-neutral-800 px-1.5 py-0.5 rounded-md" 
                  : "text-neutral-500"
              }`}>
                {item.month}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Donut Chart Component with neutral theme
function CustomersDonutChart({ 
  newCustomersPercent, 
  totalCustomers, 
  activeCustomers,
  loading 
}: { 
  newCustomersPercent: number; 
  totalCustomers: number;
  activeCustomers: number;
  loading: boolean;
}) {
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (newCustomersPercent / 100) * circumference;
  
  if (loading) {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm h-full flex flex-col">
        <div className="animate-pulse">
          <div className="h-6 w-32 bg-neutral-200 dark:bg-neutral-800 rounded mb-2" />
          <div className="h-4 w-48 bg-neutral-200 dark:bg-neutral-800 rounded mb-6" />
          <div className="flex justify-center">
            <div className="w-44 h-44 rounded-full bg-neutral-200 dark:bg-neutral-800" />
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm h-full flex flex-col">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Customers</h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Active vs Total Customers</p>
      </div>
      
      <div className="flex-1 flex items-center justify-center">
        <div className="relative w-44 h-44">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="10"
              className="text-neutral-200 dark:text-neutral-800"
            />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="text-neutral-900 dark:text-white transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-neutral-900 dark:text-white">{activeCustomers}</span>
            <span className="text-xs text-neutral-500 text-center">Active<br/>Customers</span>
          </div>
        </div>
      </div>
      
      {/* Legend */}
      <div className="mt-4 flex justify-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-neutral-900 dark:bg-white" />
          <span className="text-xs text-neutral-600 dark:text-neutral-400">Active ({activeCustomers})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-neutral-200 dark:bg-neutral-800" />
          <span className="text-xs text-neutral-600 dark:text-neutral-400">Total ({totalCustomers})</span>
        </div>
      </div>
    </div>
  );
}

// Deals Table Component
function DealsTable({ deals, loading }: { deals: RecentDeal[]; loading: boolean }) {
  const [search, setSearch] = useState("");
  
  const filteredDeals = deals.filter(deal => 
    deal.title.toLowerCase().includes(search.toLowerCase()) ||
    deal.customer?.name?.toLowerCase().includes(search.toLowerCase())
  );
  
  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      lead: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
      qualified: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      proposal: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      negotiation: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
      "closed-won": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
      "closed-lost": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    };
    return colors[stage] || colors.lead;
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
        <div className="p-6 animate-pulse">
          <div className="h-6 w-32 bg-neutral-200 dark:bg-neutral-800 rounded mb-4" />
          <div className="space-y-4">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-neutral-200 dark:bg-neutral-800" />
                <div className="flex-1">
                  <div className="h-4 w-48 bg-neutral-200 dark:bg-neutral-800 rounded mb-2" />
                  <div className="h-3 w-32 bg-neutral-200 dark:bg-neutral-800 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
      <div className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Active Deals</h3>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm bg-neutral-100 dark:bg-neutral-800 border-0 rounded-lg w-full sm:w-48 focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white text-neutral-900 dark:text-white placeholder:text-neutral-500"
            />
          </div>
        </div>
      </div>
      
      {/* Table Header */}
      <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-3 bg-neutral-50 dark:bg-neutral-800/50 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
        <div className="col-span-5">Deal Name</div>
        <div className="col-span-2 text-center">Stage</div>
        <div className="col-span-2 text-right">Value</div>
        <div className="col-span-2 text-right">Customer</div>
        <div className="col-span-1"></div>
      </div>
      
      {/* Table Body */}
      <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
        {filteredDeals.length > 0 ? (
          filteredDeals.slice(0, 5).map((deal) => (
            <div
              key={deal.id || deal._id}
              className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 px-6 py-4 items-center hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
            >
              <div className="sm:col-span-5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-neutral-900 dark:bg-white flex items-center justify-center text-white dark:text-neutral-900 font-semibold text-sm flex-shrink-0">
                  {deal.title.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-neutral-900 dark:text-white truncate">{deal.title}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                    {deal.customer?.company || "No company"}
                  </p>
                </div>
              </div>
              <div className="sm:col-span-2 sm:text-center">
                <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full capitalize ${getStageColor(deal.stage)}`}>
                  {deal.stage.replace("-", " ")}
                </span>
              </div>
              <div className="sm:col-span-2 sm:text-right font-semibold text-neutral-900 dark:text-white">
                {formatCurrency(deal.value)}
              </div>
              <div className="sm:col-span-2 sm:text-right text-sm text-neutral-600 dark:text-neutral-400 truncate">
                {deal.customer?.name || "N/A"}
              </div>
              <div className="sm:col-span-1 sm:text-right hidden sm:block">
                <button className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors">
                  <MoreVertical className="w-4 h-4 text-neutral-400" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="px-6 py-12 text-center text-neutral-500">
            <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No deals found</p>
            <Link href="/dashboard/deals" className="text-sm text-neutral-900 dark:text-white hover:underline mt-2 inline-block">
              Create your first deal →
            </Link>
          </div>
        )}
      </div>
      
      {deals.length > 5 && (
        <div className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 text-center">
          <Link
            href="/dashboard/deals"
            className="text-sm font-medium text-neutral-900 dark:text-white hover:underline"
          >
            View all {deals.length} deals →
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
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const token = await getToken();
      const [statsRes, dealsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/deals`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      
      const statsData = await statsRes.json();
      const dealsData = await dealsRes.json();
      
      if (statsData.success) {
        setStats(statsData.data.summary);
        setMonthlyData(statsData.data.monthlyData || []);
      }
      
      if (dealsData.success) {
        setRecentDeals(dealsData.data || []);
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

  const firstName = user?.firstName || "User";
  const activePercent = stats?.totalCustomers 
    ? Math.round((stats.activeCustomers / stats.totalCustomers) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header Greeting */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">
          Hello {firstName} 👋
        </h1>
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search..."
            className="pl-9 pr-4 py-2 text-sm bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg w-64 focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white focus:border-transparent text-neutral-900 dark:text-white placeholder:text-neutral-500"
          />
        </div>
      </div>

      {/* Stat Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCardNew
          icon={<DollarSign className="w-6 h-6 text-white" />}
          iconBg="bg-neutral-900 dark:bg-white dark:text-neutral-900"
          label="Earnings"
          value={formatCurrency(stats?.earningsThisMonth || stats?.wonValue || 0)}
          change={`${Math.abs(stats?.earningsChangePercent || 0)}%`}
          changeType={stats?.earningsChangePercent && stats.earningsChangePercent >= 0 ? "up" : stats?.earningsChangePercent && stats.earningsChangePercent < 0 ? "down" : "neutral"}
          changeLabel="this month"
        />
        <StatCardNew
          icon={<Briefcase className="w-6 h-6 text-white dark:text-neutral-900" />}
          iconBg="bg-neutral-700 dark:bg-neutral-300"
          label="Pipeline Value"
          value={formatCurrency(stats?.totalDealValue || 0)}
          change={`${Math.abs(stats?.pipelineChangePercent || 0)}%`}
          changeType={stats?.pipelineChangePercent && stats.pipelineChangePercent >= 0 ? "up" : stats?.pipelineChangePercent && stats.pipelineChangePercent < 0 ? "down" : "neutral"}
          changeLabel="this month"
        />
        <StatCardNew
          icon={<TrendingUp className="w-6 h-6 text-white dark:text-neutral-900" />}
          iconBg="bg-neutral-500 dark:bg-neutral-400"
          label="Total Deals"
          value={`${stats?.totalDeals || 0}`}
          change={`${stats?.dealsThisMonth || 0} new`}
          changeType="neutral"
          changeLabel="this month"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <OverviewChart data={monthlyData} loading={loading} />
        </div>
        <div>
          <CustomersDonutChart 
            newCustomersPercent={activePercent} 
            totalCustomers={stats?.totalCustomers || 0}
            activeCustomers={stats?.activeCustomers || 0}
            loading={loading}
          />
        </div>
      </div>

      {/* Deals Table */}
      <DealsTable deals={recentDeals} loading={loading} />
    </div>
  );
}
