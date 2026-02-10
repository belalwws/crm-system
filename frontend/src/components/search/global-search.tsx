'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  X, 
  User, 
  Briefcase, 
  CheckSquare, 
  ArrowRight,
  Loader2,
  Command
} from 'lucide-react';

interface SearchResult {
  id: string;
  type: 'customer' | 'deal' | 'task';
  title: string;
  subtitle?: string;
}

export function GlobalSearch() {
  const { getToken } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    } else {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Search with debounce - uses server-side global search API
  const search = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      const token = await getToken();

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/search?q=${encodeURIComponent(searchQuery)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      const searchResults = data.data || {};
      const allResults: SearchResult[] = [];

      // Map customers
      (searchResults.customers || []).forEach((c: any) => {
        allResults.push({
          id: c.id,
          type: 'customer',
          title: c.name,
          subtitle: c.company || c.email,
        });
      });

      // Map deals
      (searchResults.deals || []).forEach((d: any) => {
        allResults.push({
          id: d.id,
          type: 'deal',
          title: d.title,
          subtitle: `$${d.value?.toLocaleString() || 0} · ${d.stage}`,
        });
      });

      // Map tasks
      (searchResults.tasks || []).forEach((t: any) => {
        allResults.push({
          id: t.id,
          type: 'task',
          title: t.title,
          subtitle: t.status,
        });
      });

      setResults(allResults);
      setSelectedIndex(0);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      search(query);
    }, 300);
    return () => clearTimeout(timeout);
  }, [query, search]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      navigateToResult(results[selectedIndex]);
    }
  };

  const navigateToResult = (result: SearchResult) => {
    setIsOpen(false);
    switch (result.type) {
      case 'customer':
        router.push(`/dashboard/customers/${result.id}`);
        break;
      case 'deal':
        router.push(`/dashboard/deals/${result.id}`);
        break;
      case 'task':
        router.push(`/dashboard/tasks`);
        break;
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'customer':
        return <User className="w-4 h-4 text-blue-500" />;
      case 'deal':
        return <Briefcase className="w-4 h-4 text-purple-500" />;
      case 'task':
        return <CheckSquare className="w-4 h-4 text-green-500" />;
      default:
        return null;
    }
  };

  return (
    <>
      {/* Search Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
      >
        <Search className="w-4 h-4" />
        <span className="hidden sm:inline">Search...</span>
        <kbd className="hidden md:inline-flex items-center gap-1 px-1.5 py-0.5 text-xs bg-neutral-200 dark:bg-neutral-700 rounded">
          <Command className="w-3 h-3" />K
        </kbd>
      </button>

      {/* Search Modal */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] px-4 bg-black/50"
          onClick={() => setIsOpen(false)}
        >
          <div 
            className="w-full max-w-xl bg-white dark:bg-neutral-900 rounded-xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
              {loading ? (
                <Loader2 className="w-5 h-5 text-neutral-400 animate-spin" />
              ) : (
                <Search className="w-5 h-5 text-neutral-400" />
              )}
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search customers, deals, tasks..."
                className="flex-1 bg-transparent text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none"
              />
              {query && (
                <button onClick={() => setQuery('')} className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded">
                  <X className="w-4 h-4 text-neutral-400" />
                </button>
              )}
            </div>

            {/* Results */}
            {results.length > 0 ? (
              <div className="max-h-80 overflow-y-auto py-2">
                {results.map((result, index) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => navigateToResult(result)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      index === selectedIndex
                        ? 'bg-neutral-100 dark:bg-neutral-800'
                        : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                    }`}
                  >
                    <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800">
                      {getIcon(result.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                        {result.title}
                      </p>
                      {result.subtitle && (
                        <p className="text-xs text-neutral-500 truncate">{result.subtitle}</p>
                      )}
                    </div>
                    <span className="text-xs text-neutral-400 capitalize">{result.type}</span>
                    <ArrowRight className="w-4 h-4 text-neutral-400" />
                  </button>
                ))}
              </div>
            ) : query.length >= 2 && !loading ? (
              <div className="py-8 text-center text-neutral-500">
                <p>No results found for "{query}"</p>
              </div>
            ) : query.length > 0 && query.length < 2 ? (
              <div className="py-8 text-center text-neutral-500">
                <p>Type at least 2 characters to search</p>
              </div>
            ) : (
              <div className="py-8 text-center text-neutral-500">
                <p>Start typing to search...</p>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center gap-4 px-4 py-2 bg-neutral-50 dark:bg-neutral-800/50 text-xs text-neutral-500 border-t border-neutral-200 dark:border-neutral-700">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-neutral-200 dark:bg-neutral-700 rounded">↑↓</kbd> to navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-neutral-200 dark:bg-neutral-700 rounded">Enter</kbd> to select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-neutral-200 dark:bg-neutral-700 rounded">Esc</kbd> to close
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
