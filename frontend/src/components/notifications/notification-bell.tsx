'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, Check, Trash2, X } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useRealtimeNotifications } from '@/lib/socket';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

export function NotificationBell() {
  const { getToken } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const token = await getToken();
      api.setToken(token);
      const res = await api.getNotifications();
      const data = res.data as { notifications?: Notification[]; unreadCount?: number } | Notification[];
      if (Array.isArray(data)) {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.read).length);
      } else if (data && typeof data === 'object') {
        setNotifications((data as { notifications?: Notification[] }).notifications || []);
        setUnreadCount((data as { unreadCount?: number }).unreadCount || 0);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  }, [getToken]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Real-time notification updates via Socket.IO
  const handleRealtimeNotification = useCallback((notification: Notification) => {
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
  }, []);

  const tokenForSocket = useRef<string | null>(null);
  useEffect(() => {
    getToken().then(t => { tokenForSocket.current = t; });
  }, [getToken]);

  useRealtimeNotifications(tokenForSocket.current, handleRealtimeNotification);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      const token = await getToken();
      api.setToken(token);
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      api.setToken(token);
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const token = await getToken();
      api.setToken(token);
      await api.deleteNotification(id);
      const notification = notifications.find(n => n.id === id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'DEAL_WON': return '🎉';
      case 'DEAL_LOST': return '😔';
      case 'TASK_DUE': return '⏰';
      case 'TASK_ASSIGNED': return '📋';
      case 'NEW_CUSTOMER': return '👤';
      case 'REMINDER': return '🔔';
      default: return '📌';
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-neutral-600 dark:text-neutral-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-neutral-900 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-700 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
            <h3 className="font-semibold text-neutral-900 dark:text-white">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  disabled={loading}
                  className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <X className="w-4 h-4 text-neutral-500" />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-12 text-center text-neutral-500">
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors ${
                    !notification.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl">{getNotificationIcon(notification.type)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-sm text-neutral-900 dark:text-white">
                            {notification.title}
                          </p>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-0.5 line-clamp-2">
                            {notification.message}
                          </p>
                        </div>
                        <span className="text-xs text-neutral-400 whitespace-nowrap">
                          {formatTime(notification.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        {notification.link && (
                          <Link
                            href={notification.link}
                            onClick={() => {
                              if (!notification.read) markAsRead(notification.id);
                              setIsOpen(false);
                            }}
                            className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                          >
                            View details
                          </Link>
                        )}
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="text-xs text-neutral-500 hover:text-neutral-700 flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" /> Mark read
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="text-xs text-neutral-400 hover:text-red-500 flex items-center gap-1 ml-auto"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
              <Link
                href="/dashboard/notifications"
                onClick={() => setIsOpen(false)}
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
              >
                View all notifications →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
