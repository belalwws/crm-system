'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
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
} from 'lucide-react';
import { useTheme } from 'next-themes';

export default function SettingsPage() {
  const { user } = useUser();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'appearance' | 'email'>('profile');
  const [saved, setSaved] = useState(false);

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

  const handleSave = () => {
    // In a real app, this would save to the backend
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'email', label: 'Email Settings', icon: Mail },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Manage your account preferences
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="md:w-48 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-medium'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
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
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Profile Settings</h2>
              
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                  {user?.imageUrl ? (
                    <img src={user.imageUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-medium text-gray-500">
                      {user?.firstName?.[0] || user?.emailAddresses[0]?.emailAddress[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {user?.fullName || 'User'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {user?.emailAddresses[0]?.emailAddress}
                  </p>
                  <button className="mt-2 text-sm text-blue-600 hover:underline">
                    Change photo
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      defaultValue={user?.firstName || ''}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      defaultValue={user?.lastName || ''}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    defaultValue={user?.emailAddresses[0]?.emailAddress || ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email is managed through your account provider</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Time Zone
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                    <option>UTC (Coordinated Universal Time)</option>
                    <option>America/New_York (Eastern Time)</option>
                    <option>America/Los_Angeles (Pacific Time)</option>
                    <option>Europe/London (British Time)</option>
                    <option>Asia/Tokyo (Japan Standard Time)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Notification Preferences</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Email Notifications</h3>
                  <div className="space-y-3">
                    {[
                      { key: 'emailTaskReminders', label: 'Task Reminders', desc: 'Get notified when tasks are due' },
                      { key: 'emailDealUpdates', label: 'Deal Updates', desc: 'Updates on deal stage changes' },
                      { key: 'emailWeeklyDigest', label: 'Weekly Digest', desc: 'Summary of your weekly activity' },
                    ].map((item) => (
                      <label key={item.key} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{item.label}</p>
                          <p className="text-xs text-gray-500">{item.desc}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={(notifications as any)[item.key]}
                          onChange={(e) => setNotifications({ ...notifications, [item.key]: e.target.checked })}
                          className="w-5 h-5 text-blue-600 rounded"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Push Notifications</h3>
                  <div className="space-y-3">
                    {[
                      { key: 'pushTaskReminders', label: 'Task Reminders', desc: 'Browser notifications for due tasks' },
                      { key: 'pushDealWon', label: 'Deal Won', desc: 'Celebrate when you win a deal' },
                      { key: 'pushNewCustomer', label: 'New Customer', desc: 'When a new customer is added' },
                    ].map((item) => (
                      <label key={item.key} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{item.label}</p>
                          <p className="text-xs text-gray-500">{item.desc}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={(notifications as any)[item.key]}
                          onChange={(e) => setNotifications({ ...notifications, [item.key]: e.target.checked })}
                          className="w-5 h-5 text-blue-600 rounded"
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
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Appearance</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Theme</h3>
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
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <option.icon className={`w-6 h-6 ${theme === option.value ? 'text-blue-600' : 'text-gray-400'}`} />
                        <span className={`text-sm font-medium ${theme === option.value ? 'text-blue-600' : 'text-gray-600 dark:text-gray-400'}`}>
                          {option.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Display Density</h3>
                  <div className="flex gap-4">
                    {['Comfortable', 'Compact'].map((density) => (
                      <label key={density} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="density"
                          defaultChecked={density === 'Comfortable'}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{density}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Email Settings */}
          {activeTab === 'email' && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Email Settings</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email Signature
                  </label>
                  <textarea
                    value={emailSettings.signature}
                    onChange={(e) => setEmailSettings({ ...emailSettings, signature: e.target.value })}
                    placeholder="Best regards,&#10;Your Name&#10;Company Name"
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">This will be added to the end of your emails</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Default CC
                  </label>
                  <input
                    type="email"
                    value={emailSettings.defaultCc}
                    onChange={(e) => setEmailSettings({ ...emailSettings, defaultCc: e.target.value })}
                    placeholder="colleague@company.com"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 mt-1">Optionally CC someone on all outgoing emails</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Reply-To Address
                  </label>
                  <input
                    type="email"
                    value={emailSettings.replyTo}
                    onChange={(e) => setEmailSettings({ ...emailSettings, replyTo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
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
        </div>
      </div>
    </div>
  );
}
