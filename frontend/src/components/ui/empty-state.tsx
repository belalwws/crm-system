"use client";

import { ReactNode } from "react";
import { FolderOpen, Search, FileX } from "lucide-react";
import { Button } from "./button";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="p-4 bg-neutral-800/50 rounded-2xl mb-4">
        {icon || <FolderOpen className="w-8 h-8 text-neutral-500" />}
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      {description && (
        <p className="text-neutral-500 max-w-sm mb-6">{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

export function NoResults({ searchTerm }: { searchTerm?: string }) {
  return (
    <EmptyState
      icon={<Search className="w-8 h-8 text-neutral-500" />}
      title="No results found"
      description={
        searchTerm
          ? `We couldn't find anything matching "${searchTerm}". Try a different search term.`
          : "Try adjusting your filters to find what you're looking for."
      }
    />
  );
}

export function NoData({ type, onAdd }: { type: string; onAdd?: () => void }) {
  return (
    <EmptyState
      icon={<FileX className="w-8 h-8 text-neutral-500" />}
      title={`No ${type} yet`}
      description={`Get started by creating your first ${type.toLowerCase()}.`}
      action={onAdd ? { label: `Add ${type}`, onClick: onAdd } : undefined}
    />
  );
}
