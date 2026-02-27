import { useColorScheme } from 'react-native';
import { useCallback } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { Colors, SemanticColors } from './theme';
import { useAppStore } from './store';
import api from './api';

export function useThemeColors() {
  const systemScheme = useColorScheme();
  const themeSetting = useAppStore((s) => s.theme);

  const isDark =
    themeSetting === 'dark' || (themeSetting === 'system' && systemScheme === 'dark');

  return isDark ? Colors.dark : Colors.light;
}

export function useIsDark() {
  const systemScheme = useColorScheme();
  const themeSetting = useAppStore((s) => s.theme);
  return themeSetting === 'dark' || (themeSetting === 'system' && systemScheme === 'dark');
}

// Get semantic badge colors (dot, text, bg) matching frontend StatusBadge
export function useStageBadge(stage: string) {
  const isDark = useIsDark();
  const mode = isDark ? 'dark' : 'light';
  const s = SemanticColors.stage[stage as keyof typeof SemanticColors.stage];
  if (!s) return { dot: '#737373', text: isDark ? '#a3a3a3' : '#525252', bg: isDark ? 'rgba(38,38,38,0.5)' : '#f5f5f5' };
  return { dot: s.dot, text: s.text[mode], bg: s.bg[mode] };
}

export function useStatusBadge(status: string) {
  const isDark = useIsDark();
  const mode = isDark ? 'dark' : 'light';
  const s = SemanticColors.status[status as keyof typeof SemanticColors.status];
  if (!s) return { dot: '#737373', text: isDark ? '#a3a3a3' : '#525252', bg: isDark ? 'rgba(38,38,38,0.5)' : '#f5f5f5' };
  return { dot: s.dot, text: s.text[mode], bg: s.bg[mode] };
}

export function usePriorityBadge(priority: string) {
  const isDark = useIsDark();
  const mode = isDark ? 'dark' : 'light';
  const s = SemanticColors.priority[priority as keyof typeof SemanticColors.priority];
  if (!s) return { dot: '#737373', text: isDark ? '#a3a3a3' : '#525252', bg: isDark ? 'rgba(38,38,38,0.5)' : '#f5f5f5' };
  return { dot: s.dot, text: s.text[mode], bg: s.bg[mode] };
}

// Format currency
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

// Format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// Relative time
export function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString();
}

// Format date
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// Stage dot colors
export function getStageColor(stage: string): string {
  const map: Record<string, string> = {
    LEAD: '#3b82f6',
    QUALIFIED: '#3b82f6',
    PROPOSAL: '#f59e0b',
    NEGOTIATION: '#f97316',
    CLOSED_WON: '#10b981',
    CLOSED_LOST: '#ef4444',
  };
  return map[stage] || '#737373';
}

// Priority dot colors
export function getPriorityColor(priority: string): string {
  const map: Record<string, string> = {
    HIGH: '#ef4444',
    URGENT: '#ef4444',
    MEDIUM: '#f59e0b',
    LOW: '#22c55e',
  };
  return map[priority] || '#737373';
}

// Status dot colors
export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    PENDING: '#f59e0b',
    IN_PROGRESS: '#3b82f6',
    TODO: '#3b82f6',
    COMPLETED: '#10b981',
    CANCELLED: '#737373',
    ACTIVE: '#10b981',
    INACTIVE: '#737373',
    LEAD: '#3b82f6',
    PROSPECT: '#3b82f6',
  };
  return map[status] || '#737373';
}

// Truncate
export function truncate(str: string, len: number = 30): string {
  if (!str) return '';
  return str.length > len ? str.slice(0, len) + '...' : str;
}

/**
 * Hook to get an auth token that works with both Clerk and Demo mode.
 * Returns a getAuthToken function that:
 * 1. Tries Clerk's getToken() first
 * 2. Falls back to demo token from Zustand store
 * 3. Always sets the token on the API client
 */
export function useAuthToken() {
  const { getToken } = useAuth();
  const demoToken = useAppStore((s) => s.demoToken);

  const getAuthToken = useCallback(async (): Promise<string | null> => {
    let token = await getToken();
    if (!token && demoToken) {
      token = demoToken;
    }
    if (token) {
      api.setToken(token);
    }
    return token;
  }, [getToken, demoToken]);

  return { getAuthToken };
}
