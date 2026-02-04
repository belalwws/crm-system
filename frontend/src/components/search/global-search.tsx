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

  // Search with debounce
  const search = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      const token = await getToken();
      
      // Parallel fetch all entities
      const [customersRes, dealsRes, tasksRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/customers`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/deals`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tasks`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const [customers, deals, tasks] = await Promise.all([
        customersRes.ok ? customersRes.json() : [],
        dealsRes.ok ? dealsRes.json() : [],
        tasksRes.ok ? tasksRes.json() : [],
      ]);

      const searchLower = searchQuery.toLowerCase();
      const allResults: SearchResult[] = [];

      // Search customers
      customers.filter((c: any) => 
        c.name.toLowerCase().includes(searchLower) ||
        c.email?.toLowerCase().includes(searchLower) ||
        c.company?.toLowerCase().includes(searchLower)
      ).slice(0, 5).forEach((c: any) => {
        allResults.push({
          id: c.id,
          type: 'customer',
          title: c.name,
          subtitle: c.company || c.email,
        });
      });

      // Search deals
      deals.filter((d: any) => 
        d.title.toLowerCase().includes(searchLower)
      ).slice(0, 5).forEach((d: any) => {
        allResults.push({
          id: d.id,
          type: 'deal',
          title: d.title,
          subtitle: `$${d.value.toLocaleString()} · ${d.stage}`,
        });
      });

      // Search tasks
      tasks.filter((t: any) => 
        t.title.toLowerCase().includes(searchLower)
      ).slice(0, 5).forEach((t: any) => {
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
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      >
        <Search className="w-4 h-4" />
        <span className="hidden sm:inline">Search...</span>
        <kbd className="hidden md:inline-flex items-center gap-1 px-1.5 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 rounded">
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
            className="w-full max-w-xl bg-white dark:bg-gray-900 rounded-xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              {loading ? (
                <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
              ) : (
                <Search className="w-5 h-5 text-gray-400" />
              )}
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search customers, deals, tasks..."
                className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
              />
              {query && (
                <button onClick={() => setQuery('')} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                  <X className="w-4 h-4 text-gray-400" />
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
                        ? 'bg-gray-100 dark:bg-gray-800'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    }`}
                  >
                    <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                      {getIcon(result.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {result.title}
                      </p>
                      {result.subtitle && (
                        <p className="text-xs text-gray-500 truncate">{result.subtitle}</p>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 capitalize">{result.type}</span>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </button>
                ))}
              </div>
            ) : query.length >= 2 && !loading ? (
              <div className="py-8 text-center text-gray-500">
                <p>No results found for "{query}"</p>
              </div>
            ) : query.length > 0 && query.length < 2 ? (
              <div className="py-8 text-center text-gray-500">
                <p>Type at least 2 characters to search</p>
              </div>
            ) : (
              <div className="py-8 text-center text-gray-500">
                <p>Start typing to search...</p>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center gap-4 px-4 py-2 bg-gray-50 dark:bg-gray-800/50 text-xs text-gray-500 border-t border-gray-200 dark:border-gray-700">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">↑↓</kbd> to navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Enter</kbd> to select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Esc</kbd> to close
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
