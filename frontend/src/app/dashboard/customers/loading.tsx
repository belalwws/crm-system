"use client";

export default function CustomersLoading() {
  return (
    <div className="p-6 space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 w-40 bg-neutral-200 dark:bg-neutral-800 rounded" />
        <div className="h-10 w-36 bg-neutral-200 dark:bg-neutral-800 rounded" />
      </div>
      <div className="flex gap-3">
        <div className="h-10 w-64 bg-neutral-200 dark:bg-neutral-800 rounded" />
        <div className="h-10 w-32 bg-neutral-200 dark:bg-neutral-800 rounded" />
      </div>
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
            <div className="h-4 w-4 bg-neutral-200 dark:bg-neutral-800 rounded" />
            <div className="h-10 w-10 bg-neutral-200 dark:bg-neutral-800 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-40 bg-neutral-200 dark:bg-neutral-800 rounded" />
              <div className="h-3 w-56 bg-neutral-200 dark:bg-neutral-800 rounded" />
            </div>
            <div className="h-6 w-16 bg-neutral-200 dark:bg-neutral-800 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
