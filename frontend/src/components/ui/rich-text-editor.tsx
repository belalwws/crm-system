'use client';

import { useRef, useCallback, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { Bold, Italic, Underline, List, ListOrdered, Link2, AlignLeft, AlignCenter, AlignRight, Type, Heading1, Heading2, Quote, Code } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export function RichTextEditor({ value, onChange, placeholder = 'Write something...', minHeight = '200px' }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef(false);

  useEffect(() => {
    if (editorRef.current && !isInternalChange.current) {
      const sanitized = DOMPurify.sanitize(value, {
        ALLOWED_TAGS: ['b', 'i', 'u', 'strong', 'em', 'h1', 'h2', 'h3', 'p', 'br', 'ul', 'ol', 'li', 'a', 'blockquote', 'pre', 'code', 'div', 'span'],
        ALLOWED_ATTR: ['href', 'target', 'style', 'class'],
      });
      if (editorRef.current.innerHTML !== sanitized) {
        editorRef.current.innerHTML = sanitized;
      }
    }
    isInternalChange.current = false;
  }, [value]);

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    if (editorRef.current) {
      isInternalChange.current = true;
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      isInternalChange.current = true;
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleInsertLink = () => {
    const url = prompt('Enter URL:');
    if (url) execCommand('createLink', url);
  };

  const tools = [
    { icon: Bold, cmd: 'bold', title: 'Bold (Ctrl+B)' },
    { icon: Italic, cmd: 'italic', title: 'Italic (Ctrl+I)' },
    { icon: Underline, cmd: 'underline', title: 'Underline (Ctrl+U)' },
    null, // separator
    { icon: Heading1, cmd: 'formatBlock', value: 'H1', title: 'Heading 1' },
    { icon: Heading2, cmd: 'formatBlock', value: 'H2', title: 'Heading 2' },
    { icon: Type, cmd: 'formatBlock', value: 'P', title: 'Paragraph' },
    null,
    { icon: List, cmd: 'insertUnorderedList', title: 'Bullet list' },
    { icon: ListOrdered, cmd: 'insertOrderedList', title: 'Numbered list' },
    { icon: Quote, cmd: 'formatBlock', value: 'BLOCKQUOTE', title: 'Quote' },
    null,
    { icon: AlignLeft, cmd: 'justifyLeft', title: 'Align left' },
    { icon: AlignCenter, cmd: 'justifyCenter', title: 'Align center' },
    { icon: AlignRight, cmd: 'justifyRight', title: 'Align right' },
    null,
    { icon: Link2, cmd: 'link', title: 'Insert link', action: handleInsertLink },
    { icon: Code, cmd: 'formatBlock', value: 'PRE', title: 'Code block' },
  ];

  return (
    <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-1.5 bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
        {tools.map((tool, i) => {
          if (!tool) return <div key={i} className="w-px h-5 bg-neutral-300 dark:bg-neutral-600 mx-1" />;
          const Icon = tool.icon;
          return (
            <button
              key={i}
              type="button"
              title={tool.title}
              aria-label={tool.title}
              onMouseDown={(e) => {
                e.preventDefault();
                if (tool.action) tool.action();
                else if (tool.value) execCommand(tool.cmd, tool.value);
                else execCommand(tool.cmd);
              }}
              className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 transition-colors"
            >
              <Icon className="w-4 h-4" />
            </button>
          );
        })}
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        role="textbox"
        aria-multiline="true"
        aria-label={placeholder}
        onInput={handleInput}
        data-placeholder={placeholder}
        className="p-3 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none prose prose-sm dark:prose-invert max-w-none [&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-neutral-400"
        style={{ minHeight }}
      />
    </div>
  );
}
