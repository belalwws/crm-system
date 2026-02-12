"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  GitBranch,
  Plus,
  Play,
  Pause,
  Trash2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Zap,
  Users,
  Briefcase,
  Bell,
} from "lucide-react";
import { Card, CardHeader, Badge, Modal, Button, Input, Select, PageLoading, EmptyState } from "@/components/ui";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useConfirmDialog } from "@/components/ui/use-confirm-dialog";

interface WorkflowRule {
  id: string;
  name: string;
  description: string | null;
  trigger: string;
  conditions: any;
  actions: any[];
  isActive: boolean;
  createdAt: string;
  _count?: { logs: number };
}

interface WorkflowLog {
  id: string;
  status: string;
  result: any;
  error: string | null;
  executedAt: string;
}

const TRIGGERS = [
  { value: "DEAL_CREATED", label: "Deal Created", icon: Briefcase },
  { value: "DEAL_STAGE_CHANGED", label: "Deal Stage Changed", icon: Briefcase },
  { value: "CUSTOMER_CREATED", label: "Customer Created", icon: Users },
  { value: "CUSTOMER_STATUS_CHANGED", label: "Customer Status Changed", icon: Users },
  { value: "TASK_OVERDUE", label: "Task Overdue", icon: Clock },
  { value: "TASK_COMPLETED", label: "Task Completed", icon: CheckCircle2 },
];

const ACTION_TYPES = [
  { value: "CREATE_TASK", label: "Create Task" },
  { value: "SEND_NOTIFICATION", label: "Send Notification" },
  { value: "UPDATE_FIELD", label: "Update Field" },
  { value: "MOVE_STAGE", label: "Move Stage" },
  { value: "ASSIGN_TO", label: "Assign To" },
];

