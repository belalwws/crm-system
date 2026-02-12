'use client';

import { useState } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { X, ChevronRight, ChevronLeft, Users, Briefcase, CheckCircle, Sparkles, CreditCard, CheckSquare, Zap, Crown, BarChart3 } from 'lucide-react';
import { api } from '@/lib/api';

interface OnboardingWizardProps {
  onComplete: () => void;
}

const steps = [
  { title: 'Welcome', icon: Sparkles, description: 'Let\'s set up your CRM' },
  { title: 'Choose Plan', icon: CreditCard, description: 'Pick the right plan' },
  { title: 'First Customer', icon: Users, description: 'Add your first customer' },
  { title: 'First Deal', icon: Briefcase, description: 'Create a deal' },
  { title: 'First Task', icon: CheckSquare, description: 'Track your work' },
  { title: 'All Done', icon: CheckCircle, description: 'You\'re ready to go!' },
];

const planOptions = [
  { tier: 'FREE', name: 'Free', price: 0, icon: Zap, color: 'neutral', desc: '50 customers, 20 deals', highlight: false },
  { tier: 'STARTER', name: 'Starter', price: 29, icon: BarChart3, color: 'blue', desc: '500 customers, 200 deals, 5 users', highlight: false },
  { tier: 'PROFESSIONAL', name: 'Professional', price: 79, icon: Crown, color: 'purple', desc: '5,000 customers, unlimited deals, 25 users', highlight: true },
  { tier: 'ENTERPRISE', name: 'Enterprise', price: 199, icon: Crown, color: 'amber', desc: 'Unlimited everything + priority support', highlight: false },
];

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('FREE');
  const [customerForm, setCustomerForm] = useState({ name: '', email: '', company: '' });
  const [dealForm, setDealForm] = useState({ title: '', value: '' });
  const [taskForm, setTaskForm] = useState({ title: '', priority: 'MEDIUM' });
  const [createdCustomerId, setCreatedCustomerId] = useState('');

  const handlePlanSelect = async () => {
    if (selectedPlan !== 'FREE') {
      setLoading(true);
      try {
        const token = await getToken();
        api.setToken(token);
        const res = await api.createCheckout(selectedPlan);
        if (res.success && (res.data as any)?.url) {
          localStorage.setItem('crm_onboarding_plan_selected', selectedPlan);
          window.location.href = (res.data as any).url;
          return;
        }
      } catch {
        // continue anyway
      } finally {
        setLoading(false);
      }
    }
    setStep(2);
  };

  const handleCreateCustomer = async () => {
    if (!customerForm.name || !customerForm.email) return;
    setLoading(true);
    try {
      const token = await getToken();
      api.setToken(token);
      const res = await api.createCustomer({
        name: customerForm.name,
        email: customerForm.email,
        company: customerForm.company,
        status: 'LEAD',
      });
      if (res.data) {
        setCreatedCustomerId((res.data as any).id);
        setStep(3);
      }
    } catch (err) {
      console.error('Failed to create customer:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDeal = async () => {
    if (!dealForm.title) return;
    setLoading(true);
    try {
      const token = await getToken();
      api.setToken(token);
      await api.createDeal({
        title: dealForm.title,
        value: parseFloat(dealForm.value) || 0,
        stage: 'lead',
        probability: 10,
        customerId: createdCustomerId || undefined,
      } as any);
      setStep(4);
    } catch (err) {
      console.error('Failed to create deal:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async () => {
    if (!taskForm.title) return;
    setLoading(true);
    try {
      const token = await getToken();
      api.setToken(token);
      await api.createTask({
        title: taskForm.title,
        priority: taskForm.priority,
        status: 'TODO',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      } as any);
      setStep(5);
    } catch (err) {
      console.error('Failed to create task:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('crm_onboarding_complete', 'true');
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-neutral-200 dark:bg-neutral-800">
          <div
            className="h-full bg-blue-600 transition-all duration-500"
            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Header */}
        <div className="p-6 pb-0 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            Step {step + 1} of {steps.length}
          </div>
          <button onClick={handleComplete} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 0: Welcome */}
          {step === 0 && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
                Welcome{user?.firstName ? `, ${user.firstName}` : ''}!
              </h2>
              <p className="text-neutral-500 max-w-sm mx-auto">
                Let&apos;s get your CRM set up in just a few steps. We&apos;ll choose a plan, add your first customer, and create a deal.
              </p>
              <button
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium"
              >
                Get Started <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step 1: Choose Plan */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Choose Your Plan</h2>
                  <p className="text-sm text-neutral-500">All paid plans include a 14-day free trial</p>
                </div>
              </div>
              <div className="space-y-2">
                {planOptions.map(plan => (
                  <button key={plan.tier} onClick={() => setSelectedPlan(plan.tier)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                      selectedPlan === plan.tier
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10'
                        : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
                    } ${plan.highlight ? 'ring-1 ring-purple-200 dark:ring-purple-800' : ''}`}>
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      plan.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30' :
                      plan.color === 'purple' ? 'bg-purple-100 dark:bg-purple-900/30' :
                      plan.color === 'amber' ? 'bg-amber-100 dark:bg-amber-900/30' :
                      'bg-neutral-100 dark:bg-neutral-800'
                    }`}>
                      <plan.icon className={`w-4 h-4 ${
                        plan.color === 'blue' ? 'text-blue-600' :
                        plan.color === 'purple' ? 'text-purple-600' :
                        plan.color === 'amber' ? 'text-amber-600' :
                        'text-neutral-600'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-neutral-900 dark:text-white">{plan.name}</span>
                        {plan.highlight && <span className="text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 px-1.5 py-0.5 rounded font-bold">POPULAR</span>}
                      </div>
                      <p className="text-xs text-neutral-500 truncate">{plan.desc}</p>
                    </div>
                    <span className="text-sm font-bold text-neutral-900 dark:text-white">
                      {plan.price === 0 ? 'Free' : `$${plan.price}/mo`}
                    </span>
                  </button>
                ))}
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep(0)} className="flex-1 px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800">
                  <ChevronLeft className="w-4 h-4 inline mr-1" /> Back
                </button>
                <button onClick={handlePlanSelect} disabled={loading}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 font-medium">
                  {loading ? 'Loading...' : selectedPlan === 'FREE' ? 'Continue Free' : 'Start Free Trial'}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: First Customer */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Add Your First Customer</h2>
                  <p className="text-sm text-neutral-500">Enter some basic information</p>
                </div>
              </div>
              <input type="text" placeholder="Customer name *" value={customerForm.name}
                onChange={(e) => setCustomerForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white" />
              <input type="email" placeholder="Email *" value={customerForm.email}
                onChange={(e) => setCustomerForm(f => ({ ...f, email: e.target.value }))}
                className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white" />
              <input type="text" placeholder="Company (optional)" value={customerForm.company}
                onChange={(e) => setCustomerForm(f => ({ ...f, company: e.target.value }))}
                className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white" />
              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep(1)} className="flex-1 px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800">
                  <ChevronLeft className="w-4 h-4 inline mr-1" /> Back
                </button>
                <button onClick={handleCreateCustomer} disabled={!customerForm.name || !customerForm.email || loading}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 font-medium">
                  {loading ? 'Creating...' : 'Save & Continue'}
                </button>
              </div>
              <button onClick={() => setStep(3)} className="w-full text-xs text-neutral-400 hover:text-neutral-600 mt-1">Skip this step</button>
            </div>
          )}

          {/* Step 3: First Deal */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-violet-100 dark:bg-violet-900/30 rounded-xl flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Create Your First Deal</h2>
                  <p className="text-sm text-neutral-500">Track a potential sale</p>
                </div>
              </div>
              <input type="text" placeholder="Deal title *" value={dealForm.title}
                onChange={(e) => setDealForm(f => ({ ...f, title: e.target.value }))}
                className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white" />
              <input type="number" placeholder="Value ($)" value={dealForm.value}
                onChange={(e) => setDealForm(f => ({ ...f, value: e.target.value }))}
                className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white" />
              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep(2)} className="flex-1 px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800">
                  <ChevronLeft className="w-4 h-4 inline mr-1" /> Back
                </button>
                <button onClick={handleCreateDeal} disabled={!dealForm.title || loading}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 font-medium">
                  {loading ? 'Creating...' : 'Save & Continue'}
                </button>
              </div>
              <button onClick={() => setStep(4)} className="w-full text-xs text-neutral-400 hover:text-neutral-600 mt-1">Skip this step</button>
            </div>
          )}

          {/* Step 4: First Task */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                  <CheckSquare className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Create Your First Task</h2>
                  <p className="text-sm text-neutral-500">Stay organized from day one</p>
                </div>
              </div>
              <input type="text" placeholder="Task title *" value={taskForm.title}
                onChange={(e) => setTaskForm(f => ({ ...f, title: e.target.value }))}
                className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white" />
              <select value={taskForm.priority}
                onChange={(e) => setTaskForm(f => ({ ...f, priority: e.target.value }))}
                className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white">
                <option value="LOW">Low Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="HIGH">High Priority</option>
                <option value="URGENT">Urgent</option>
              </select>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep(3)} className="flex-1 px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800">
                  <ChevronLeft className="w-4 h-4 inline mr-1" /> Back
                </button>
                <button onClick={handleCreateTask} disabled={!taskForm.title || loading}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 font-medium">
                  {loading ? 'Creating...' : 'Save & Finish'}
                </button>
              </div>
              <button onClick={() => setStep(5)} className="w-full text-xs text-neutral-400 hover:text-neutral-600 mt-1">Skip this step</button>
            </div>
          )}

          {/* Step 5: All Done */}
          {step === 5 && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">You&apos;re All Set!</h2>
              <p className="text-neutral-500 max-w-sm mx-auto">
                Your CRM is ready to use. Explore the dashboard, manage customers, track deals, and grow your business.
              </p>
              <div className="flex flex-col gap-2">
                <button onClick={handleComplete}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-medium">
                  Go to Dashboard <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
