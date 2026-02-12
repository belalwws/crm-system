import { create } from 'zustand';
import { api } from './api';
import type { Notification, DashboardStats } from './types';

// ===========================
// Notification Store
// ===========================
interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addNotification: (notification: Notification) => void;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const data = await api.getNotifications();
      const notifications = (Array.isArray(data.data) ? data.data : []) as Notification[];
      set({
        notifications,
        unreadCount: notifications.filter((n: Notification) => !n.isRead).length,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  markAsRead: async (id: string) => {
    try {
      await api.markNotificationRead(id);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch {
      // silent
    }
  },

  markAllAsRead: async () => {
    try {
      await api.markAllNotificationsRead();
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));
    } catch {
      // silent
    }
  },

  addNotification: (notification: Notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },
}));

// ===========================
// Dashboard Stats Store
// ===========================
interface DashboardStore {
  stats: DashboardStats | null;
  isLoading: boolean;
  lastFetched: number | null;
  fetchStats: (force?: boolean) => Promise<void>;
}

export const useDashboardStore = create<DashboardStore>((set, get) => ({
  stats: null,
  isLoading: false,
  lastFetched: null,

  fetchStats: async (force = false) => {
    const { lastFetched, isLoading } = get();
    // Cache for 2 minutes unless forced
    if (!force && lastFetched && Date.now() - lastFetched < 120000 && !isLoading) {
      return;
    }

    set({ isLoading: true });
    try {
      const data = await api.getDashboardStats();
      set({
        stats: data.data as DashboardStats,
        isLoading: false,
        lastFetched: Date.now(),
      });
    } catch {
      set({ isLoading: false });
    }
  },
}));

// ===========================
// UI Store (theme, sidebar, modals)
// ===========================
interface UIStore {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  globalSearch: string;
  setGlobalSearch: (search: string) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  globalSearch: '',
  setGlobalSearch: (search) => set({ globalSearch: search }),
}));
