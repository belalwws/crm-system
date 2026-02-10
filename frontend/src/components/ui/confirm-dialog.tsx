'use client';

import { AlertTriangle, X } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onCancel();
      };
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [open, onCancel]);

  if (!open) return null;

  const variantStyles = {
    danger: {
      icon: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30',
      button: 'bg-red-600 hover:bg-red-700 text-white',
    },
    warning: {
      icon: 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30',
      button: 'bg-amber-600 hover:bg-amber-700 text-white',
    },
    info: {
      icon: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30',
      button: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
  };

  const style = variantStyles[variant];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        className="relative bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xl max-w-md w-full mx-4 p-6"
      >
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-white rounded"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${style.icon}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 id="confirm-title" className="text-lg font-semibold text-neutral-900 dark:text-white">
              {title}
            </h3>
            <p id="confirm-message" className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              {message}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${style.button}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
