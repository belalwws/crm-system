interface LoadingProps {
  size?: "sm" | "md" | "lg";
  text?: string;
}

const sizeClasses = {
  sm: "w-5 h-5 border-2",
  md: "w-8 h-8 border-2",
  lg: "w-12 h-12 border-3",
};

export function Loading({ size = "md", text }: LoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div
        className={`
          ${sizeClasses[size]}
          border-neutral-700 border-t-white
          rounded-full animate-spin
        `}
      />
      {text && <p className="text-sm text-neutral-500">{text}</p>}
    </div>
  );
}

export function PageLoading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loading size="lg" text="Loading..." />
    </div>
  );
}

export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <tr className="border-b border-neutral-800">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-6 py-4">
          <div className="h-4 bg-neutral-800 rounded animate-pulse" />
        </td>
      ))}
    </tr>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-neutral-800 rounded-xl" />
        <div className="space-y-2">
          <div className="h-4 w-24 bg-neutral-800 rounded" />
          <div className="h-3 w-16 bg-neutral-800 rounded" />
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-3 bg-neutral-800 rounded w-full" />
        <div className="h-3 bg-neutral-800 rounded w-3/4" />
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <div className="h-3 w-20 bg-neutral-800 rounded" />
          <div className="h-8 w-28 bg-neutral-800 rounded" />
        </div>
        <div className="w-12 h-12 bg-neutral-800 rounded-xl" />
      </div>
    </div>
  );
}
