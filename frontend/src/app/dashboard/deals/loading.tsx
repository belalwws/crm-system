"use client";

export default function DealsLoading() {
  return (
    <div className="p-6 space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 w-32 bg-neutral-200 dark:bg-neutral-800 rounded" />
        <div className="flex gap-2">
          <div className="h-10 w-24 bg-neutral-200 dark:bg-neutral-800 rounded" />
          <div className="h-10 w-36 bg-neutral-200 dark:bg-neutral-800 rounded" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-64 bg-neutral-200 dark:bg-neutral-800 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
