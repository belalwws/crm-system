"use client";

import { ReactNode } from "react";

interface TableProps {
  children: ReactNode;
}

export function Table({ children }: TableProps) {
  return (
    <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          {children}
        </table>
      </div>
    </div>
  );
}

interface TableHeaderProps {
  children: ReactNode;
}

export function TableHeader({ children }: TableHeaderProps) {
  return (
    <thead className="border-b border-neutral-800 bg-neutral-900/50">
      <tr>{children}</tr>
    </thead>
  );
}

interface TableHeadProps {
  children: ReactNode;
  className?: string;
  align?: "left" | "center" | "right";
}

export function TableHead({ children, className = "", align = "left" }: TableHeadProps) {
  const alignClass = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  }[align];

  return (
    <th
      className={`px-6 py-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider ${alignClass} ${className}`}
    >
      {children}
    </th>
  );
}

interface TableBodyProps {
  children: ReactNode;
}

export function TableBody({ children }: TableBodyProps) {
  return <tbody className="divide-y divide-neutral-800">{children}</tbody>;
}

interface TableRowProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function TableRow({ children, onClick, className = "" }: TableRowProps) {
  return (
    <tr
      className={`hover:bg-neutral-800/50 transition-colors ${onClick ? "cursor-pointer" : ""} ${className}`}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

interface TableCellProps {
  children: ReactNode;
  className?: string;
  align?: "left" | "center" | "right";
}

export function TableCell({ children, className = "", align = "left" }: TableCellProps) {
  const alignClass = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  }[align];

  return (
    <td className={`px-6 py-4 ${alignClass} ${className}`}>
      {children}
    </td>
  );
}
