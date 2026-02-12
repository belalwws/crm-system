'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import api from '@/lib/api';
import { Bell, Send, Smartphone, Clock, CheckCircle, XCircle } from 'lucide-react';

interface PushLog {
  id: string;
  title: string;
  body: string;
  target: string;
  sentCount: number;
  failCount: number;
  createdAt: string;
}

export default function NotificationsPage() {
  const { getToken } = useAuth();
  const [form, setForm] = useState({ title: '', body: '', target: 'all' });
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<PushLog[]>([]);
  const [platformStats, setPlatformStats] = useState<Record<string, number>>({});
  const [totalTokens, setTotalTokens] = useState(0);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const token = await getToken();
      api.setToken(token);

      const [tokensRes, historyRes] = await Promise.all([
        api.getAdminPushTokens({ limit: 1 }),
        api.getAdminPushHistory({ limit: 20 }),
      ]);

      if (tokensRes.success) {
        setTotalTokens(tokensRes.total as number || 0);
        setPlatformStats((tokensRes as any).platformStats || {});
      }
      if (historyRes.success) {
        setHistory((historyRes.data as PushLog[]) || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.body) return;

    setSending(true);
    try {
      const token = await getToken();
      api.setToken(token);
      const res = await api.sendAdminPushNotification({
        title: form.title,
        body: form.body,
        target: form.target,
      });
      if (res.success) {
        setFeedback({ type: 'success', message: res.message || 'Notification sent!' });
        setForm({ title: '', body: '', target: 'all' });
        fetchData();
      } else {
        setFeedback({ type: 'error', message: 'Failed to send notification' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Failed to send notification' });
    } finally {
      setSending(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-neutral-200 dark:bg-neutral-800 rounded-xl" />)}
        </div>
        <div className="h-96 bg-neutral-200 dark:bg-neutral-800 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Feedback */}
      {feedback && (
        <div className={`p-3 rounded-lg text-sm font-medium ${
          feedback.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
        }`}>
          {feedback.message}
        </div>
      )}

      {/* Device Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Smartphone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">Total Devices</p>
              <p className="text-xl font-bold text-neutral-900 dark:text-white">{totalTokens}</p>
            </div>
          </div>
        </div>
        <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
              <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">Android</p>
              <p className="text-xl font-bold text-neutral-900 dark:text-white">{platformStats.android || 0}</p>
            </div>
          </div>
        </div>
        <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800">
              <Smartphone className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">iOS</p>
              <p className="text-xl font-bold text-neutral-900 dark:text-white">{platformStats.ios || 0}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Send Notification Form */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
              <Bell className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Send Push Notification</h2>
              <p className="text-sm text-neutral-500">Broadcast to mobile app users</p>
            </div>
          </div>

          <form onSubmit={handleSend} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Target</label>
              <select value={form.target} onChange={e => setForm(f => ({ ...f, target: e.target.value }))}
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white">
                <option value="all">All Users</option>
                <option value="platform:android">Android Only</option>
                <option value="platform:ios">iOS Only</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Title</label>
              <input type="text" required value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Notification title..."
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Message</label>
              <textarea required value={form.body}
                onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                placeholder="Notification message..."
                rows={4}
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
              />
            </div>
            <button type="submit" disabled={sending}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50">
              <Send className="w-4 h-4" />
              {sending ? 'Sending...' : 'Send Notification'}
            </button>
          </form>
        </div>

        {/* Notification History */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
          <h3 className="font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-neutral-400" /> Notification History
          </h3>
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {history.map(log => (
              <div key={log.id} className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-700">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-900 dark:text-white">{log.title}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">{log.body}</p>
                  </div>
                  <span className="text-xs text-neutral-400">{new Date(log.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-neutral-500">Target: {log.target}</span>
                  <span className="text-xs text-emerald-600 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> {log.sentCount} sent
                  </span>
                  {log.failCount > 0 && (
                    <span className="text-xs text-red-500 flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> {log.failCount} failed
                    </span>
                  )}
                </div>
              </div>
            ))}
            {history.length === 0 && (
              <p className="text-neutral-500 text-sm text-center py-8">No notifications sent yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
