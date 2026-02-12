"use client";

export default function DashboardLoading() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 bg-neutral-200 dark:bg-neutral-800 rounded" />
        <div className="h-10 w-32 bg-neutral-200 dark:bg-neutral-800 rounded" />
      </div>

      {/* Stat cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-28 bg-neutral-200 dark:bg-neutral-800 rounded-xl"
          />
        ))}
      </div>

      {/* Content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-80 bg-neutral-200 dark:bg-neutral-800 rounded-xl" />
        <div className="h-80 bg-neutral-200 dark:bg-neutral-800 rounded-xl" />
      </div>
    </div>
  );
}
