"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  Brain,
  Loader2,
  Sparkles,
  TrendingUp,
  Users,
  Target,
  ListTodo,
  BarChart3,
  RefreshCw,
} from "lucide-react";
import api from "@/lib/api";
import { MarkdownRenderer } from "@/components/ai/markdown-renderer";

/**
 * AI Customer Insights Panel
 */
export function AICustomerInsights({ customerId, customerName }: { customerId: string; customerName: string }) {
  const { getToken } = useAuth();
  const [insights, setInsights] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchInsights = async () => {
    setIsLoading(true);
    try {
      const token = await getToken();
      api.setToken(token);
      const response = await api.aiCustomerInsights(customerId) as any;
      setInsights(response.data?.insights || "No insights available.");
    } catch (error) {
      setInsights("Failed to generate insights. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AIInsightCard
      icon={<Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
      title="Customer AI Insights"
      subtitle={customerName}
      content={insights}
      isLoading={isLoading}
      onGenerate={fetchInsights}
      gradient="from-blue-600 to-cyan-600"
    />
  );
}

/**
 * AI Deal Analysis Panel
 */
export function AIDealAnalysis({ dealId, dealTitle }: { dealId: string; dealTitle: string }) {
  const { getToken } = useAuth();
  const [analysis, setAnalysis] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchAnalysis = async () => {
    setIsLoading(true);
    try {
      const token = await getToken();
      api.setToken(token);
      const response = await api.aiDealAnalysis(dealId) as any;
      setAnalysis(response.data?.analysis || "No analysis available.");
    } catch (error) {
      setAnalysis("Failed to generate analysis. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AIInsightCard
      icon={<Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
      title="AI Deal Analysis"
      subtitle={dealTitle}
      content={analysis}
      isLoading={isLoading}
      onGenerate={fetchAnalysis}
      gradient="from-emerald-600 to-teal-600"
    />
  );
}

/**
 * AI Task Prioritization Panel
 */
export function AITaskPrioritization() {
  const { getToken } = useAuth();
  const [prioritization, setPrioritization] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchPrioritization = async () => {
    setIsLoading(true);
    try {
      const token = await getToken();
      api.setToken(token);
      const response = await api.aiPrioritizeTasks() as any;
      setPrioritization(response.data?.prioritization || "No tasks to prioritize.");
    } catch (error) {
      setPrioritization("Failed to prioritize tasks. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AIInsightCard
      icon={<ListTodo className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
      title="AI Task Prioritization"
      subtitle="Smart task ordering"
      content={prioritization}
      isLoading={isLoading}
      onGenerate={fetchPrioritization}
      gradient="from-amber-600 to-orange-600"
    />
  );
}

/**
 * AI Dashboard Insights Panel
 */
export function AIDashboardInsights() {
  const { getToken } = useAuth();
  const [insights, setInsights] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchInsights = async () => {
    setIsLoading(true);
    try {
      const token = await getToken();
      api.setToken(token);
      const response = await api.aiDashboardInsights() as any;
      setInsights(response.data?.insights || "No insights available.");
    } catch (error) {
      setInsights("Failed to generate insights. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AIInsightCard
      icon={<BarChart3 className="w-4 h-4 text-violet-600 dark:text-violet-400" />}
      title="AI Business Insights"
      subtitle="Performance analysis"
      content={insights}
      isLoading={isLoading}
      onGenerate={fetchInsights}
      gradient="from-violet-600 to-purple-600"
    />
  );
}

/**
 * AI Summary Panel
 */
export function AISummary({ type, entityId, title }: { type: string; entityId: string; title: string }) {
  const { getToken } = useAuth();
  const [summary, setSummary] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchSummary = async () => {
    setIsLoading(true);
    try {
      const token = await getToken();
      api.setToken(token);
      const response = await api.aiSummarize(type, entityId) as any;
      setSummary(response.data?.summary || "No summary available.");
    } catch (error) {
      setSummary("Failed to generate summary. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AIInsightCard
      icon={<Brain className="w-4 h-4 text-pink-600 dark:text-pink-400" />}
      title="AI Summary"
      subtitle={title}
      content={summary}
      isLoading={isLoading}
      onGenerate={fetchSummary}
      gradient="from-pink-600 to-rose-600"
    />
  );
}

/**
 * Reusable AI Insight Card Component
 */
function AIInsightCard({
  icon,
  title,
  subtitle,
  content,
  isLoading,
  onGenerate,
  gradient,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  content: string;
  isLoading: boolean;
  onGenerate: () => void;
  gradient: string;
}) {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-2">
        <div className="w-8 h-8 bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center">
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-sm text-neutral-900 dark:text-white">
            {title}
          </h3>
          <p className="text-xs text-neutral-500">{subtitle}</p>
        </div>
        {content && (
          <button
            onClick={onGenerate}
            disabled={isLoading}
            className="p-1.5 text-neutral-400 hover:text-violet-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        )}
        <Sparkles className="w-4 h-4 text-violet-500" />
      </div>

      {/* Content */}
      <div className="p-4">
        {!content && !isLoading ? (
          <button
            onClick={onGenerate}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r ${gradient} hover:opacity-90 text-white rounded-lg text-sm font-medium transition-all`}
          >
            <Sparkles className="w-4 h-4" />
            Generate AI Analysis
          </button>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-violet-500 mb-3" />
            <p className="text-sm text-neutral-500">
              AI is analyzing your data...
            </p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            <MarkdownRenderer content={content} />
          </div>
        )}
      </div>
    </div>
  );
}
