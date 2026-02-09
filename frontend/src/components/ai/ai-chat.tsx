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
} from "lucide-react";
import api from "@/lib/api";
import { MarkdownRenderer } from "@/components/ai/markdown-renderer";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AIChatProps {
  isOpen: boolean;
  onClose: () => void;
  initialContext?: string;
  initialMessage?: string;
}

export function AIChat({ isOpen, onClose, initialContext, initialMessage }: AIChatProps) {
  const { getToken } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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
  }, [isOpen]);

  // Send initial message if provided
  useEffect(() => {
    if (initialMessage && isOpen && messages.length === 0) {
      handleSend(initialMessage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMessage, isOpen]);

  const handleSend = useCallback(async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const token = await getToken();
      api.setToken(token);

      const conversationHistory = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await api.aiChat(text, initialContext, conversationHistory) as any;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.data?.message || "Sorry, I couldn't process that request.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, there was an error processing your request. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, getToken, initialContext, messages]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed z-[60] ${
        isExpanded
          ? "inset-4 lg:inset-8"
          : "bottom-4 right-4 w-96 h-[600px] max-h-[80vh]"
      } bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-700 flex flex-col overflow-hidden transition-all duration-300`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Nexus AI Assistant</h3>
            <p className="text-xs text-violet-200">Powered by NVIDIA NIM</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={clearChat}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            title="Clear chat"
          >
            <Trash2 className="w-4 h-4" />
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 bg-violet-100 dark:bg-violet-900/30 rounded-2xl flex items-center justify-center mb-4">
              <Bot className="w-8 h-8 text-violet-600 dark:text-violet-400" />
            </div>
            <h4 className="font-semibold text-neutral-900 dark:text-white mb-2">
              Hi! I&apos;m Nexus AI
            </h4>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
              Your intelligent CRM assistant. I can help you with customer insights, deal analysis, email drafting, and more.
            </p>
            <div className="grid grid-cols-1 gap-2 w-full">
              {[
                "📊 Analyze my dashboard metrics",
                "✉️ Help me write a follow-up email",
                "🎯 Prioritize my tasks",
                "💡 Give me sales tips",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSend(suggestion)}
                  className="text-left text-sm px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-800 hover:bg-violet-50 dark:hover:bg-violet-900/20 text-neutral-700 dark:text-neutral-300 hover:text-violet-700 dark:hover:text-violet-300 transition-colors border border-neutral-200 dark:border-neutral-700"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                message.role === "user"
                  ? "bg-violet-600 text-white rounded-br-md"
                  : "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-bl-md"
              }`}
            >
              {message.role === "assistant" && (
                <div className="flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-3 h-3 text-violet-500" />
                  <span className="text-xs font-medium text-violet-600 dark:text-violet-400">
                    Nexus AI
                  </span>
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
                  message.role === "user" ? "text-violet-200" : "text-neutral-400"
                }`}
              >
                {message.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-neutral-100 dark:bg-neutral-800 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
                <span className="text-sm text-neutral-500">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-neutral-200 dark:border-neutral-700">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Nexus AI anything..."
            rows={1}
            className="flex-1 resize-none rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-white placeholder-neutral-400 max-h-32"
            style={{ minHeight: "40px" }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = Math.min(target.scrollHeight, 128) + "px";
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
      </div>
    </div>
  );
}

/**
 * Floating AI Chat Button
 */
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
        <MessageSquare className="w-6 h-6 group-hover:scale-110 transition-transform" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-neutral-900 animate-pulse" />
      </button>

      <AIChat isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
