"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  Mail,
  Loader2,
  Copy,
  Check,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import api from "@/lib/api";

interface AIEmailComposerProps {
  customerId?: string;
  customerName?: string;
  onEmailGenerated?: (subject: string, body: string) => void;
}

const toneOptions = [
  { value: "professional", label: "Professional" },
  { value: "friendly", label: "Friendly" },
  { value: "formal", label: "Formal" },
  { value: "persuasive", label: "Persuasive" },
  { value: "casual", label: "Casual" },
];

const purposeTemplates = [
  "Follow-up after meeting",
  "Introduce our product/service",
  "Request a meeting",
  "Thank them for their business",
  "Share a proposal",
  "Check in on deal progress",
  "Onboarding welcome",
  "Re-engage inactive customer",
];

export function AIEmailComposer({
  customerId,
  customerName,
  onEmailGenerated,
}: AIEmailComposerProps) {
  const { getToken } = useAuth();
  const [purpose, setPurpose] = useState("");
  const [tone, setTone] = useState("professional");
  const [additionalContext, setAdditionalContext] = useState("");
  const [generatedEmail, setGeneratedEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!purpose.trim()) return;

    setIsLoading(true);
    try {
      const token = await getToken();
      api.setToken(token);

      const response = await api.aiComposeEmail({
        customerId,
        purpose: purpose.trim(),
        tone,
        additionalContext: additionalContext.trim() || undefined,
      }) as any;

      setGeneratedEmail(response.data?.email || "");

      // Parse subject and body for callback
      if (onEmailGenerated && response.data?.email) {
        const emailText = response.data.email;
        const subjectMatch = emailText.match(/\*\*Subject:\*\*\s*(.+)/);
        const bodyMatch = emailText.match(/\*\*Body:\*\*\s*([\s\S]+)/);
        if (subjectMatch && bodyMatch) {
          onEmailGenerated(subjectMatch[1].trim(), bodyMatch[1].trim());
        }
      }
    } catch (error) {
      setGeneratedEmail("Failed to generate email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-2">
        <div className="w-8 h-8 bg-violet-100 dark:bg-violet-900/30 rounded-lg flex items-center justify-center">
          <Mail className="w-4 h-4 text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <h3 className="font-semibold text-sm text-neutral-900 dark:text-white">
            AI Email Composer
          </h3>
          <p className="text-xs text-neutral-500">
            {customerName ? `Writing to ${customerName}` : "Generate professional emails with AI"}
          </p>
        </div>
        <Sparkles className="w-4 h-4 text-violet-500 ml-auto" />
      </div>

      {/* Form */}
      <div className="p-4 space-y-4">
        {/* Purpose */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
            Email Purpose
          </label>
          <input
            type="text"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="What's the email about?"
            className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-white"
          />
          <div className="flex flex-wrap gap-1.5 mt-2">
            {purposeTemplates.map((template) => (
              <button
                key={template}
                onClick={() => setPurpose(template)}
                className="text-xs px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:text-violet-600 dark:hover:text-violet-400 transition-colors border border-neutral-200 dark:border-neutral-700"
              >
                {template}
              </button>
            ))}
          </div>
        </div>

        {/* Tone */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
            Tone
          </label>
          <div className="flex gap-2">
            {toneOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setTone(option.value)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                  tone === option.value
                    ? "bg-violet-600 text-white border-violet-600"
                    : "bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700 hover:border-violet-300"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Additional Context */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
            Additional Context (optional)
          </label>
          <textarea
            value={additionalContext}
            onChange={(e) => setAdditionalContext(e.target.value)}
            placeholder="Any specific details to include..."
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-white resize-none"
          />
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={!purpose.trim() || isLoading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:from-neutral-300 disabled:to-neutral-400 dark:disabled:from-neutral-700 dark:disabled:to-neutral-700 text-white rounded-lg text-sm font-medium transition-all"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate Email
            </>
          )}
        </button>

        {/* Generated Email */}
        {generatedEmail && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Generated Email
              </span>
              <div className="flex gap-1">
                <button
                  onClick={handleGenerate}
                  className="p-1.5 text-neutral-400 hover:text-violet-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  title="Regenerate"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={handleCopy}
                  className="p-1.5 text-neutral-400 hover:text-violet-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  title="Copy to clipboard"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4 text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap border border-neutral-200 dark:border-neutral-700 max-h-80 overflow-y-auto">
              {generatedEmail}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
