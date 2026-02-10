'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import {
  User,
  Bell,
  Palette,
  Lock,
  Globe,
  Mail,
  Moon,
  Sun,
  Save,
  Check,
  Building2,
  Phone,
  Shield,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import api from '@/lib/api';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  company: string | null;
  role: string;
  avatar: string | null;
  phone: string | null;
  timezone: string | null;
  isActive: boolean;
  createdAt: string;
  _count?: {
    customers: number;
    deals: number;
    tasksAssigned: number;
  };
}

export default function SettingsPage() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'appearance' | 'email'>('profile');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Profile from backend
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileForm, setProfileForm] = useState({ name: '', company: '', phone: '', timezone: 'UTC' });

  // Password form
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  // Notification settings
  const [notifications, setNotifications] = useState({
    emailTaskReminders: true,
    emailDealUpdates: true,
    emailWeeklyDigest: false,
    pushTaskReminders: true,
    pushDealWon: true,
    pushNewCustomer: false,
  });

  // Email settings
  const [emailSettings, setEmailSettings] = useState({
    signature: '',
    defaultCc: '',
    replyTo: user?.emailAddresses[0]?.emailAddress || '',
  });

  const fetchProfile = useCallback(async () => {
    try {
      const token = await getToken();
      api.setToken(token);
      const [profileRes, prefsRes] = await Promise.all([
        api.getProfile() as Promise<{ success: boolean; data?: UserProfile }>,
        api.getPreferences() as Promise<{ success: boolean; data?: any }>,
      ]);
      if (profileRes.success && profileRes.data) {
        setProfile(profileRes.data);
        setProfileForm({
          name: profileRes.data.name || '',
          company: profileRes.data.company || '',
          phone: profileRes.data.phone || '',
          timezone: profileRes.data.timezone || 'UTC',
        });
      }
      if (prefsRes.success && prefsRes.data) {
        setNotifications({
          emailTaskReminders: prefsRes.data.emailTaskReminders ?? true,
          emailDealUpdates: prefsRes.data.emailDealUpdates ?? true,
          emailWeeklyDigest: prefsRes.data.emailWeeklyDigest ?? false,
          pushTaskReminders: prefsRes.data.pushTaskReminders ?? true,
          pushDealWon: prefsRes.data.pushDealWon ?? true,
          pushNewCustomer: prefsRes.data.pushNewCustomer ?? false,
        });
        setEmailSettings({
          signature: prefsRes.data.emailSignature || '',
          defaultCc: prefsRes.data.defaultCc || '',
          replyTo: prefsRes.data.replyTo || user?.emailAddresses[0]?.emailAddress || '',
        });
      }
    } catch {
      // fallback to Clerk data
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSaveProfile = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const token = await getToken();
      api.setToken(token);
      const res = await api.updateProfile({
        name: profileForm.name,
        company: profileForm.company || null,
        phone: profileForm.phone || null,
        timezone: profileForm.timezone,
      });
      if (res.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully' });
        fetchProfile();
      } else {
        setMessage({ type: 'error', text: res.message || 'Failed to update profile' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters' });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const token = await getToken();
      api.setToken(token);
      const res = await api.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      if (res.success) {
        setMessage({ type: 'success', text: 'Password changed successfully' });
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setMessage({ type: 'error', text: res.message || 'Failed to change password' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to change password' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveOther = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const token = await getToken();
      api.setToken(token);
      const res = await api.updatePreferences({
        emailTaskReminders: notifications.emailTaskReminders,
        emailDealUpdates: notifications.emailDealUpdates,
        emailWeeklyDigest: notifications.emailWeeklyDigest,
        pushTaskReminders: notifications.pushTaskReminders,
        pushDealWon: notifications.pushDealWon,
        pushNewCustomer: notifications.pushNewCustomer,
        emailSignature: emailSettings.signature,
        defaultCc: emailSettings.defaultCc,
        replyTo: emailSettings.replyTo,
      });
      if (res.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        setMessage({ type: 'success', text: 'Preferences saved successfully' });
      } else {
        setMessage({ type: 'error', text: res.message || 'Failed to save preferences' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to save preferences' });
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'email', label: 'Email Settings', icon: Mail },
  ];

  const timezones = [
    'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
    'Europe/London', 'Europe/Berlin', 'Europe/Paris', 'Asia/Tokyo', 'Asia/Dubai',
    'Asia/Kolkata', 'Asia/Shanghai', 'Africa/Cairo', 'Australia/Sydney',
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Settings</h1>
        <p className="text-neutral-500 dark:text-neutral-400 mt-1">
          Manage your account preferences
        </p>
      </div>

      {/* Role Badge */}
      {profile && (
        <div className="mb-6 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center overflow-hidden">
              {user?.imageUrl ? (
                <img src={user.imageUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-violet-600 text-lg font-bold">
                  {profile.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <p className="font-medium text-neutral-900 dark:text-white">{profile.name}</p>
              <p className="text-sm text-neutral-500">{profile.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-neutral-400" />
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              profile.role === 'ADMIN' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
              profile.role === 'MANAGER' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
              'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
            }`}>
              {profile.role}
            </span>
          </div>
        </div>
      )}

      {/* Message */}
      {message && (
        <div className={`mb-6 px-4 py-3 rounded-lg text-sm ${
          message.type === 'success'
            ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border border-green-200 dark:border-green-800'
            : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-800'
        }`}>
          {message.text}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="md:w-48 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as typeof activeTab); setMessage(null); }}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-medium'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* Profile Settings */}
          {activeTab === 'profile' && (
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-6">Profile Settings</h2>
              
              {loading ? (
                <div className="animate-pulse space-y-4">
                  {[1,2,3,4].map(i => <div key={i} className="h-10 bg-neutral-200 dark:bg-neutral-800 rounded-lg" />)}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      <User className="inline w-4 h-4 mr-1" /> Full Name
                    </label>
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      <Mail className="inline w-4 h-4 mr-1" /> Email
                    </label>
                    <input
                      type="email"
                      value={profile?.email || ''}
                      disabled
                      className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-100 dark:bg-neutral-800/50 text-neutral-500 cursor-not-allowed text-sm"
                    />
                    <p className="text-xs text-neutral-500 mt-1">Email is managed through your account provider</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      <Building2 className="inline w-4 h-4 mr-1" /> Company
                    </label>
                    <input
                      type="text"
                      value={profileForm.company}
                      onChange={e => setProfileForm({ ...profileForm, company: e.target.value })}
                      className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      <Phone className="inline w-4 h-4 mr-1" /> Phone
                    </label>
                    <input
                      type="text"
                      value={profileForm.phone}
                      onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      <Globe className="inline w-4 h-4 mr-1" /> Timezone
                    </label>
                    <select
                      value={profileForm.timezone}
                      onChange={e => setProfileForm({ ...profileForm, timezone: e.target.value })}
                      className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    >
                      {timezones.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                    </select>
                  </div>

                  {profile?._count && (
                    <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700">
                      <p className="text-xs text-neutral-500 mb-2">Your activity:</p>
                      <div className="flex gap-4 text-sm">
                        <span className="text-neutral-700 dark:text-neutral-300">{profile._count.customers} customers</span>
                        <span className="text-neutral-700 dark:text-neutral-300">{profile._count.deals} deals</span>
                        <span className="text-neutral-700 dark:text-neutral-300">{profile._count.tasksAssigned} tasks</span>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors text-sm font-medium"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-6">Change Password</h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                Only applies to accounts registered with email and password (not Clerk SSO).
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    placeholder="Min 8 chars, 1 upper, 1 lower, 1 number"
                    className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={handleChangePassword}
                  disabled={saving || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors text-sm font-medium"
                >
                  <Lock className="w-4 h-4" />
                  {saving ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </div>
          )}

          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-6">Notification Preferences</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-neutral-900 dark:text-white mb-4">Email Notifications</h3>
                  <div className="space-y-3">
                    {[
                      { key: 'emailTaskReminders', label: 'Task Reminders', desc: 'Get notified when tasks are due' },
                      { key: 'emailDealUpdates', label: 'Deal Updates', desc: 'Updates on deal stage changes' },
                      { key: 'emailWeeklyDigest', label: 'Weekly Digest', desc: 'Summary of your weekly activity' },
                    ].map((item) => (
                      <label key={item.key} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg cursor-pointer">
                        <div>
                          <p className="text-sm font-medium text-neutral-900 dark:text-white">{item.label}</p>
                          <p className="text-xs text-neutral-500">{item.desc}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={(notifications as Record<string, boolean>)[item.key]}
                          onChange={(e) => setNotifications({ ...notifications, [item.key]: e.target.checked })}
                          className="w-5 h-5 text-violet-600 rounded"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-neutral-900 dark:text-white mb-4">Push Notifications</h3>
                  <div className="space-y-3">
                    {[
                      { key: 'pushTaskReminders', label: 'Task Reminders', desc: 'Browser notifications for due tasks' },
                      { key: 'pushDealWon', label: 'Deal Won', desc: 'Celebrate when you win a deal' },
                      { key: 'pushNewCustomer', label: 'New Customer', desc: 'When a new customer is added' },
                    ].map((item) => (
                      <label key={item.key} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg cursor-pointer">
                        <div>
                          <p className="text-sm font-medium text-neutral-900 dark:text-white">{item.label}</p>
                          <p className="text-xs text-neutral-500">{item.desc}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={(notifications as Record<string, boolean>)[item.key]}
                          onChange={(e) => setNotifications({ ...notifications, [item.key]: e.target.checked })}
                          className="w-5 h-5 text-violet-600 rounded"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Appearance Settings */}
          {activeTab === 'appearance' && (
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-6">Appearance</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-neutral-900 dark:text-white mb-4">Theme</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { value: 'light', label: 'Light', icon: Sun },
                      { value: 'dark', label: 'Dark', icon: Moon },
                      { value: 'system', label: 'System', icon: Globe },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setTheme(option.value)}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                          theme === option.value
                            ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                            : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300'
                        }`}
                      >
                        <option.icon className={`w-6 h-6 ${theme === option.value ? 'text-violet-600' : 'text-neutral-400'}`} />
                        <span className={`text-sm font-medium ${theme === option.value ? 'text-violet-600' : 'text-neutral-600 dark:text-neutral-400'}`}>
                          {option.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-neutral-200 dark:border-neutral-700">
                  <h3 className="text-sm font-medium text-neutral-900 dark:text-white mb-4">Display Density</h3>
                  <div className="flex gap-4">
                    {['Comfortable', 'Compact'].map((density) => (
                      <label key={density} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="density"
                          defaultChecked={density === 'Comfortable'}
                          className="w-4 h-4 text-violet-600"
                        />
                        <span className="text-sm text-neutral-700 dark:text-neutral-300">{density}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Email Settings */}
          {activeTab === 'email' && (
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-6">Email Settings</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Email Signature
                  </label>
                  <textarea
                    value={emailSettings.signature}
                    onChange={(e) => setEmailSettings({ ...emailSettings, signature: e.target.value })}
                    placeholder="Best regards,&#10;Your Name&#10;Company Name"
                    rows={4}
                    className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white resize-none text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                  <p className="text-xs text-neutral-500 mt-1">This will be added to the end of your emails</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Default CC
                  </label>
                  <input
                    type="email"
                    value={emailSettings.defaultCc}
                    onChange={(e) => setEmailSettings({ ...emailSettings, defaultCc: e.target.value })}
                    placeholder="colleague@company.com"
                    className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                  <p className="text-xs text-neutral-500 mt-1">Optionally CC someone on all outgoing emails</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Reply-To Address
                  </label>
                  <input
                    type="email"
                    value={emailSettings.replyTo}
                    onChange={(e) => setEmailSettings({ ...emailSettings, replyTo: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Save Button for non-API tabs */}
          {(activeTab === 'notifications' || activeTab === 'appearance' || activeTab === 'email') && (
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSaveOther}
                className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors text-sm font-medium"
              >
                {saved ? (
                  <>
                    <Check className="w-4 h-4" />
                    Saved!
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
