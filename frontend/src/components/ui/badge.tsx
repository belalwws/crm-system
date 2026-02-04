"use client";

import { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "neutral";
  size?: "sm" | "md";
}

const variantClasses = {
  default: "bg-neutral-700/50 text-neutral-300",
  success: "bg-emerald-500/20 text-emerald-400",
  warning: "bg-amber-500/20 text-amber-400",
  danger: "bg-red-500/20 text-red-400",
  info: "bg-blue-500/20 text-blue-400",
  neutral: "bg-neutral-500/20 text-neutral-400",
};

const sizeClasses = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-3 py-1 text-sm",
};

export function Badge({ children, variant = "default", size = "md" }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center font-medium rounded-full
        ${variantClasses[variant]}
        ${sizeClasses[size]}
      `}
    >
      {children}
    </span>
  );
}

// Status badge with dot indicator
interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

const statusConfig: Record<string, { bg: string; dot: string; text: string }> = {
  active: { bg: "bg-emerald-500/10", dot: "bg-emerald-500", text: "text-emerald-400" },
  inactive: { bg: "bg-neutral-500/10", dot: "bg-neutral-500", text: "text-neutral-400" },
  lead: { bg: "bg-blue-500/10", dot: "bg-blue-500", text: "text-blue-400" },
  pending: { bg: "bg-amber-500/10", dot: "bg-amber-500", text: "text-amber-400" },
  "in-progress": { bg: "bg-blue-500/10", dot: "bg-blue-500", text: "text-blue-400" },
  completed: { bg: "bg-emerald-500/10", dot: "bg-emerald-500", text: "text-emerald-400" },
  cancelled: { bg: "bg-neutral-500/10", dot: "bg-neutral-500", text: "text-neutral-400" },
  qualified: { bg: "bg-blue-500/10", dot: "bg-blue-500", text: "text-blue-400" },
  proposal: { bg: "bg-amber-500/10", dot: "bg-amber-500", text: "text-amber-400" },
  negotiation: { bg: "bg-orange-500/10", dot: "bg-orange-500", text: "text-orange-400" },
  "closed-won": { bg: "bg-emerald-500/10", dot: "bg-emerald-500", text: "text-emerald-400" },
  "closed-lost": { bg: "bg-red-500/10", dot: "bg-red-500", text: "text-red-400" },
  low: { bg: "bg-neutral-500/10", dot: "bg-neutral-500", text: "text-neutral-400" },
  medium: { bg: "bg-amber-500/10", dot: "bg-amber-500", text: "text-amber-400" },
  high: { bg: "bg-red-500/10", dot: "bg-red-500", text: "text-red-400" },
};

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const config = statusConfig[status.toLowerCase()] || statusConfig.inactive;

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 font-medium rounded-full capitalize
        ${config.bg} ${config.text}
        ${sizeClasses[size]}
      `}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {status.replace("-", " ")}
    </span>
  );
}
