'use client';

import { X, Trash2, ArrowRight, UserPlus } from 'lucide-react';

interface BulkAction {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger';
}

interface BulkActionsBarProps {
  selectedCount: number;
  actions: BulkAction[];
  onClear: () => void;
}

export function BulkActionsBar({ selectedCount, actions, onClear }: BulkActionsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
      <div className="flex items-center gap-3 px-5 py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-2xl shadow-2xl border border-neutral-700 dark:border-neutral-200">
        <span className="text-sm font-medium whitespace-nowrap">
          {selectedCount} selected
        </span>
        <div className="w-px h-5 bg-neutral-600 dark:bg-neutral-300" />
        <div className="flex items-center gap-2">
          {actions.map((action, i) => (
            <button
              key={i}
              onClick={action.onClick}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                action.variant === 'danger'
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-neutral-700 dark:bg-neutral-200 hover:bg-neutral-600 dark:hover:bg-neutral-300 text-white dark:text-neutral-900'
              }`}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
        <div className="w-px h-5 bg-neutral-600 dark:bg-neutral-300" />
        <button onClick={onClear} className="p-1 rounded-lg hover:bg-neutral-700 dark:hover:bg-neutral-200 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
