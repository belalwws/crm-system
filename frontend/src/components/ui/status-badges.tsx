'use client';

const stageConfig: Record<string, { bg: string; text: string; label: string }> = {
  LEAD: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', label: 'Lead' },
  QUALIFIED: { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-700 dark:text-indigo-400', label: 'Qualified' },
  PROPOSAL: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400', label: 'Proposal' },
  NEGOTIATION: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', label: 'Negotiation' },
  CLOSED_WON: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', label: 'Won' },
  CLOSED_LOST: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', label: 'Lost' },
};

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
  LEAD: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', label: 'Lead' },
  ACTIVE: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', label: 'Active' },
  INACTIVE: { bg: 'bg-neutral-100 dark:bg-neutral-800', text: 'text-neutral-700 dark:text-neutral-400', label: 'Inactive' },
};

const priorityConfig: Record<string, { bg: string; text: string; label: string }> = {
  LOW: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', label: 'Low' },
  MEDIUM: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', label: 'Medium' },
  HIGH: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', label: 'High' },
};

const roleConfig: Record<string, { bg: string; text: string }> = {
  ADMIN: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400' },
  MANAGER: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400' },
  USER: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400' },
};

interface BadgeProps {
  value: string;
  className?: string;
}

export function StageBadge({ value, className = '' }: BadgeProps) {
  const config = stageConfig[value] || { bg: 'bg-neutral-100 dark:bg-neutral-800', text: 'text-neutral-700 dark:text-neutral-400', label: value };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text} ${className}`}>
      {config.label}
    </span>
  );
}

export function StatusBadge({ value, className = '' }: BadgeProps) {
  const config = statusConfig[value] || { bg: 'bg-neutral-100 dark:bg-neutral-800', text: 'text-neutral-700 dark:text-neutral-400', label: value };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text} ${className}`}>
      {config.label}
    </span>
  );
}

export function PriorityBadge({ value, className = '' }: BadgeProps) {
  const config = priorityConfig[value] || { bg: 'bg-neutral-100 dark:bg-neutral-800', text: 'text-neutral-700 dark:text-neutral-400', label: value };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text} ${className}`}>
      {config.label}
    </span>
  );
}

export function RoleBadge({ value, className = '' }: BadgeProps) {
  const config = roleConfig[value] || roleConfig.USER;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text} ${className}`}>
      {value}
    </span>
  );
}
