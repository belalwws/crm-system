// Zustand store for global state management
import { create } from 'zustand';
import type { Notification, DashboardStats } from './types';

interface AppState {
  // Auth
  token: string | null;
  setToken: (token: string | null) => void;

  // Notifications
  notifications: Notification[];
  unreadCount: number;
  setNotifications: (n: Notification[]) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;

  // Dashboard cache
  dashboardStats: DashboardStats | null;
  setDashboardStats: (s: DashboardStats | null) => void;

  // Global search
  searchQuery: string;
  setSearchQuery: (q: string) => void;

  // Theme
  theme: 'light' | 'dark' | 'system';
  setTheme: (t: 'light' | 'dark' | 'system') => void;
}

export const useAppStore = create<AppState>((set) => ({
  token: null,
  setToken: (token) => set({ token }),

  notifications: [],
  unreadCount: 0,
  setNotifications: (notifications) =>
    set({ notifications, unreadCount: notifications.filter((n) => !n.isRead).length }),
  markRead: (id) =>
    set((state) => {
      const notifications = state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      );
      return { notifications, unreadCount: notifications.filter((n) => !n.isRead).length };
    }),
  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    })),

  dashboardStats: null,
  setDashboardStats: (dashboardStats) => set({ dashboardStats }),

  searchQuery: '',
  setSearchQuery: (searchQuery) => set({ searchQuery }),

  theme: 'system',
  setTheme: (theme) => set({ theme }),
}));
