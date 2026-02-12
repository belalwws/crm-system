"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-8 max-w-md text-center">
        <div className="text-red-600 dark:text-red-400 text-4xl mb-4">⚠️</div>
        <h2 className="text-xl font-semibold text-red-700 dark:text-red-300 mb-2">
          Something went wrong
        </h2>
        <p className="text-sm text-red-600 dark:text-red-400 mb-6">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
        <button
          onClick={reset}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
