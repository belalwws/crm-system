"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import {
  Sparkles,
  MessageSquare,
  Mail,
  BarChart3,
  ListTodo,
  Brain,
  Zap,
  TrendingUp,
  Users,
  Target,
} from "lucide-react";

// Dynamic imports for heavy AI components
const AIChat = dynamic(() => import("@/components/ai/ai-chat").then(m => ({ default: m.AIChat })), { ssr: false, loading: () => <div className="h-[500px] animate-pulse bg-neutral-100 dark:bg-neutral-800 rounded-xl" /> });
const AIEmailComposer = dynamic(() => import("@/components/ai/ai-email-composer").then(m => ({ default: m.AIEmailComposer })), { ssr: false, loading: () => <div className="h-[400px] animate-pulse bg-neutral-100 dark:bg-neutral-800 rounded-xl" /> });
const AIDashboardInsights = dynamic(() => import("@/components/ai/ai-insights").then(m => ({ default: m.AIDashboardInsights })), { ssr: false, loading: () => <div className="h-64 animate-pulse bg-neutral-100 dark:bg-neutral-800 rounded-xl" /> });
const AITaskPrioritization = dynamic(() => import("@/components/ai/ai-insights").then(m => ({ default: m.AITaskPrioritization })), { ssr: false, loading: () => <div className="h-64 animate-pulse bg-neutral-100 dark:bg-neutral-800 rounded-xl" /> });

type ActiveTool = "chat" | "email" | "insights" | "tasks" | null;

const aiTools = [
  {
    id: "chat" as const,
    name: "AI Assistant",
    description: "Chat with your intelligent CRM assistant",
    icon: MessageSquare,
    gradient: "from-violet-600 to-indigo-600",
    bgLight: "bg-violet-50",
    bgDark: "dark:bg-violet-900/20",
    textColor: "text-violet-600 dark:text-violet-400",
  },
  {
    id: "email" as const,
    name: "Email Composer",
    description: "Generate professional emails with AI",
    icon: Mail,
    gradient: "from-blue-600 to-cyan-600",
    bgLight: "bg-blue-50",
    bgDark: "dark:bg-blue-900/20",
    textColor: "text-blue-600 dark:text-blue-400",
  },
  {
    id: "insights" as const,
    name: "Business Insights",
    description: "AI-powered analysis of your CRM metrics",
    icon: BarChart3,
    gradient: "from-emerald-600 to-teal-600",
    bgLight: "bg-emerald-50",
    bgDark: "dark:bg-emerald-900/20",
    textColor: "text-emerald-600 dark:text-emerald-400",
  },
  {
    id: "tasks" as const,
    name: "Task Prioritization",
    description: "Smart AI-driven task ordering",
    icon: ListTodo,
    gradient: "from-amber-600 to-orange-600",
    bgLight: "bg-amber-50",
    bgDark: "dark:bg-amber-900/20",
    textColor: "text-amber-600 dark:text-amber-400",
  },
];

const aiCapabilities = [
  { icon: Brain, label: "Customer Analytics", desc: "Deep customer behavior analysis" },
  { icon: Target, label: "Deal Predictions", desc: "Win probability and risk assessment" },
  { icon: TrendingUp, label: "Sales Coaching", desc: "Personalized sales tips and strategies" },
  { icon: Users, label: "Lead Scoring", desc: "Intelligent lead qualification" },
  { icon: Zap, label: "Auto Summaries", desc: "Summarize interactions instantly" },
  { icon: Mail, label: "Smart Emails", desc: "Context-aware email generation" },
];

export default function AIPage() {
  const [activeTool, setActiveTool] = useState<ActiveTool>(null);
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
                Nexus AI
              </h1>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                AI-powered intelligence for your CRM
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            NVIDIA NIM Connected
          </span>
        </div>
      </div>

      {/* AI Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {aiTools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => {
              if (tool.id === "chat") {
                setChatOpen(true);
              } else {
                setActiveTool(activeTool === tool.id ? null : tool.id);
              }
            }}
            className={`group text-left p-4 rounded-xl border transition-all duration-200 ${
              activeTool === tool.id
                ? `border-violet-300 dark:border-violet-700 bg-violet-50 dark:bg-violet-900/20 shadow-lg shadow-violet-100 dark:shadow-none`
                : "border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-md"
            }`}
          >
            <div
              className={`w-10 h-10 ${tool.bgLight} ${tool.bgDark} rounded-lg flex items-center justify-center mb-3`}
            >
              <tool.icon className={`w-5 h-5 ${tool.textColor}`} />
            </div>
            <h3 className="font-semibold text-sm text-neutral-900 dark:text-white mb-1">
              {tool.name}
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {tool.description}
            </p>
          </button>
        ))}
      </div>

      {/* Active Tool Panel */}
      {activeTool && activeTool !== "chat" && (
        <div className="animate-in slide-in-from-top-2 duration-300">
          {activeTool === "email" && <AIEmailComposer />}
          {activeTool === "insights" && <AIDashboardInsights />}
          {activeTool === "tasks" && <AITaskPrioritization />}
        </div>
      )}

      {/* AI Capabilities */}
      {!activeTool && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5 text-violet-600" />
            AI Capabilities
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {aiCapabilities.map((cap) => (
              <div
                key={cap.label}
                className="flex items-start gap-3 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/50"
              >
                <div className="w-8 h-8 bg-violet-100 dark:bg-violet-900/30 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <cap.icon className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-neutral-900 dark:text-white">
                    {cap.label}
                  </h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    {cap.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Model Info */}
          <div className="mt-6 p-4 bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-900/10 dark:to-indigo-900/10 rounded-lg border border-violet-100 dark:border-violet-800/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">
                  Powered by NVIDIA NIM
                </h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Using Meta Llama 3.3 70B Instruct model for high-quality AI responses
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Chat Dialog */}
      <AIChat isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}
