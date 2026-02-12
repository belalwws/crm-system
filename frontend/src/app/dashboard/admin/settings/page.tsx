'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import api from '@/lib/api';
import { Settings, Save, Globe, DollarSign, Users, Zap, Mail, FileText, Brain } from 'lucide-react';

interface SystemSettings {
  id: string;
  companyName: string;
  defaultCurrency: string;
  defaultTimezone: string;
  maxUsersAllowed: number;
  features: {
    aiInsights?: boolean;
    emailIntegration?: boolean;
    documentStorage?: boolean;
    workflows?: boolean;
  };
}

export default function AdminSettingsPage() {
  const { getToken } = useAuth();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    companyName: '',
    defaultCurrency: 'USD',
    defaultTimezone: 'UTC',
    maxUsersAllowed: 50,
    features: {
      aiInsights: true,
      emailIntegration: true,
      documentStorage: true,
      workflows: true,
    },
  });

  const fetchSettings = useCallback(async () => {
    try {
      const token = await getToken();
      api.setToken(token);
      const res = await api.getSystemSettings();
      if (res.success && res.data) {
        const s = res.data as SystemSettings;
        setSettings(s);
        setForm({
          companyName: s.companyName,
          defaultCurrency: s.defaultCurrency,
          defaultTimezone: s.defaultTimezone,
          maxUsersAllowed: s.maxUsersAllowed,
          features: {
            aiInsights: s.features?.aiInsights ?? true,
            emailIntegration: s.features?.emailIntegration ?? true,
            documentStorage: s.features?.documentStorage ?? true,
            workflows: s.features?.workflows ?? true,
          },
        });
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = await getToken();
      api.setToken(token);
      const res = await api.updateSystemSettings(form);
      if (res.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  const timezones = [
    'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
    'Europe/London', 'Europe/Berlin', 'Europe/Paris', 'Asia/Tokyo', 'Asia/Shanghai',
    'Asia/Kolkata', 'Asia/Dubai', 'Australia/Sydney', 'Africa/Cairo', 'Pacific/Auckland',
  ];

  const currencies = [
    { code: 'USD', name: 'US Dollar' }, { code: 'EUR', name: 'Euro' },
    { code: 'GBP', name: 'British Pound' }, { code: 'JPY', name: 'Japanese Yen' },
    { code: 'CAD', name: 'Canadian Dollar' }, { code: 'AUD', name: 'Australian Dollar' },
    { code: 'CHF', name: 'Swiss Franc' }, { code: 'CNY', name: 'Chinese Yuan' },
    { code: 'INR', name: 'Indian Rupee' }, { code: 'AED', name: 'UAE Dirham' },
    { code: 'SAR', name: 'Saudi Riyal' }, { code: 'EGP', name: 'Egyptian Pound' },
  ];

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        {[1,2,3].map(i => <div key={i} className="h-40 bg-neutral-200 dark:bg-neutral-800 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Save Banner */}
      {saved && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 rounded-xl text-sm text-emerald-700 dark:text-emerald-400">
          Settings saved successfully!
        </div>
      )}

      {/* General Settings */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">General Settings</h2>
            <p className="text-sm text-neutral-500">Configure your CRM platform</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Company Name
            </label>
            <input type="text" value={form.companyName}
              onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))}
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                <DollarSign className="w-4 h-4 inline mr-1" />Default Currency
              </label>
              <select value={form.defaultCurrency}
                onChange={e => setForm(f => ({ ...f, defaultCurrency: e.target.value }))}
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white">
                {currencies.map(c => <option key={c.code} value={c.code}>{c.code} — {c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                <Globe className="w-4 h-4 inline mr-1" />Default Timezone
              </label>
              <select value={form.defaultTimezone}
                onChange={e => setForm(f => ({ ...f, defaultTimezone: e.target.value }))}
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white">
                {timezones.map(tz => <option key={tz} value={tz}>{tz}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              <Users className="w-4 h-4 inline mr-1" />Max Users Allowed
            </label>
            <input type="number" min={1} max={10000} value={form.maxUsersAllowed}
              onChange={e => setForm(f => ({ ...f, maxUsersAllowed: parseInt(e.target.value) || 50 }))}
              className="w-32 px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
        </div>
      </div>

      {/* Feature Flags */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-lg bg-purple-100 dark:bg-purple-900/30">
            <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Feature Flags</h2>
            <p className="text-sm text-neutral-500">Enable or disable platform features</p>
          </div>
        </div>

        <div className="space-y-3">
          {[
            { key: 'aiInsights', label: 'AI Insights', desc: 'AI-powered analytics and recommendations', icon: Brain },
            { key: 'emailIntegration', label: 'Email Integration', desc: 'Send and manage emails from CRM', icon: Mail },
            { key: 'documentStorage', label: 'Document Storage', desc: 'Upload and manage files', icon: FileText },
            { key: 'workflows', label: 'Workflows', desc: 'Automated workflow triggers', icon: Zap },
          ].map(feat => (
            <label key={feat.key} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
              <div className="flex items-center gap-3">
                <feat.icon className="w-4 h-4 text-neutral-500" />
                <div>
                  <p className="text-sm font-medium text-neutral-900 dark:text-white">{feat.label}</p>
                  <p className="text-xs text-neutral-500">{feat.desc}</p>
                </div>
              </div>
              <div className="relative">
                <input type="checkbox"
                  checked={form.features[feat.key as keyof typeof form.features]}
                  onChange={e => setForm(f => ({
                    ...f, features: { ...f.features, [feat.key]: e.target.checked },
                  }))}
                  className="sr-only peer" />
                <div className="w-10 h-5 bg-neutral-300 dark:bg-neutral-700 peer-checked:bg-blue-600 rounded-full transition-colors" />
                <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform" />
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Platform Info */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Platform Info</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: 'Version', value: 'Nexus CRM v4.0' },
            { label: 'Database', value: 'PostgreSQL (Neon)' },
            { label: 'Auth', value: 'Clerk + JWT' },
            { label: 'Real-time', value: 'Socket.IO' },
            { label: 'Cache', value: 'Redis' },
            { label: 'Billing', value: 'Stripe' },
          ].map(info => (
            <div key={info.label} className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
              <p className="text-xs text-neutral-500">{info.label}</p>
              <p className="text-sm font-medium text-neutral-900 dark:text-white">{info.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors">
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