export default function WorkflowsPage() {
  const { getToken } = useAuth();
  const { addToast } = useToast();
  const { confirm, dialogProps } = useConfirmDialog();
  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState<WorkflowRule[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [expandedRule, setExpandedRule] = useState<string | null>(null);
  const [logs, setLogs] = useState<Record<string, WorkflowLog[]>>({});
  const [logsLoading, setLogsLoading] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formTrigger, setFormTrigger] = useState("DEAL_CREATED");
  const [formActions, setFormActions] = useState<any[]>([{ type: "SEND_NOTIFICATION", config: { message: "" } }]);
  const [saving, setSaving] = useState(false);

  const initApi = useCallback(async () => {
    const token = await getToken();
    if (token) api.setToken(token);
    return token;
  }, [getToken]);

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      await initApi();
      const res = await api.getWorkflowRules();
      setRules((res.data as WorkflowRule[]) || []);
    } catch (err) {
      console.error("Failed to fetch workflows:", err);
    } finally {
      setLoading(false);
    }
  }, [initApi]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const handleCreate = async () => {
    if (!formName.trim()) return;
    setSaving(true);
    try {
      await initApi();
      await api.createWorkflowRule({
        name: formName,
        description: formDescription || undefined,
        trigger: formTrigger,
        conditions: {},
        actions: formActions,
      });
      addToast({ type: "success", title: "Workflow rule created" });
      setShowCreate(false);
      setFormName("");
      setFormDescription("");
      setFormTrigger("DEAL_CREATED");
      setFormActions([{ type: "SEND_NOTIFICATION", config: { message: "" } }]);
      fetchRules();
    } catch (err: any) {
      addToast({ type: "error", title: err.message || "Failed to create workflow" });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await initApi();
      await api.toggleWorkflowRule(id);
      setRules((prev) =>
        prev.map((r) => (r.id === id ? { ...r, isActive: !isActive } : r))
      );
      addToast({ type: "success", title: `Workflow ${isActive ? "paused" : "activated"}` });
    } catch (err: any) {
      addToast({ type: "error", title: err.message || "Failed to toggle workflow" });
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({ title: 'Delete Workflow', message: 'Delete this workflow rule?', variant: 'danger', confirmLabel: 'Delete' });
    if (!ok) return;
    try {
      await initApi();
      await api.deleteWorkflowRule(id);
      setRules((prev) => prev.filter((r) => r.id !== id));
      addToast({ type: "success", title: "Workflow deleted" });
    } catch (err: any) {
      addToast({ type: "error", title: err.message || "Failed to delete workflow" });
    }
  };

  const fetchLogs = async (ruleId: string) => {
    if (logs[ruleId]) return;
    setLogsLoading(ruleId);
    try {
      await initApi();
      const res = await api.getWorkflowLogs(ruleId);
      setLogs((prev) => ({ ...prev, [ruleId]: (res.data as WorkflowLog[]) || [] }));
    } catch (err) {
      console.error("Failed to fetch logs:", err);
    } finally {
      setLogsLoading(null);
    }
  };

  const toggleExpand = (ruleId: string) => {
    if (expandedRule === ruleId) {
      setExpandedRule(null);
    } else {
      setExpandedRule(ruleId);
      fetchLogs(ruleId);
    }
  };

  if (loading) return <PageLoading />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Workflow Automation</h1>
          <p className="text-sm text-neutral-500 mt-1">Automate actions based on CRM events</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Rule
        </Button>
      </div>

      {/* Rules list */}
      {rules.length === 0 ? (
        <EmptyState
          title="No workflow rules"
          description="Create your first automation rule to streamline your workflow"
          action={{ label: "Create Rule", onClick: () => setShowCreate(true) }}
        />
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => {
            const triggerInfo = TRIGGERS.find((t) => t.value === rule.trigger);
            const isExpanded = expandedRule === rule.id;

            return (
              <Card key={rule.id}>
                <div className="p-4">
                  {/* Rule header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <button
                        onClick={() => toggleExpand(rule.id)}
                        className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-neutral-500" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-neutral-500" />
                        )}
                      </button>

                      <div className={`p-2 rounded-lg ${rule.isActive ? "bg-green-50 dark:bg-green-900/20" : "bg-neutral-100 dark:bg-neutral-800"}`}>
                        <Zap className={`w-4 h-4 ${rule.isActive ? "text-green-600" : "text-neutral-400"}`} />
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                          {rule.name}
                        </p>
                        {rule.description && (
                          <p className="text-xs text-neutral-500 truncate">{rule.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400">
                        {triggerInfo?.label || rule.trigger}
                      </span>

                      <span className={`text-xs px-2 py-1 rounded-full ${
                        rule.isActive
                          ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                          : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800"
                      }`}>
                        {rule.isActive ? "Active" : "Paused"}
                      </span>

                      {rule._count && (
                        <span className="text-xs text-neutral-500">{rule._count.logs} runs</span>
                      )}

                      <button
                        onClick={() => handleToggle(rule.id, rule.isActive)}
                        className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                        title={rule.isActive ? "Pause" : "Activate"}
                      >
                        {rule.isActive ? (
                          <Pause className="w-4 h-4 text-neutral-500" />
                        ) : (
                          <Play className="w-4 h-4 text-neutral-500" />
                        )}
                      </button>

                      <button
                        onClick={() => handleDelete(rule.id)}
                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-neutral-400 hover:text-red-500" />
                      </button>
                    </div>
                  </div>

                  {/* Actions summary */}
                  <div className="mt-3 ml-10 flex flex-wrap gap-2">
                    {(Array.isArray(rule.actions) ? rule.actions : []).map((action: any, i: number) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                      >
                        {ACTION_TYPES.find((a) => a.value === action.type)?.label || action.type}
                      </span>
                    ))}
                  </div>

                  {/* Expanded: Logs */}
                  {isExpanded && (
                    <div className="mt-4 ml-10 border-t border-neutral-200 dark:border-neutral-700 pt-4">
                      <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">
                        Execution History
                      </h4>
                      {logsLoading === rule.id ? (
                        <div className="flex items-center gap-2 text-sm text-neutral-500">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Loading...
                        </div>
                      ) : (logs[rule.id] || []).length === 0 ? (
                        <p className="text-sm text-neutral-500">No executions yet</p>
                      ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {(logs[rule.id] || []).slice(0, 20).map((log) => (
                            <div
                              key={log.id}
                              className="flex items-center justify-between text-sm p-2 rounded-lg bg-neutral-50 dark:bg-neutral-800/50"
                            >
                              <div className="flex items-center gap-2">
                                {log.status === "SUCCESS" ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                                ) : log.status === "FAILED" ? (
                                  <XCircle className="w-3.5 h-3.5 text-red-500" />
                                ) : (
                                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                                )}
                                <span className="text-neutral-700 dark:text-neutral-300">
                                  {log.status}
                                </span>
                                {log.error && (
                                  <span className="text-xs text-red-500 truncate max-w-xs">{log.error}</span>
                                )}
                              </div>
                              <span className="text-xs text-neutral-500">
                                {new Date(log.executedAt).toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreate}
        title="Create Workflow Rule"
        onClose={() => setShowCreate(false)}
      >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Name *
              </label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g., Notify on deal won"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Description
              </label>
              <Input
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Optional description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Trigger Event
              </label>
              <select
                value={formTrigger}
                onChange={(e) => setFormTrigger(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg text-sm text-neutral-900 dark:text-white"
              >
                {TRIGGERS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Actions
              </label>
              {formActions.map((action, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <select
                    value={action.type}
                    onChange={(e) => {
                      const updated = [...formActions];
                      updated[i] = { ...updated[i], type: e.target.value };
                      setFormActions(updated);
                    }}
                    className="flex-1 px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg text-sm text-neutral-900 dark:text-white"
                  >
                    {ACTION_TYPES.map((a) => (
                      <option key={a.value} value={a.value}>
                        {a.label}
                      </option>
                    ))}
                  </select>
                  {formActions.length > 1 && (
                    <button
                      onClick={() => setFormActions(formActions.filter((_, idx) => idx !== i))}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => setFormActions([...formActions, { type: "SEND_NOTIFICATION", config: {} }])}
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                + Add action
              </button>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-neutral-200 dark:border-neutral-700">
              <Button variant="secondary" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={saving || !formName.trim()}>
                {saving ? "Creating..." : "Create Rule"}
              </Button>
            </div>
          </div>
        </Modal>
      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
