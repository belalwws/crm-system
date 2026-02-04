"use client";

import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

const paddingClasses = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export function Card({ children, className = "", hover = false, padding = "md" }: CardProps) {
  return (
    <div
      className={`
        bg-neutral-900 rounded-2xl border border-neutral-800
        ${hover ? "hover:border-neutral-700 transition-colors cursor-pointer" : ""}
        ${paddingClasses[padding]}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  iconBg?: string;
  action?: ReactNode;
}

export function CardHeader({ title, subtitle, icon, iconBg = "bg-blue-600/20", action }: CardHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-3">
        {icon && (
          <div className={`p-2.5 rounded-xl ${iconBg}`}>
            {icon}
          </div>
        )}
        <div>
          <h3 className="font-semibold text-white">{title}</h3>
          {subtitle && <p className="text-sm text-neutral-500">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  change?: { value: number; type: "increase" | "decrease" };
  icon: ReactNode;
  iconBg: string;
}

export function StatCard({ title, value, change, icon, iconBg }: StatCardProps) {
  return (
    <Card className="relative overflow-hidden group">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-neutral-500">{title}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
          {change && (
            <p
              className={`text-sm font-medium ${
                change.type === "increase" ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {change.type === "increase" ? "+" : "-"}{Math.abs(change.value)}%
              <span className="text-neutral-500 ml-1">vs last month</span>
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${iconBg} transition-transform group-hover:scale-110`}>
          {icon}
        </div>
      </div>
      {/* Decorative gradient */}
      <div className={`absolute -bottom-10 -right-10 w-32 h-32 ${iconBg} opacity-20 blur-3xl rounded-full`} />
    </Card>
  );
}
