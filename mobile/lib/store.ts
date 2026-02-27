// Zustand store for global state management
import { create } from 'zustand';
import type { Notification, DashboardStats } from './types';

interface DemoUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AppState {
  // Auth
  token: string | null;
  setToken: (token: string | null) => void;

  // Demo auth (local JWT, bypasses Clerk)
  demoToken: string | null;
  demoUser: DemoUser | null;
  setDemoAuth: (token: string | null, user: DemoUser | null) => void;
  clearDemoAuth: () => void;

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

  demoToken: null,
  demoUser: null,
  setDemoAuth: (demoToken, demoUser) => set({ demoToken, demoUser }),
  clearDemoAuth: () => set({ demoToken: null, demoUser: null }),

  notifications: [],
  unreadCount: 0,
  setNotifications: (notifications) => {
    const mapped = notifications.map((n: any) => ({ ...n, isRead: n.isRead ?? n.read ?? false }));
    set({ notifications: mapped, unreadCount: mapped.filter((n) => !n.isRead).length });
  },
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
