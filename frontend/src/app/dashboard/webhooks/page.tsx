"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  Globe,
  Plus,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Send,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Clock,
} from "lucide-react";
import { Card, CardHeader, Badge, Modal, Button, Input, PageLoading, EmptyState } from "@/components/ui";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useConfirmDialog } from "@/components/ui/use-confirm-dialog";

interface Webhook {
  id: string;
  url: string;
  events: string[];
  secret: string;
  isActive: boolean;
  failureCount: number;
  lastTriggeredAt: string | null;
  createdAt: string;
  _count?: { logs: number };
}

interface WebhookLog {
  id: string;
  event: string;
  statusCode: number | null;
  success: boolean;
  error: string | null;
  createdAt: string;
}

const WEBHOOK_EVENTS = [
  { value: "customer.created", label: "Customer Created" },
  { value: "customer.updated", label: "Customer Updated" },
  { value: "customer.deleted", label: "Customer Deleted" },
  { value: "deal.created", label: "Deal Created" },
  { value: "deal.updated", label: "Deal Updated" },
  { value: "deal.won", label: "Deal Won" },
  { value: "deal.lost", label: "Deal Lost" },
  { value: "task.created", label: "Task Created" },
  { value: "task.completed", label: "Task Completed" },
];

export default function WebhooksPage() {
  const { getToken } = useAuth();
  const { addToast } = useToast();
  const { confirm, dialogProps } = useConfirmDialog();
  const [loading, setLoading] = useState(true);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [expandedWebhook, setExpandedWebhook] = useState<string | null>(null);
  const [logs, setLogs] = useState<Record<string, WebhookLog[]>>({});
  const [logsLoading, setLogsLoading] = useState<string | null>(null);
  const [showSecrets, setShowSecrets] = useState<Set<string>>(new Set());
  const [testing, setTesting] = useState<string | null>(null);

  // Form state
  const [formUrl, setFormUrl] = useState("");
  const [formEvents, setFormEvents] = useState<string[]>(["customer.created"]);
  const [saving, setSaving] = useState(false);

  const initApi = useCallback(async () => {
    const token = await getToken();
    if (token) api.setToken(token);
    return token;
  }, [getToken]);

  const fetchWebhooks = useCallback(async () => {
    setLoading(true);
    try {
      await initApi();
      const res = await api.getWebhooks();
      setWebhooks((res.data as Webhook[]) || []);
    } catch (err) {
      console.error("Failed to fetch webhooks:", err);
    } finally {
      setLoading(false);
    }
  }, [initApi]);

  useEffect(() => {
    fetchWebhooks();
  }, [fetchWebhooks]);

  const handleCreate = async () => {
    if (!formUrl.trim() || formEvents.length === 0) return;
    setSaving(true);
    try {
      await initApi();
      await api.createWebhook({ url: formUrl, events: formEvents });
      addToast({ type: "success", title: "Webhook created" });
      setShowCreate(false);
      setFormUrl("");
      setFormEvents(["customer.created"]);
      fetchWebhooks();
    } catch (err: any) {
      addToast({ type: "error", title: err.message || "Failed to create webhook" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({ title: 'Delete Webhook', message: 'Delete this webhook?', variant: 'danger', confirmLabel: 'Delete' });
    if (!ok) return;
    try {
      await initApi();
      await api.deleteWebhook(id);
      setWebhooks((prev) => prev.filter((w) => w.id !== id));
      addToast({ type: "success", title: "Webhook deleted" });
    } catch (err: any) {
      addToast({ type: "error", title: err.message || "Failed to delete webhook" });
    }
  };

  const handleTest = async (id: string) => {
    setTesting(id);
    try {
      await initApi();
      await api.testWebhook(id);
      addToast({ type: "success", title: "Test webhook sent" });
    } catch (err: any) {
      addToast({ type: "error", title: err.message || "Test failed" });
    } finally {
      setTesting(null);
    }
  };

  const toggleSecret = (id: string) => {
    setShowSecrets((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copySecret = (secret: string) => {
    navigator.clipboard.writeText(secret);
    addToast({ type: "success", title: "Secret copied to clipboard" });
  };

  const fetchLogs = async (webhookId: string) => {
    if (logs[webhookId]) return;
    setLogsLoading(webhookId);
    try {
      await initApi();
      const res = await api.getWebhookLogs(webhookId);
      setLogs((prev) => ({ ...prev, [webhookId]: (res.data as WebhookLog[]) || [] }));
    } catch (err) {
      console.error("Failed to fetch logs:", err);
    } finally {
      setLogsLoading(null);
    }
  };

  const toggleExpand = (webhookId: string) => {
    if (expandedWebhook === webhookId) {
      setExpandedWebhook(null);
    } else {
      setExpandedWebhook(webhookId);
      fetchLogs(webhookId);
    }
  };

  const toggleEvent = (event: string) => {
    setFormEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    );
  };

  if (loading) return <PageLoading />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Webhooks</h1>
          <p className="text-sm text-neutral-500 mt-1">Send real-time notifications to external services</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Webhook
        </Button>
      </div>

      {/* Webhooks list */}
      {webhooks.length === 0 ? (
        <EmptyState
          title="No webhooks configured"
          description="Create a webhook to send events to external services"
          action={{ label: "Create Webhook", onClick: () => setShowCreate(true) }}
        />
      ) : (
        <div className="space-y-3">
          {webhooks.map((webhook) => {
            const isExpanded = expandedWebhook === webhook.id;

            return (
              <Card key={webhook.id}>
                <div className="p-4">
                  {/* Webhook header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <button
                        onClick={() => toggleExpand(webhook.id)}
                        className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-neutral-500" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-neutral-500" />
                        )}
                      </button>

                      <div className={`p-2 rounded-lg ${
                        webhook.isActive
                          ? webhook.failureCount > 5
                            ? "bg-amber-50 dark:bg-amber-900/20"
                            : "bg-green-50 dark:bg-green-900/20"
                          : "bg-neutral-100 dark:bg-neutral-800"
                      }`}>
                        <Globe className={`w-4 h-4 ${
                          webhook.isActive
                            ? webhook.failureCount > 5
                              ? "text-amber-600"
                              : "text-green-600"
                            : "text-neutral-400"
                        }`} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-mono text-neutral-900 dark:text-white truncate">
                          {webhook.url}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            webhook.isActive
                              ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                              : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                          }`}>
                            {webhook.isActive ? "Active" : "Disabled"}
                          </span>
                          {webhook.failureCount > 0 && (
                            <span className="text-xs text-amber-600">
                              {webhook.failureCount} failures
                            </span>
                          )}
                          {webhook._count && (
                            <span className="text-xs text-neutral-500">{webhook._count.logs} deliveries</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleTest(webhook.id)}
                        disabled={testing === webhook.id}
                        className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Test webhook"
                      >
                        {testing === webhook.id ? (
                          <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4 text-neutral-500 hover:text-blue-500" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(webhook.id)}
                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-neutral-400 hover:text-red-500" />
                      </button>
                    </div>
                  </div>

                  {/* Events */}
                  <div className="mt-3 ml-10 flex flex-wrap gap-1.5">
                    {webhook.events.map((event) => (
                      <span
                        key={event}
                        className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400"
                      >
                        {event}
                      </span>
                    ))}
                  </div>

                  {/* Secret */}
                  <div className="mt-3 ml-10 flex items-center gap-2">
                    <span className="text-xs text-neutral-500">Secret:</span>
                    <code className="text-xs font-mono text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">
                      {showSecrets.has(webhook.id) ? webhook.secret : "••••••••••••••••"}
                    </code>
                    <button onClick={() => toggleSecret(webhook.id)} className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded">
                      {showSecrets.has(webhook.id) ? <EyeOff className="w-3.5 h-3.5 text-neutral-400" /> : <Eye className="w-3.5 h-3.5 text-neutral-400" />}
                    </button>
                    <button onClick={() => copySecret(webhook.secret)} className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded">
                      <Copy className="w-3.5 h-3.5 text-neutral-400" />
                    </button>
                  </div>

                  {/* Expanded: Delivery Logs */}
                  {isExpanded && (
                    <div className="mt-4 ml-10 border-t border-neutral-200 dark:border-neutral-700 pt-4">
                      <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">
                        Recent Deliveries
                      </h4>
                      {logsLoading === webhook.id ? (
                        <div className="flex items-center gap-2 text-sm text-neutral-500">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Loading...
                        </div>
                      ) : (logs[webhook.id] || []).length === 0 ? (
                        <p className="text-sm text-neutral-500">No deliveries yet</p>
                      ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {(logs[webhook.id] || []).slice(0, 20).map((log) => (
                            <div
                              key={log.id}
                              className="flex items-center justify-between text-sm p-2 rounded-lg bg-neutral-50 dark:bg-neutral-800/50"
                            >
                              <div className="flex items-center gap-2">
                                {log.success ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                                ) : (
                                  <XCircle className="w-3.5 h-3.5 text-red-500" />
                                )}
                                <span className="text-xs px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300">
                                  {log.event}
                                </span>
                                {log.statusCode && (
                                  <span className={`text-xs ${log.statusCode < 400 ? "text-green-600" : "text-red-600"}`}>
                                    {log.statusCode}
                                  </span>
                                )}
                                {log.error && (
                                  <span className="text-xs text-red-500 truncate max-w-xs">{log.error}</span>
                                )}
                              </div>
                              <span className="text-xs text-neutral-500">
                                {new Date(log.createdAt).toLocaleString()}
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
      <Modal isOpen={showCreate} title="Create Webhook" onClose={() => setShowCreate(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Endpoint URL *
              </label>
              <Input
                value={formUrl}
                onChange={(e) => setFormUrl(e.target.value)}
                placeholder="https://example.com/webhook"
                type="url"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Events *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {WEBHOOK_EVENTS.map((event) => (
                  <label
                    key={event.value}
                    className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                      formEvents.includes(event.value)
                        ? "border-indigo-300 bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-900/20"
                        : "border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formEvents.includes(event.value)}
                      onChange={() => toggleEvent(event.value)}
                      className="rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-neutral-700 dark:text-neutral-300">{event.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-neutral-200 dark:border-neutral-700">
              <Button variant="secondary" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={saving || !formUrl.trim() || formEvents.length === 0}>
                {saving ? "Creating..." : "Create Webhook"}
              </Button>
            </div>
          </div>
        </Modal>
      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
