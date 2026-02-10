'use client';

import { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { X, ChevronRight, ChevronLeft, Users, Briefcase, CheckCircle, Sparkles, Building } from 'lucide-react';
import { api } from '@/lib/api';

interface OnboardingWizardProps {
  onComplete: () => void;
}

const steps = [
  { title: 'Welcome', icon: Sparkles, description: 'Let\'s set up your CRM' },
  { title: 'First Customer', icon: Users, description: 'Add your first customer' },
  { title: 'First Deal', icon: Briefcase, description: 'Create a deal' },
  { title: 'All Done', icon: CheckCircle, description: 'You\'re ready to go!' },
];

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [customerForm, setCustomerForm] = useState({ name: '', email: '', company: '' });
  const [dealForm, setDealForm] = useState({ title: '', value: '' });
  const [createdCustomerId, setCreatedCustomerId] = useState('');

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
        setStep(2);
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
      setStep(3);
    } catch (err) {
      console.error('Failed to create deal:', err);
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
          {step === 0 && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
                Welcome{user?.firstName ? `, ${user.firstName}` : ''}!
              </h2>
              <p className="text-neutral-500 max-w-sm mx-auto">
                Let's get your CRM set up in just a few steps. We'll help you add your first customer and create your first deal.
              </p>
              <button
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium"
              >
                Get Started <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === 1 && (
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
              <input
                type="text"
                placeholder="Customer name *"
                value={customerForm.name}
                onChange={(e) => setCustomerForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white"
              />
              <input
                type="email"
                placeholder="Email *"
                value={customerForm.email}
                onChange={(e) => setCustomerForm(f => ({ ...f, email: e.target.value }))}
                className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white"
              />
              <input
                type="text"
                placeholder="Company (optional)"
                value={customerForm.company}
                onChange={(e) => setCustomerForm(f => ({ ...f, company: e.target.value }))}
                className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white"
              />
              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep(0)} className="flex-1 px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800">
                  <ChevronLeft className="w-4 h-4 inline mr-1" /> Back
                </button>
                <button
                  onClick={handleCreateCustomer}
                  disabled={!customerForm.name || !customerForm.email || loading}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 font-medium"
                >
                  {loading ? 'Creating...' : 'Save & Continue'}
                </button>
              </div>
              <button onClick={() => setStep(2)} className="w-full text-xs text-neutral-400 hover:text-neutral-600 mt-1">Skip this step</button>
            </div>
          )}

          {step === 2 && (
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
              <input
                type="text"
                placeholder="Deal title *"
                value={dealForm.title}
                onChange={(e) => setDealForm(f => ({ ...f, title: e.target.value }))}
                className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white"
              />
              <input
                type="number"
                placeholder="Value ($)"
                value={dealForm.value}
                onChange={(e) => setDealForm(f => ({ ...f, value: e.target.value }))}
                className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white"
              />
              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep(1)} className="flex-1 px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800">
                  <ChevronLeft className="w-4 h-4 inline mr-1" /> Back
                </button>
                <button
                  onClick={handleCreateDeal}
                  disabled={!dealForm.title || loading}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 font-medium"
                >
                  {loading ? 'Creating...' : 'Save & Finish'}
                </button>
              </div>
              <button onClick={() => setStep(3)} className="w-full text-xs text-neutral-400 hover:text-neutral-600 mt-1">Skip this step</button>
            </div>
          )}

          {step === 3 && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">You're All Set!</h2>
              <p className="text-neutral-500 max-w-sm mx-auto">
                Your CRM is ready to use. Explore the dashboard, manage customers, track deals, and grow your business.
              </p>
              <button
                onClick={handleComplete}
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-medium"
              >
                Go to Dashboard <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
