"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  Bot,
  Send,
  X,
  MessageSquare,
  Sparkles,
  Loader2,
  Maximize2,
  Minimize2,
  Trash2,
  Plus,
  History,
  Pin,
  PinOff,
  Pencil,
  Check,
  ChevronLeft,
  Zap,
  CheckCircle2,
  XCircle,
  Users,
  Briefcase,
  ListTodo,
  BarChart3,
} from "lucide-react";
import api from "@/lib/api";
import { MarkdownRenderer } from "@/components/ai/markdown-renderer";

// =============================================
// Types
// =============================================

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  actionType?: string | null;
  actionResult?: ActionResult[] | null;
  createdAt: string;
}

interface ChatSession {
  id: string;
  title: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  lastMessage?: { content: string; role: string; createdAt: string } | null;
}

interface ActionResult {
  success: boolean;
  action: string;
  message: string;
  data?: any;
}

interface AIChatProps {
  isOpen: boolean;
  onClose: () => void;
  initialContext?: string;
  initialMessage?: string;
}

// =============================================
// Action Badge Component
// =============================================

function ActionBadge({ result }: { result: ActionResult }) {
  const actionIcons: Record<string, React.ReactNode> = {
    CREATE_CUSTOMER: <Users className="w-3 h-3" />,
    UPDATE_CUSTOMER: <Users className="w-3 h-3" />,
    DELETE_CUSTOMER: <Users className="w-3 h-3" />,
    LIST_CUSTOMERS: <Users className="w-3 h-3" />,
    CREATE_DEAL: <Briefcase className="w-3 h-3" />,
    UPDATE_DEAL: <Briefcase className="w-3 h-3" />,
    DELETE_DEAL: <Briefcase className="w-3 h-3" />,
    LIST_DEALS: <Briefcase className="w-3 h-3" />,
    CREATE_TASK: <ListTodo className="w-3 h-3" />,
    UPDATE_TASK: <ListTodo className="w-3 h-3" />,
    DELETE_TASK: <ListTodo className="w-3 h-3" />,
    LIST_TASKS: <ListTodo className="w-3 h-3" />,
    GET_DASHBOARD_STATS: <BarChart3 className="w-3 h-3" />,
  };

  const actionLabels: Record<string, string> = {
    CREATE_CUSTOMER: "Customer Created",
    UPDATE_CUSTOMER: "Customer Updated",
    DELETE_CUSTOMER: "Customer Deleted",
    LIST_CUSTOMERS: "Customers Listed",
    CREATE_DEAL: "Deal Created",
    UPDATE_DEAL: "Deal Updated",
    DELETE_DEAL: "Deal Deleted",
    LIST_DEALS: "Deals Listed",
    CREATE_TASK: "Task Created",
    UPDATE_TASK: "Task Updated",
    DELETE_TASK: "Task Deleted",
    LIST_TASKS: "Tasks Listed",
    GET_DASHBOARD_STATS: "Stats Retrieved",
  };

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
        result.success
          ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
          : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
      }`}
    >
      {result.success ? (
        <CheckCircle2 className="w-3 h-3" />
      ) : (
        <XCircle className="w-3 h-3" />
      )}
      {actionIcons[result.action] || <Zap className="w-3 h-3" />}
      <span>{actionLabels[result.action] || result.action}</span>
    </div>
  );
}

// =============================================
// Session Sidebar
// =============================================

function SessionSidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onPinSession,
  onRenameSession,
  isLoading,
}: {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
  onPinSession: (id: string, pinned: boolean) => void;
  onRenameSession: (id: string, title: string) => void;
  isLoading: boolean;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const startRename = (session: ChatSession) => {
    setEditingId(session.id);
    setEditTitle(session.title);
  };

  const confirmRename = () => {
    if (editingId && editTitle.trim()) {
      onRenameSession(editingId, editTitle.trim());
    }
    setEditingId(null);
  };

  const pinnedSessions = sessions.filter((s) => s.pinned);
  const regularSessions = sessions.filter((s) => !s.pinned);

  return (
    <div className="w-64 border-r border-neutral-200 dark:border-neutral-700 flex flex-col bg-neutral-50 dark:bg-neutral-900/50">
      {/* New Chat Button */}
      <div className="p-3">
        <button
          onClick={onNewSession}
          className="w-full flex items-center gap-2 px-3 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </button>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-8 px-3">
            <History className="w-8 h-8 text-neutral-300 dark:text-neutral-600 mx-auto mb-2" />
            <p className="text-xs text-neutral-400 dark:text-neutral-500">
              No conversations yet
            </p>
          </div>
        ) : (
          <>
            {/* Pinned */}
            {pinnedSessions.length > 0 && (
              <div className="mb-2">
                <div className="px-2 py-1 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                  Pinned
                </div>
                {pinnedSessions.map((session) => (
                  <SessionItem
                    key={session.id}
                    session={session}
                    isActive={session.id === activeSessionId}
                    isEditing={editingId === session.id}
                    editTitle={editTitle}
                    onEditTitleChange={setEditTitle}
                    onSelect={() => onSelectSession(session.id)}
                    onDelete={() => onDeleteSession(session.id)}
                    onPin={() => onPinSession(session.id, !session.pinned)}
                    onStartRename={() => startRename(session)}
                    onConfirmRename={confirmRename}
                  />
                ))}
              </div>
            )}

            {/* Regular */}
            {regularSessions.length > 0 && (
              <div>
                {pinnedSessions.length > 0 && (
                  <div className="px-2 py-1 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                    Recent
                  </div>
                )}
                {regularSessions.map((session) => (
                  <SessionItem
                    key={session.id}
                    session={session}
                    isActive={session.id === activeSessionId}
                    isEditing={editingId === session.id}
                    editTitle={editTitle}
                    onEditTitleChange={setEditTitle}
                    onSelect={() => onSelectSession(session.id)}
                    onDelete={() => onDeleteSession(session.id)}
                    onPin={() => onPinSession(session.id, !session.pinned)}
                    onStartRename={() => startRename(session)}
                    onConfirmRename={confirmRename}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function SessionItem({
  session,
  isActive,
  isEditing,
  editTitle,
  onEditTitleChange,
  onSelect,
  onDelete,
  onPin,
  onStartRename,
  onConfirmRename,
}: {
  session: ChatSession;
  isActive: boolean;
  isEditing: boolean;
  editTitle: string;
  onEditTitleChange: (title: string) => void;
  onSelect: () => void;
  onDelete: () => void;
  onPin: () => void;
  onStartRename: () => void;
  onConfirmRename: () => void;
}) {
  return (
    <div
      className={`group relative flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-colors mb-0.5 ${
        isActive
          ? "bg-violet-100 dark:bg-violet-900/30 text-violet-900 dark:text-violet-100"
          : "hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
      }`}
      onClick={onSelect}
    >
      <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => onEditTitleChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onConfirmRename()}
              className="w-full px-1.5 py-0.5 text-xs bg-white dark:bg-neutral-700 rounded border border-violet-300 dark:border-violet-600 outline-none"
              autoFocus
            />
            <button onClick={onConfirmRename} className="p-0.5 hover:bg-violet-200 dark:hover:bg-violet-800 rounded">
              <Check className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <>
            <div className="text-xs font-medium truncate">{session.title}</div>
            <div className="text-[10px] opacity-50 truncate">
              {session.messageCount > 0
                ? `${session.messageCount} messages`
                : "Empty"}
            </div>
          </>
        )}
      </div>

      {/* Hover Actions */}
      {!isEditing && (
        <div className="hidden group-hover:flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onPin}
            className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded"
            title={session.pinned ? "Unpin" : "Pin"}
          >
            {session.pinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
          </button>
          <button
            onClick={onStartRename}
            className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded"
            title="Rename"
          >
            <Pencil className="w-3 h-3" />
          </button>
          <button
            onClick={onDelete}
            className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 rounded"
            title="Delete"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}

// =============================================
// Main AI Chat Component
// =============================================

export function AIChat({ isOpen, onClose, initialContext, initialMessage }: AIChatProps) {
  const { getToken } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSessionsLoading, setIsSessionsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const initialized = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, activeSessionId]);

  // Load sessions on open
  useEffect(() => {
    if (isOpen && !initialized.current) {
      initialized.current = true;
      loadSessions();
    }
  }, [isOpen]);

  // Handle initial message
  useEffect(() => {
    if (initialMessage && isOpen && messages.length === 0 && activeSessionId) {
      handleSend(initialMessage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMessage, isOpen, activeSessionId]);

  const ensureToken = useCallback(async () => {
    const token = await getToken();
    api.setToken(token);
  }, [getToken]);

  // ---- Session Management ----

  const loadSessions = useCallback(async () => {
    try {
      setIsSessionsLoading(true);
      await ensureToken();
      const res = (await api.listChatSessions()) as any;
      if (res.success) {
        setSessions(res.data || []);
      }
    } catch (err) {
      console.error("Failed to load sessions:", err);
    } finally {
      setIsSessionsLoading(false);
    }
  }, [ensureToken]);

  const createNewSession = useCallback(async () => {
    try {
      await ensureToken();
      const res = (await api.createChatSession()) as any;
      if (res.success) {
        const newSession = res.data;
        setSessions((prev) => [
          { ...newSession, messageCount: 0, lastMessage: null },
          ...prev,
        ]);
        setActiveSessionId(newSession.id);
        setMessages([]);
      }
    } catch (err) {
      console.error("Failed to create session:", err);
    }
  }, [ensureToken]);

  const selectSession = useCallback(
    async (sessionId: string) => {
      try {
        setActiveSessionId(sessionId);
        setIsLoading(true);
        await ensureToken();
        const res = (await api.getChatSession(sessionId)) as any;
        if (res.success) {
          setMessages(res.data.messages || []);
        }
      } catch (err) {
        console.error("Failed to load session:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [ensureToken]
  );

  const deleteSession = useCallback(
    async (sessionId: string) => {
      try {
        await ensureToken();
        await api.deleteChatSession(sessionId);
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        if (activeSessionId === sessionId) {
          setActiveSessionId(null);
          setMessages([]);
        }
      } catch (err) {
        console.error("Failed to delete session:", err);
      }
    },
    [ensureToken, activeSessionId]
  );

  const pinSession = useCallback(
    async (sessionId: string, pinned: boolean) => {
      try {
        await ensureToken();
        await api.updateChatSession(sessionId, { pinned });
        setSessions((prev) =>
          prev.map((s) => (s.id === sessionId ? { ...s, pinned } : s))
        );
      } catch (err) {
        console.error("Failed to pin session:", err);
      }
    },
    [ensureToken]
  );

  const renameSession = useCallback(
    async (sessionId: string, title: string) => {
      try {
        await ensureToken();
        await api.updateChatSession(sessionId, { title });
        setSessions((prev) =>
          prev.map((s) => (s.id === sessionId ? { ...s, title } : s))
        );
      } catch (err) {
        console.error("Failed to rename session:", err);
      }
    },
    [ensureToken]
  );

  // ---- Messaging ----

  const handleSend = useCallback(
    async (messageText?: string) => {
      const text = messageText || input.trim();
      if (!text || isLoading) return;

      // Auto-create session if none
      let sessionId = activeSessionId;
      if (!sessionId) {
        try {
          await ensureToken();
          const res = (await api.createChatSession()) as any;
          if (res.success) {
            sessionId = res.data.id;
            setActiveSessionId(sessionId);
            setSessions((prev) => [
              { ...res.data, messageCount: 0, lastMessage: null },
              ...prev,
            ]);
          }
        } catch {
          return;
        }
      }

      // Optimistic user message
      const tempUserMsg: ChatMessage = {
        id: "temp-" + Date.now(),
        role: "user",
        content: text,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, tempUserMsg]);
      setInput("");
      setIsLoading(true);

      try {
        await ensureToken();
        const response = (await api.sendChatMessage(sessionId!, text)) as any;

        if (response.success) {
          const { userMessage, assistantMessage, actions } = response.data;

          // Replace temp message with real one, add assistant message
          setMessages((prev) => {
            const filtered = prev.filter((m) => m.id !== tempUserMsg.id);
            return [
              ...filtered,
              userMessage,
              {
                ...assistantMessage,
                actionResult: actions || assistantMessage.actionResult,
              },
            ];
          });

          // Update session in sidebar
          setSessions((prev) =>
            prev.map((s) =>
              s.id === sessionId
                ? {
                    ...s,
                    title:
                      s.title === "New Chat"
                        ? text.substring(0, 60)
                        : s.title,
                    messageCount: s.messageCount + 2,
                    lastMessage: {
                      content: assistantMessage.content,
                      role: "assistant",
                      createdAt: assistantMessage.createdAt,
                    },
                    updatedAt: new Date().toISOString(),
                  }
                : s
            )
          );
        }
      } catch (error: any) {
        // Add error message
        setMessages((prev) => [
          ...prev,
          {
            id: "error-" + Date.now(),
            role: "assistant" as const,
            content:
              "Sorry, there was an error processing your request. Please try again.",
            createdAt: new Date().toISOString(),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [input, isLoading, activeSessionId, ensureToken]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  const hasActiveSession = activeSessionId !== null;

  return (
    <div
      className={`fixed z-[60] ${
        isExpanded
          ? "inset-4 lg:inset-8"
          : "bottom-4 right-4 w-[480px] h-[650px] max-h-[85vh]"
      } bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-700 flex flex-col overflow-hidden transition-all duration-300`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 text-white">
        <div className="flex items-center gap-2">
          {isExpanded && (
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              title="Toggle sidebar"
            >
              {showSidebar ? (
                <ChevronLeft className="w-4 h-4" />
              ) : (
                <History className="w-4 h-4" />
              )}
            </button>
          )}
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Nexus AI</h3>
            <p className="text-[10px] text-violet-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              CRM Actions Enabled
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={createNewSession}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            title="New chat"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
          >
            {isExpanded ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - only in expanded mode */}
        {isExpanded && showSidebar && (
          <SessionSidebar
            sessions={sessions}
            activeSessionId={activeSessionId}
            onSelectSession={selectSession}
            onNewSession={createNewSession}
            onDeleteSession={deleteSession}
            onPinSession={pinSession}
            onRenameSession={renameSession}
            isLoading={isSessionsLoading}
          />
        )}

        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {!hasActiveSession && messages.length === 0 && (
              <WelcomeScreen onSend={handleSend} onNewSession={createNewSession} sessions={sessions} onSelectSession={selectSession} />
            )}

            {hasActiveSession && messages.length === 0 && !isLoading && (
              <EmptySessionScreen onSend={handleSend} />
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                    message.role === "user"
                      ? "bg-violet-600 text-white rounded-br-sm"
                      : "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-bl-sm"
                  }`}
                >
                  {message.role === "assistant" && (
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Sparkles className="w-3 h-3 text-violet-500" />
                      <span className="text-[10px] font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wide">
                        Nexus AI
                      </span>
                    </div>
                  )}

                  {/* Action Results */}
                  {message.actionResult &&
                    Array.isArray(message.actionResult) &&
                    message.actionResult.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {message.actionResult.map((result: ActionResult, i: number) => (
                          <ActionBadge key={i} result={result} />
                        ))}
                      </div>
                    )}

                  {message.role === "user" ? (
                    <div className="text-sm whitespace-pre-wrap leading-relaxed">
                      {message.content}
                    </div>
                  ) : (
                    <MarkdownRenderer content={message.content} />
                  )}
                  <div
                    className={`text-[10px] mt-1 ${
                      message.role === "user"
                        ? "text-violet-200"
                        : "text-neutral-400"
                    }`}
                  >
                    {new Date(message.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-neutral-100 dark:bg-neutral-800 rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                    <span className="text-xs text-neutral-500">
                      Processing...
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  hasActiveSession
                    ? "Ask anything or give a command... (e.g. 'create a customer named John')"
                    : "Start a new conversation..."
                }
                rows={1}
                className="flex-1 resize-none rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-white placeholder-neutral-400 max-h-32"
                style={{ minHeight: "42px" }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = "auto";
                  target.style.height =
                    Math.min(target.scrollHeight, 128) + "px";
                }}
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className="p-2.5 bg-violet-600 hover:bg-violet-700 disabled:bg-neutral-300 dark:disabled:bg-neutral-700 text-white rounded-xl transition-colors flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-2 mt-1.5 px-1">
              <Zap className="w-3 h-3 text-amber-500" />
              <span className="text-[10px] text-neutral-400">
                Can create, update, delete & search customers, deals, and tasks
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================
// Welcome Screen (no active session)
// =============================================

