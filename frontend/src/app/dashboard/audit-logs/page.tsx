"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  Shield,
  Search,
  Filter,
  Clock,
  User,
  FileText,
  Briefcase,
  Users,
  CheckSquare,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";
import { Card, CardHeader, Badge, PageLoading, Input, EmptyState } from "@/components/ui";
import { api } from "@/lib/api";

interface AuditLogEntry {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  changes: any;
  metadata: any;
  createdAt: string;
  user?: { name: string | null; email: string };
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400",
  UPDATE: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
  DELETE: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400",
  RESTORE: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
  MERGE: "bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400",
  TOGGLE: "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400",
};

const ENTITY_ICONS: Record<string, any> = {
  CUSTOMER: Users,
  DEAL: Briefcase,
  TASK: CheckSquare,
  WORKFLOW: FileText,
  WEBHOOK: FileText,
};

export default function AuditLogsPage() {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  // Filters
  const [entityType, setEntityType] = useState("");
  const [action, setAction] = useState("");

  const initApi = useCallback(async () => {
    const token = await getToken();
    if (token) api.setToken(token);
    return token;
  }, [getToken]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      await initApi();
      const params: any = { page, limit: 30 };
      if (entityType) params.entityType = entityType;
      if (action) params.action = action;
      const res = await api.getAuditLogs(params);
      const resData = res.data as any;
      setLogs(resData?.logs || resData || []);
      setTotalPages(resData?.totalPages || 1);
    } catch (err) {
      console.error("Failed to fetch audit logs:", err);
    } finally {
      setLoading(false);
    }
  }, [initApi, page, entityType, action]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const formatChanges = (changes: any) => {
    if (!changes || typeof changes !== "object") return null;
    const entries = Object.entries(changes);
    if (entries.length === 0) return null;

    return (
      <div className="space-y-1">
        {entries.map(([field, change]: [string, any]) => (
          <div key={field} className="flex items-start gap-2 text-xs">
            <span className="text-neutral-500 font-medium min-w-[80px]">{field}:</span>
            {typeof change === "object" && change !== null && ("from" in change || "to" in change) ? (
              <div className="flex items-center gap-1">
                <span className="text-red-500 line-through">{String(change.from ?? "—")}</span>
                <span className="text-neutral-400">→</span>
                <span className="text-green-600">{String(change.to ?? "—")}</span>
              </div>
            ) : (
              <span className="text-neutral-700 dark:text-neutral-300">{JSON.stringify(change)}</span>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Audit Logs</h1>
          <p className="text-sm text-neutral-500 mt-1">Track all changes across your CRM</p>
        </div>
        <button
          onClick={fetchLogs}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-neutral-100 dark:bg-neutral-800 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <select
          value={entityType}
          onChange={(e) => { setEntityType(e.target.value); setPage(1); }}
          className="px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg text-sm text-neutral-900 dark:text-white"
        >
          <option value="">All Entities</option>
          <option value="CUSTOMER">Customers</option>
          <option value="DEAL">Deals</option>
          <option value="TASK">Tasks</option>
          <option value="WORKFLOW">Workflows</option>
          <option value="WEBHOOK">Webhooks</option>
        </select>

        <select
          value={action}
          onChange={(e) => { setAction(e.target.value); setPage(1); }}
          className="px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg text-sm text-neutral-900 dark:text-white"
        >
          <option value="">All Actions</option>
          <option value="CREATE">Create</option>
          <option value="UPDATE">Update</option>
          <option value="DELETE">Delete</option>
          <option value="RESTORE">Restore</option>
          <option value="MERGE">Merge</option>
        </select>
      </div>

      {/* Logs */}
      {loading ? (
        <PageLoading />
      ) : logs.length === 0 ? (
        <EmptyState
          title="No audit logs"
          description="Audit logs will appear here as you make changes to your CRM data"
        />
      ) : (
        <Card>
          <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
            {logs.map((log) => {
              const EntityIcon = ENTITY_ICONS[log.entityType] || FileText;
              const isExpanded = expandedLog === log.id;

              return (
                <div key={log.id} className="p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 mt-0.5">
                        <EntityIcon className="w-4 h-4 text-neutral-500" />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            ACTION_COLORS[log.action] || "bg-neutral-100 text-neutral-600"
                          }`}>
                            {log.action}
                          </span>
                          <span className="text-sm text-neutral-900 dark:text-white font-medium">
                            {log.entityType}
                          </span>
                          <span className="text-xs text-neutral-400 font-mono">
                            {log.entityId.substring(0, 8)}…
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mt-1">
                          <User className="w-3 h-3 text-neutral-400" />
                          <span className="text-xs text-neutral-500">
                            {log.user?.name || log.user?.email || "System"}
                          </span>
                          <Clock className="w-3 h-3 text-neutral-400 ml-2" />
                          <span className="text-xs text-neutral-500">
                            {new Date(log.createdAt).toLocaleString()}
                          </span>
                        </div>

                        {/* Expanded changes */}
                        {isExpanded && log.changes && (
                          <div className="mt-3 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                            <h5 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">
                              Changes
                            </h5>
                            {formatChanges(log.changes)}
                          </div>
                        )}
                      </div>
                    </div>

                    {log.changes && Object.keys(log.changes).length > 0 && (
                      <button
                        onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                        className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                        title="View changes"
                      >
                        <Eye className={`w-4 h-4 ${isExpanded ? "text-indigo-500" : "text-neutral-400"}`} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200 dark:border-neutral-700">
              <span className="text-sm text-neutral-500">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
