import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import Loading from '../components/Loading';
import { dashboardService } from '../services/dashboardService';
import { DashboardStats } from '../types';
import { FiUsers, FiDollarSign, FiCheckSquare, FiTrendingUp } from 'react-icons/fi';
import { format } from 'date-fns';

/**
 * Dashboard Page
 * الصفحة الرئيسية مع الإحصائيات
 */
const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setIsLoading(true);
      const response = await dashboardService.getStats();
      setStats(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load dashboard stats');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <Loading message="Loading dashboard..." />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-red-600">{error}</p>
          <button onClick={loadDashboardStats} className="btn btn-primary mt-4">
            Retry
          </button>
        </div>
      </Layout>
    );
  }

  const stageColors: Record<string, string> = {
    lead: 'bg-gray-400',
    qualified: 'bg-blue-500',
    proposal: 'bg-yellow-500',
    negotiation: 'bg-orange-500',
    'closed-won': 'bg-green-500',
    'closed-lost': 'bg-red-500',
  };

  return (
    <Layout>
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Customers"
            value={stats?.summary.totalCustomers || 0}
            icon={<FiUsers size={24} />}
            color="blue"
          />
          <StatCard
            title="Active Customers"
            value={stats?.summary.activeCustomers || 0}
            icon={<FiUsers size={24} />}
            color="green"
          />
          <StatCard
            title="Total Deals"
            value={stats?.summary.totalDeals || 0}
            icon={<FiDollarSign size={24} />}
            color="yellow"
          />
          <StatCard
            title="Pending Tasks"
            value={stats?.summary.pendingTasks || 0}
            icon={<FiCheckSquare size={24} />}
            color="red"
          />
        </div>

        {/* Financial Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Deal Value</h3>
            <p className="text-3xl font-bold text-primary-600">
              ${stats?.summary.totalDealValue.toLocaleString() || 0}
            </p>
          </div>
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Won Deals</h3>
            <p className="text-3xl font-bold text-green-600">{stats?.summary.wonDeals || 0}</p>
            <p className="text-sm text-gray-600 mt-1">
              ${stats?.summary.wonValue.toLocaleString() || 0}
            </p>
          </div>
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Win Rate</h3>
            <p className="text-3xl font-bold text-blue-600">
              {stats?.summary.totalDeals
                ? Math.round((stats.summary.wonDeals / stats.summary.totalDeals) * 100)
                : 0}
              %
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Deals by Stage */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Deals by Stage</h3>
            <div className="space-y-3">
              {stats?.dealsByStage.map((stage) => (
                <div key={stage._id} className="flex items-center justify-between">
                  <div className="flex items-center flex-1">
                    <div className={`w-3 h-3 rounded-full ${stageColors[stage._id]} mr-3`}></div>
                    <span className="text-sm text-gray-700 capitalize">
                      {stage._id.replace('-', ' ')}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{stage.count} deals</p>
                    <p className="text-xs text-gray-500">${stage.value.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Tasks */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Tasks</h3>
            <div className="space-y-3">
              {stats?.recentTasks && stats.recentTasks.length > 0 ? (
                stats.recentTasks.map((task) => (
                  <div key={task._id} className="flex items-start pb-3 border-b last:border-0">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{task.title}</p>
                      <div className="flex items-center mt-1 space-x-2">
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            task.priority === 'high'
                              ? 'bg-red-100 text-red-700'
                              : task.priority === 'medium'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {task.priority}
                        </span>
                        <span className="text-xs text-gray-500">
                          {task.dueDate && format(new Date(task.dueDate), 'MMM dd, yyyy')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No recent tasks</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
