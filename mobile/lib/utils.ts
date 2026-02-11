import { useColorScheme } from 'react-native';
import { Colors } from './theme';
import { useAppStore } from './store';

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

// Format currency
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
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

// Stage colors
export function getStageColor(stage: string): string {
  const map: Record<string, string> = {
    LEAD: '#6366f1',
    QUALIFIED: '#3b82f6',
    PROPOSAL: '#f59e0b',
    NEGOTIATION: '#f97316',
    CLOSED_WON: '#22c55e',
    CLOSED_LOST: '#ef4444',
  };
  return map[stage] || '#94a3b8';
}

// Priority colors
export function getPriorityColor(priority: string): string {
  const map: Record<string, string> = {
    HIGH: '#ef4444',
    MEDIUM: '#f59e0b',
    LOW: '#22c55e',
  };
  return map[priority] || '#94a3b8';
}

// Status colors
export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    PENDING: '#f59e0b',
    IN_PROGRESS: '#3b82f6',
    COMPLETED: '#22c55e',
    CANCELLED: '#94a3b8',
    ACTIVE: '#22c55e',
    INACTIVE: '#94a3b8',
    LEAD: '#6366f1',
  };
  return map[status] || '#94a3b8';
}

// Truncate
export function truncate(str: string, len: number = 30): string {
  if (!str) return '';
  return str.length > len ? str.slice(0, len) + '...' : str;
}