function WelcomeScreen({
  onSend,
  onNewSession,
  sessions,
  onSelectSession,
}: {
  onSend: (text: string) => void;
  onNewSession: () => void;
  sessions: ChatSession[];
  onSelectSession: (id: string) => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4">
      <div className="w-16 h-16 bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/30 dark:to-indigo-900/30 rounded-2xl flex items-center justify-center mb-4">
        <Zap className="w-8 h-8 text-violet-600 dark:text-violet-400" />
      </div>
      <h4 className="font-bold text-lg text-neutral-900 dark:text-white mb-1">
        Nexus AI Assistant
      </h4>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6 max-w-xs">
        Your intelligent CRM copilot. I can execute CRM operations, analyze data, and help you work smarter.
      </p>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-2 w-full max-w-sm mb-6">
        {[
          { icon: <Users className="w-4 h-4" />, label: "Add a customer", command: "Create a new customer" },
          { icon: <Briefcase className="w-4 h-4" />, label: "Show my deals", command: "List all my deals" },
          { icon: <ListTodo className="w-4 h-4" />, label: "My pending tasks", command: "Show my pending tasks" },
          { icon: <BarChart3 className="w-4 h-4" />, label: "Dashboard stats", command: "Show me dashboard statistics" },
        ].map((item) => (
          <button
            key={item.label}
            onClick={() => onSend(item.command)}
            className="flex items-center gap-2 text-left text-sm px-3 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 hover:bg-violet-50 dark:hover:bg-violet-900/20 text-neutral-700 dark:text-neutral-300 hover:text-violet-700 dark:hover:text-violet-300 transition-colors border border-neutral-200 dark:border-neutral-700"
          >
            <span className="text-violet-500">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>

      {/* Recent Sessions */}
      {sessions.length > 0 && (
        <div className="w-full max-w-sm">
          <div className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-2 text-left">
            Recent Conversations
          </div>
          <div className="space-y-1">
            {sessions.slice(0, 3).map((session) => (
              <button
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                className="w-full flex items-center gap-2 text-left px-3 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                <span className="text-sm text-neutral-600 dark:text-neutral-300 truncate">
                  {session.title}
                </span>
                <span className="text-[10px] text-neutral-400 ml-auto flex-shrink-0">
                  {new Date(session.updatedAt).toLocaleDateString()}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================
// Empty Session Screen
// =============================================

function EmptySessionScreen({ onSend }: { onSend: (text: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4">
      <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/30 rounded-xl flex items-center justify-center mb-3">
        <Bot className="w-6 h-6 text-violet-600 dark:text-violet-400" />
      </div>
      <h4 className="font-semibold text-neutral-900 dark:text-white mb-1">
        How can I help?
      </h4>
      <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
        Try a command below or type anything
      </p>
      <div className="grid grid-cols-1 gap-1.5 w-full max-w-xs">
        {[
          "📊 Show me my dashboard stats",
          "➕ Create a customer named Ahmed, email ahmed@company.com",
          "📋 List my high priority tasks",
          "💼 Show deals in negotiation stage",
          "✉️ Help me write a follow-up email",
          "🎯 Prioritize my tasks",
        ].map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => onSend(suggestion)}
            className="text-left text-xs px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-800 hover:bg-violet-50 dark:hover:bg-violet-900/20 text-neutral-600 dark:text-neutral-300 hover:text-violet-700 dark:hover:text-violet-300 transition-colors border border-neutral-200 dark:border-neutral-700"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}

// =============================================
// Floating AI Chat Button
// =============================================

export function AIChatButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group ${
          isOpen ? "scale-0" : "scale-100"
        }`}
      >
        <Zap className="w-6 h-6 group-hover:scale-110 transition-transform" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-neutral-900 animate-pulse" />
      </button>

      <AIChat isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
