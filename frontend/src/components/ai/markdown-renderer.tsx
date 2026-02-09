"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const components: Components = {
  // Headings
  h1: ({ children }) => (
    <h1 className="text-lg font-bold text-neutral-900 dark:text-white mt-4 mb-2 first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-base font-bold text-neutral-900 dark:text-white mt-4 mb-2 first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-sm font-bold text-neutral-900 dark:text-white mt-3 mb-1.5 first:mt-0">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mt-2 mb-1 first:mt-0">
      {children}
    </h4>
  ),

  // Paragraphs
  p: ({ children }) => (
    <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300 mb-2 last:mb-0">
      {children}
    </p>
  ),

  // Strong / Bold
  strong: ({ children }) => (
    <strong className="font-semibold text-neutral-900 dark:text-white">
      {children}
    </strong>
  ),

  // Emphasis / Italic
  em: ({ children }) => (
    <em className="italic text-neutral-600 dark:text-neutral-400">{children}</em>
  ),

  // Links
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-violet-600 dark:text-violet-400 hover:underline font-medium"
    >
      {children}
    </a>
  ),

  // Unordered lists
  ul: ({ children }) => (
    <ul className="space-y-1 mb-3 last:mb-0">{children}</ul>
  ),

  // Ordered lists
  ol: ({ children }) => (
    <ol className="space-y-1.5 mb-3 last:mb-0 counter-reset-list">{children}</ol>
  ),

  // List items
  li: ({ children, ...props }) => {
    const ordered = (props as any).ordered;
    const index = (props as any).index;
    return (
      <li className="flex gap-2 text-sm text-neutral-700 dark:text-neutral-300">
        <span className="flex-shrink-0 mt-0.5">
          {ordered ? (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-[10px] font-bold text-violet-700 dark:text-violet-300">
              {(index ?? 0) + 1}
            </span>
          ) : (
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-violet-500 dark:bg-violet-400 mt-1.5" />
          )}
        </span>
        <span className="flex-1">{children}</span>
      </li>
    );
  },

  // Blockquotes
  blockquote: ({ children }) => (
    <blockquote className="border-l-3 border-violet-400 dark:border-violet-600 pl-3 py-1 my-2 bg-violet-50/50 dark:bg-violet-900/10 rounded-r-lg">
      {children}
    </blockquote>
  ),

  // Code blocks
  code: ({ children, className }) => {
    const isInline = !className;
    if (isInline) {
      return (
        <code className="px-1.5 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-violet-700 dark:text-violet-300 text-xs font-mono">
          {children}
        </code>
      );
    }
    return (
      <code className="block p-3 rounded-lg bg-neutral-950 dark:bg-neutral-950 text-neutral-100 text-xs font-mono overflow-x-auto my-2 leading-relaxed">
        {children}
      </code>
    );
  },

  pre: ({ children }) => (
    <pre className="my-2 rounded-lg overflow-hidden">{children}</pre>
  ),

  // Horizontal rules
  hr: () => (
    <hr className="border-neutral-200 dark:border-neutral-700 my-3" />
  ),

  // Tables
  table: ({ children }) => (
    <div className="overflow-x-auto my-2 rounded-lg border border-neutral-200 dark:border-neutral-700">
      <table className="w-full text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-neutral-50 dark:bg-neutral-800">{children}</thead>
  ),
  th: ({ children }) => (
    <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-300 uppercase tracking-wider">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 border-t border-neutral-200 dark:border-neutral-700">
      {children}
    </td>
  ),
};

export function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  return (
    <div className={`ai-markdown ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
