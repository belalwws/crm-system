'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import api from '@/lib/api';
import {
  CreditCard, Check, Zap, ArrowRight, Crown,
  Users, BarChart3, Brain, FileText, Loader2, ExternalLink,
  AlertTriangle, Clock,
} from 'lucide-react';

interface Subscription {
  id: string;
  plan: string;
  status: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  trialStart: string | null;
  trialEnd: string | null;
  customersUsed: number;
  dealsUsed: number;
  usersUsed: number;
  storageUsedMB: number;
  aiRequestsUsed: number;
}

interface PlanInfo {
  id?: string;
  name: string;
  tier: string;
  price: number;
  priceId?: string;
  features: string[];
  limits: Record<string, number>;
}

const tierIcons: Record<string, typeof Zap> = {
  FREE: Zap,
  STARTER: BarChart3,
  PROFESSIONAL: Crown,
  ENTERPRISE: Crown,
};

const tierColors: Record<string, string> = {
  FREE: 'from-neutral-500 to-neutral-600',
  STARTER: 'from-blue-500 to-blue-600',
  PROFESSIONAL: 'from-purple-500 to-purple-600',
  ENTERPRISE: 'from-amber-500 to-amber-600',
};

export default function BillingPage() {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<PlanInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!isSignedIn) return;
    try {
      const token = await getToken();
      if (!token) return;
      api.setToken(token);
      const [subRes, planRes] = await Promise.all([
        api.getSubscription(),
        api.getPlans(),
      ]);
      if (subRes.success) setSubscription(subRes.data as Subscription);
      if (planRes.success) {
        const raw = (planRes.data as any[]) || [];
        setPlans(raw.map((p: any) => ({
          ...p,
          tier: p.tier || p.id || p.name?.toUpperCase() || '',
          price: p.price ?? p.priceMonthly ?? 0,
          features: p.features || [],
          limits: p.limits || {
            customers: p.customers ?? 0,
            deals: p.deals ?? 0,
            users: p.users ?? 0,
            storage: p.storageMB ?? 0,
            aiRequests: p.aiRequests ?? 0,
          },
        })));
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [getToken, isSignedIn]);

  useEffect(() => { if (isLoaded && isSignedIn) fetchData(); }, [fetchData, isLoaded, isSignedIn]);

  const handleUpgrade = async (tier: string) => {
    setUpgrading(tier);
    try {
      const token = await getToken();
      api.setToken(token);
      const res = await api.createCheckout({ plan: tier });
      if (res.success && (res.data as any)?.url) {
        window.location.href = (res.data as any).url;
      }
    } catch {
      // silent
    } finally {
      setUpgrading(null);
    }
  };

  const handleManageBilling = async () => {
    setPortalLoading(true);
    try {
      const token = await getToken();
      api.setToken(token);
      const res = await api.createBillingPortal();
      if (res.success && (res.data as any)?.url) {
        window.location.href = (res.data as any).url;
      }
    } catch {
      // silent
    } finally {
      setPortalLoading(false);
    }
  };

  const getDaysLeft = () => {
    if (!subscription?.trialEnd) return 0;
    const end = new Date(subscription.trialEnd);
    const now = new Date();
    return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  };

  const getUsagePercent = (used: number, limit: number) => {
    if (limit === -1) return 0;
    return Math.min(100, Math.round((used / limit) * 100));
  };

  const currentPlan = plans.find(p => p.tier === subscription?.plan) || null;

  if (loading) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="h-40 bg-neutral-200 dark:bg-neutral-800 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-60 bg-neutral-200 dark:bg-neutral-800 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Billing & Plans</h1>
        <p className="text-sm text-neutral-500 mt-1">Manage your subscription and usage</p>
      </div>

      {/* Trial Banner */}
      {subscription?.status === 'TRIALING' && (
        <div className={`p-4 rounded-xl border flex items-center justify-between ${
          getDaysLeft() <= 3
            ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
            : 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800'
        }`}>
          <div className="flex items-center gap-3">
            {getDaysLeft() <= 3
              ? <AlertTriangle className="w-5 h-5 text-red-500" />
              : <Clock className="w-5 h-5 text-amber-500" />}
            <div>
              <p className={`text-sm font-medium ${getDaysLeft() <= 3 ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-400'}`}>
                {getDaysLeft() <= 0
                  ? 'Your trial has expired!'
                  : `Your trial ends in ${getDaysLeft()} day${getDaysLeft() !== 1 ? 's' : ''}`}
              </p>
              <p className="text-xs text-neutral-500 mt-0.5">
                Upgrade to keep your data and unlock all features
              </p>
            </div>
          </div>
          <button onClick={() => handleUpgrade('PROFESSIONAL')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
            Upgrade Now
          </button>
        </div>
      )}

      {/* Current Plan Card */}
      {subscription && (
        <div className={`relative overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800 bg-gradient-to-r ${tierColors[subscription.plan] || tierColors.FREE} p-6 text-white`}>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-sm">Current Plan</p>
                <h2 className="text-2xl font-bold mt-1">{subscription.plan}</h2>
                <p className="text-white/70 text-sm mt-1">
                  Status: <span className="text-white font-medium capitalize">{subscription.status.toLowerCase().replace('_', ' ')}</span>
                </p>
                {subscription.currentPeriodEnd && (
                  <p className="text-white/70 text-xs mt-1">
                    {subscription.status === 'TRIALING' ? 'Trial ends' : 'Renews'}: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="text-right">
                {currentPlan && (
                  <p className="text-3xl font-bold">
                    ${currentPlan.price}<span className="text-base font-normal text-white/70">/mo</span>
                  </p>
                )}
                {subscription.plan !== 'FREE' && (
                  <button onClick={handleManageBilling} disabled={portalLoading}
                    className="mt-3 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur text-white text-sm rounded-lg transition-colors flex items-center gap-2">
                    {portalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                    Manage Billing
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        </div>
      )}

      {/* Usage */}
      {subscription && currentPlan && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Usage This Period</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: 'Customers', used: subscription.customersUsed, limit: currentPlan.limits.customers, icon: Users },
              { label: 'Deals', used: subscription.dealsUsed, limit: currentPlan.limits.deals, icon: BarChart3 },
              { label: 'Team Members', used: subscription.usersUsed, limit: currentPlan.limits.users, icon: Users },
              { label: 'Storage (MB)', used: subscription.storageUsedMB, limit: currentPlan.limits.storage, icon: FileText },
              { label: 'AI Requests', used: subscription.aiRequestsUsed, limit: currentPlan.limits.aiRequests, icon: Brain },
            ].map(item => {
              const pct = getUsagePercent(item.used, item.limit);
              return (
                <div key={item.label} className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <item.icon className="w-4 h-4 text-neutral-500" />
                      <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{item.label}</span>
                    </div>
                    <span className="text-xs text-neutral-500">
                      {item.used} / {item.limit === -1 ? '∞' : item.limit}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-blue-500'
                      }`}
                      style={{ width: item.limit === -1 ? '0%' : `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Plans Grid */}
      <div>
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Available Plans</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map(plan => {
            const isCurrent = plan.tier === subscription?.plan;
            const Icon = tierIcons[plan.tier] || Zap;
            return (
              <div key={plan.tier}
                className={`relative p-5 rounded-xl border transition-all ${
                  isCurrent
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10 ring-2 ring-blue-500/20'
                    : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-700'
                }`}>
                {isCurrent && (
                  <span className="absolute top-3 right-3 px-2 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-full">
                    CURRENT
                  </span>
                )}
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${tierColors[plan.tier]} flex items-center justify-center mb-3`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h4 className="text-lg font-bold text-neutral-900 dark:text-white">{plan.name}</h4>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">
                  ${plan.price}<span className="text-sm font-normal text-neutral-500">/mo</span>
                </p>

                <ul className="mt-4 space-y-2">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                <div className="mt-5">
                  {isCurrent ? (
                    <div className="w-full py-2 text-center text-sm text-blue-600 font-medium">Current Plan</div>
                  ) : plan.tier === 'FREE' ? (
                    <div className="w-full py-2 text-center text-sm text-neutral-400">Free Forever</div>
                  ) : (
                    <button onClick={() => handleUpgrade(plan.tier)} disabled={!!upgrading}
                      className="w-full flex items-center justify-center gap-2 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors">
                      {upgrading === plan.tier ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <ArrowRight className="w-4 h-4" />
                          {subscription?.plan === 'FREE' ? 'Start Trial' : 'Upgrade'}
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
