"use client";

import { Calendar, Clock, CheckCircle, AlertCircle, Edit, Trash2 } from "lucide-react";
import { Dropdown } from "@/components/ui";
import { formatDate } from "@/lib/hooks";

interface Task {
  id: string;
  title: string;
  description?: string;
  type: string;
  priority: string;
  status: string;
  dueDate?: string;
  customer?: { id: string; name: string };
  deal?: { id: string; title: string };
  createdAt: string;
}

const statusIcons: Record<string, React.ElementType> = {
  pending: Clock,
  "in-progress": AlertCircle,
  completed: CheckCircle,
  cancelled: AlertCircle,
};

const priorityColors: Record<string, string> = {
  low: "bg-neutral-500/20 text-neutral-400",
  medium: "bg-amber-500/20 text-amber-400",
  high: "bg-red-500/20 text-red-400",
};

const statusColors: Record<string, string> = {
  pending: "text-amber-400",
  "in-progress": "text-blue-400",
  completed: "text-emerald-400",
  cancelled: "text-neutral-500",
};

const statuses = [
  { value: "pending", label: "Pending" },
  { value: "in-progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export function TaskCard({
  task,
  onStatusChange,
  onEdit,
  onDelete,
}: {
  task: Task;
  onStatusChange: (id: string, status: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}) {
  const StatusIcon = statusIcons[task.status] || Clock;
  const isCompleted = task.status === "completed";
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !isCompleted;

  return (
    <div
      className={`group bg-neutral-50 dark:bg-neutral-900 rounded-xl border transition-all hover:border-neutral-300 dark:hover:border-neutral-700 ${
        isOverdue ? "border-red-500/30" : "border-neutral-200 dark:border-neutral-800"
      }`}
    >
      <div className="p-4">
        <div className="flex items-start gap-4">
          <button
            onClick={() =>
              onStatusChange(task.id, isCompleted ? "pending" : "completed")
            }
            className={`mt-1 p-1 rounded-full transition-colors ${statusColors[task.status]} hover:bg-neutral-100 dark:hover:bg-neutral-800`}
          >
            <StatusIcon className="w-5 h-5" />
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3
                  className={`font-medium ${
                    isCompleted ? "text-neutral-500 line-through" : "text-neutral-900 dark:text-white"
                  }`}
                >
                  {task.title}
                </h3>
                {task.description && (
                  <p className="text-sm text-neutral-500 mt-1 line-clamp-2">
                    {task.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${priorityColors[task.priority]}`}>
                  {task.priority}
                </span>
                <Dropdown
                  items={[
                    { label: "Edit", icon: <Edit className="w-4 h-4" />, onClick: () => onEdit(task) },
                    { label: "Delete", icon: <Trash2 className="w-4 h-4" />, onClick: () => onDelete(task.id), danger: true },
                  ]}
                />
              </div>
            </div>

            <div className="flex items-center flex-wrap gap-3 mt-3 text-sm">
              <span className="text-neutral-500 capitalize bg-neutral-100 dark:bg-neutral-800/50 px-2 py-0.5 rounded">
                {task.type.replace("-", " ")}
              </span>
              
              {task.dueDate && (
                <div className={`flex items-center gap-1 ${isOverdue ? "text-red-400" : "text-neutral-500"}`}>
                  <Calendar className="w-4 h-4" />
                  {formatDate(task.dueDate)}
                  {isOverdue && <span className="text-xs">(Overdue)</span>}
                </div>
              )}
              
              {task.customer && (
                <span className="text-blue-400">{task.customer.name}</span>
              )}
              
              {task.deal && (
                <span className="text-emerald-400">{task.deal.title}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Status Actions */}
      <div className="border-t border-neutral-200 dark:border-neutral-800 px-4 py-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {statuses.map((status) => (
          <button
            key={status.value}
            onClick={() => onStatusChange(task.id, status.value)}
            className={`text-xs px-2 py-1 rounded-md transition-colors ${
              task.status === status.value
                ? "bg-white text-neutral-900"
                : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
            }`}
          >
            {status.label}
          </button>
        ))}
      </div>
    </div>
  );
}
