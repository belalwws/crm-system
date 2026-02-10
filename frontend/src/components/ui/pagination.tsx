'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({ page, totalPages, onPageChange, className = '' }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className={`flex items-center justify-between px-4 py-3 border-t border-neutral-200 dark:border-neutral-800 ${className}`}>
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        Page {page} of {totalPages}
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-40 text-neutral-600 dark:text-neutral-400"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-40 text-neutral-600 dark:text-neutral-400"
          aria-label="Next page"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

export default Pagination;
