// Theme constants for Nexus CRM Mobile — matches frontend web app exactly
// Frontend uses Tailwind neutral scale as primary palette

export const Colors = {
  light: {
    // Backgrounds
    background: '#fafafa',      // neutral-50
    surface: '#f5f5f5',         // neutral-100
    card: '#ffffff',             // white
    inputBg: '#ffffff',          // white (inputs in light mode)

    // Text
    text: '#171717',             // neutral-900
    textSecondary: '#737373',    // neutral-500
    textTertiary: '#a3a3a3',     // neutral-400

    // Borders
    border: '#e5e5e5',           // neutral-200

    // Primary (monochrome)
    primary: '#171717',          // neutral-900
    primaryText: '#ffffff',      // white on primary

    // Semantic
    success: '#059669',          // emerald-600
    successLight: '#ecfdf5',     // emerald-50
    successText: '#059669',      // emerald-600
    warning: '#d97706',          // amber-600
    warningLight: '#fffbeb',     // amber-50
    warningText: '#d97706',      // amber-600
    danger: '#dc2626',           // red-600
    dangerLight: '#fef2f2',      // red-50
    dangerText: '#dc2626',       // red-600
    info: '#2563eb',             // blue-600
    infoLight: '#eff6ff',        // blue-50
    infoText: '#2563eb',         // blue-600

    // Tab bar
    tabBar: '#ffffff',
    tabBarBorder: '#e5e5e5',     // neutral-200
    tabBarActive: '#171717',     // neutral-900
    tabBarInactive: '#a3a3a3',   // neutral-400

    // Skeleton
    skeleton: '#e5e5e5',         // neutral-200

    // Overlay
    overlay: 'rgba(0,0,0,0.5)',  // bg-black/50

    // Icon backgrounds
    iconBg: '#f5f5f5',           // neutral-100
  },
  dark: {
    // Backgrounds
    background: '#0a0a0a',       // neutral-950
    surface: '#171717',          // neutral-900
    card: '#171717',             // neutral-900
    inputBg: '#262626',          // neutral-800

    // Text
    text: '#ffffff',             // white
    textSecondary: '#a3a3a3',    // neutral-400
    textTertiary: '#737373',     // neutral-500

    // Borders
    border: '#262626',           // neutral-800

    // Primary (monochrome — inverted)
    primary: '#ffffff',          // white
    primaryText: '#171717',      // neutral-900 text on white button

    // Semantic
    success: '#34d399',          // emerald-400
    successLight: 'rgba(6,78,59,0.2)',   // emerald-900/20
    successText: '#34d399',      // emerald-400
    warning: '#fbbf24',          // amber-400
    warningLight: 'rgba(120,53,15,0.2)', // amber-900/20
    warningText: '#fbbf24',      // amber-400
    danger: '#f87171',           // red-400
    dangerLight: 'rgba(127,29,29,0.2)',  // red-900/20
    dangerText: '#f87171',       // red-400
    info: '#60a5fa',             // blue-400
    infoLight: 'rgba(30,58,138,0.2)',    // blue-900/20
    infoText: '#60a5fa',         // blue-400

    // Tab bar
    tabBar: '#171717',           // neutral-900
    tabBarBorder: '#262626',     // neutral-800
    tabBarActive: '#ffffff',     // white
    tabBarInactive: '#737373',   // neutral-500

    // Skeleton
    skeleton: '#262626',         // neutral-800

    // Overlay
    overlay: 'rgba(0,0,0,0.8)', // bg-black/80

    // Icon backgrounds
    iconBg: '#262626',           // neutral-800
  },
};

// Semantic color helpers for badges with dots — matching frontend StatusBadge
export const SemanticColors = {
  stage: {
    LEAD: { dot: '#3b82f6', text: { light: '#2563eb', dark: '#60a5fa' }, bg: { light: '#eff6ff', dark: 'rgba(30,58,138,0.2)' } },
    QUALIFIED: { dot: '#3b82f6', text: { light: '#2563eb', dark: '#60a5fa' }, bg: { light: '#eff6ff', dark: 'rgba(30,58,138,0.2)' } },
    PROPOSAL: { dot: '#f59e0b', text: { light: '#d97706', dark: '#fbbf24' }, bg: { light: '#fffbeb', dark: 'rgba(120,53,15,0.2)' } },
    NEGOTIATION: { dot: '#f97316', text: { light: '#ea580c', dark: '#fb923c' }, bg: { light: '#fff7ed', dark: 'rgba(154,52,18,0.2)' } },
    CLOSED_WON: { dot: '#10b981', text: { light: '#059669', dark: '#34d399' }, bg: { light: '#ecfdf5', dark: 'rgba(6,78,59,0.2)' } },
    CLOSED_LOST: { dot: '#ef4444', text: { light: '#dc2626', dark: '#f87171' }, bg: { light: '#fef2f2', dark: 'rgba(127,29,29,0.2)' } },
  },
  status: {
    ACTIVE: { dot: '#10b981', text: { light: '#059669', dark: '#34d399' }, bg: { light: '#ecfdf5', dark: 'rgba(6,78,59,0.2)' } },
    COMPLETED: { dot: '#10b981', text: { light: '#059669', dark: '#34d399' }, bg: { light: '#ecfdf5', dark: 'rgba(6,78,59,0.2)' } },
    LEAD: { dot: '#3b82f6', text: { light: '#2563eb', dark: '#60a5fa' }, bg: { light: '#eff6ff', dark: 'rgba(30,58,138,0.2)' } },
    PROSPECT: { dot: '#3b82f6', text: { light: '#2563eb', dark: '#60a5fa' }, bg: { light: '#eff6ff', dark: 'rgba(30,58,138,0.2)' } },
    IN_PROGRESS: { dot: '#3b82f6', text: { light: '#2563eb', dark: '#60a5fa' }, bg: { light: '#eff6ff', dark: 'rgba(30,58,138,0.2)' } },
    TODO: { dot: '#3b82f6', text: { light: '#2563eb', dark: '#60a5fa' }, bg: { light: '#eff6ff', dark: 'rgba(30,58,138,0.2)' } },
    PENDING: { dot: '#f59e0b', text: { light: '#d97706', dark: '#fbbf24' }, bg: { light: '#fffbeb', dark: 'rgba(120,53,15,0.2)' } },
    INACTIVE: { dot: '#737373', text: { light: '#525252', dark: '#a3a3a3' }, bg: { light: '#f5f5f5', dark: 'rgba(38,38,38,0.5)' } },
    CANCELLED: { dot: '#737373', text: { light: '#525252', dark: '#a3a3a3' }, bg: { light: '#f5f5f5', dark: 'rgba(38,38,38,0.5)' } },
  },
  priority: {
    HIGH: { dot: '#ef4444', text: { light: '#dc2626', dark: '#f87171' }, bg: { light: '#fef2f2', dark: 'rgba(127,29,29,0.2)' } },
    URGENT: { dot: '#ef4444', text: { light: '#dc2626', dark: '#f87171' }, bg: { light: '#fef2f2', dark: 'rgba(127,29,29,0.2)' } },
    MEDIUM: { dot: '#f59e0b', text: { light: '#d97706', dark: '#fbbf24' }, bg: { light: '#fffbeb', dark: 'rgba(120,53,15,0.2)' } },
    LOW: { dot: '#22c55e', text: { light: '#059669', dark: '#34d399' }, bg: { light: '#ecfdf5', dark: 'rgba(6,78,59,0.2)' } },
  },
};

// Accent colors for stat card icons (colorful accents on neutral base)
export const AccentColors = {
  indigo: '#6366f1',
  blue: '#3b82f6',
  emerald: '#10b981',
  amber: '#f59e0b',
  cyan: '#06b6d4',
  red: '#ef4444',
  violet: '#8b5cf6',
  orange: '#f97316',
  pink: '#ec4899',
  teal: '#14b8a6',
  neutral: '#737373',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const FontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  base: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 30,
  title: 34,
};

export const FontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const BorderRadius = {
  sm: 6,
  md: 8,       // rounded-lg
  lg: 12,      // rounded-xl
  xl: 16,      // rounded-2xl
  full: 9999,
};
