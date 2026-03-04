'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import DOMPurify from 'dompurify';
import {
  Mail,
  Send,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Reply,
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  User,
  Briefcase,
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

interface EmailLog {
  id: string;
  to: string;
  subject: string;
  body: string;
  status: 'SENT' | 'FAILED' | 'BOUNCED' | 'OPENED' | 'REPLIED';
  sentAt: string;
  openedAt?: string;
  repliedAt?: string;
  customer?: { id: string; name: string; email: string } | null;
  deal?: { id: string; title: string } | null;
}

export default function EmailsClient() {
  const { getToken } = useAuth();
  const [emails, setEmails] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showCompose, setShowCompose] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<EmailLog | null>(null);
  const [sending, setSending] = useState(false);
  const [composeForm, setComposeForm] = useState({
    to: '',
    subject: '',
    body: '',
    customerId: '',
    dealId: '',
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchEmails = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/emails/history?page=${page}&limit=20`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setEmails(data.data || []);
        setTotalPages(data.totalPages || 1);
        setTotal(data.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch emails:', error);
    } finally {
      setLoading(false);
    }
  }, [getToken, page]);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  const handleSendEmail = async () => {
    if (!composeForm.to || !composeForm.subject || !composeForm.body) return;
    setSending(true);
    setMessage(null);
    try {
      const token = await getToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/emails/send`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(composeForm),
        }
      );
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Email sent successfully!' });
        setComposeForm({ to: '', subject: '', body: '', customerId: '', dealId: '' });
        setShowCompose(false);
        fetchEmails();
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to send email' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to send email' });
    } finally {
      setSending(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SENT': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'FAILED': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'BOUNCED': return <XCircle className="w-4 h-4 text-orange-500" />;
      case 'OPENED': return <Eye className="w-4 h-4 text-blue-500" />;
      case 'REPLIED': return <Reply className="w-4 h-4 text-violet-500" />;
      default: return <Clock className="w-4 h-4 text-neutral-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      SENT: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      FAILED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      BOUNCED: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      OPENED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      REPLIED: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
    };
    return styles[status] || 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const filteredEmails = search
    ? emails.filter(
        (e) =>
          e.to.toLowerCase().includes(search.toLowerCase()) ||
          e.subject.toLowerCase().includes(search.toLowerCase()) ||
          e.customer?.name.toLowerCase().includes(search.toLowerCase())
      )
    : emails;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Emails</h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            {total} email{total !== 1 ? 's' : ''} sent
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/emails/templates"
            className="flex items-center gap-2 px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-sm transition-colors"
          >
            <FileText className="w-4 h-4" />
            Templates
          </Link>
          <button
            onClick={() => setShowCompose(true)}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Compose
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${
          message.type === 'success'
            ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border border-green-200 dark:border-green-800'
            : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <input
          type="text"
          placeholder="Search by recipient, subject, or customer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent"
        />
      </div>

      {/* Email List */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
        {loading ? (
          <div className="py-12 text-center">
            <div className="w-8 h-8 border-2 border-neutral-300 border-t-violet-600 rounded-full animate-spin mx-auto"></div>
            <p className="mt-3 text-neutral-500">Loading emails...</p>
          </div>
        ) : filteredEmails.length === 0 ? (
          <div className="py-16 text-center">
            <Mail className="w-16 h-16 mx-auto text-neutral-300 dark:text-neutral-600 mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-1">No emails yet</h3>
            <p className="text-neutral-500 dark:text-neutral-400">
              Send your first email to get started.
            </p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {filteredEmails.map((email) => (
                <div
                  key={email.id}
                  onClick={() => setSelectedEmail(email)}
                  className="p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {getStatusIcon(email.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-neutral-900 dark:text-white truncate">
                              {email.subject}
                            </p>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusBadge(email.status)}`}>
                              {email.status}
                            </span>
                          </div>
                          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                            To: {email.to}
                          </p>
                        </div>
                        <span className="text-xs text-neutral-400 flex-shrink-0">
                          {formatDate(email.sentAt)}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1 line-clamp-1">
                        {email.body.replace(/<[^>]*>/g, '').substring(0, 120)}
                      </p>
                      {(email.customer || email.deal) && (
                        <div className="flex items-center gap-3 mt-2">
                          {email.customer && (
                            <span className="flex items-center gap-1 text-xs text-neutral-500">
                              <User className="w-3 h-3" />
                              {email.customer.name}
                            </span>
                          )}
                          {email.deal && (
                            <span className="flex items-center gap-1 text-xs text-neutral-500">
                              <Briefcase className="w-3 h-3" />
                              {email.deal.title}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200 dark:border-neutral-700">
                <p className="text-sm text-neutral-500">
                  Page {page} of {totalPages} ({total} total)
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50"
                  >
                    <ChevronLeft className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                  </button>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50"
                  >
                    <ChevronRight className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Compose Modal */}
      {showCompose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                <Send className="inline w-5 h-5 mr-2" />
                Compose Email
              </h2>
              <button
                onClick={() => setShowCompose(false)}
                className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <XCircle className="w-5 h-5 text-neutral-400" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">To *</label>
                <input
                  type="email"
                  value={composeForm.to}
                  onChange={(e) => setComposeForm({ ...composeForm, to: e.target.value })}
                  placeholder="recipient@example.com"
                  className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Subject *</label>
                <input
                  type="text"
                  value={composeForm.subject}
                  onChange={(e) => setComposeForm({ ...composeForm, subject: e.target.value })}
                  placeholder="Email subject"
                  className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Body *</label>
                <textarea
                  value={composeForm.body}
                  onChange={(e) => setComposeForm({ ...composeForm, body: e.target.value })}
                  placeholder="Write your email..."
                  rows={8}
                  className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm resize-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t border-neutral-200 dark:border-neutral-700">
              <button
                onClick={() => setShowCompose(false)}
                className="px-4 py-2 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSendEmail}
                disabled={sending || !composeForm.to || !composeForm.subject || !composeForm.body}
                className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 text-sm font-medium"
              >
                <Send className="w-4 h-4" />
                {sending ? 'Sending...' : 'Send Email'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Email Modal */}
      {selectedEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white truncate pr-4">
                {selectedEmail.subject}
              </h2>
              <button
                onClick={() => setSelectedEmail(null)}
                className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 flex-shrink-0"
              >
                <XCircle className="w-5 h-5 text-neutral-400" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex flex-wrap gap-4 text-sm">
                <div>
                  <span className="text-neutral-500">To:</span>
                  <span className="ml-1 text-neutral-900 dark:text-white">{selectedEmail.to}</span>
                </div>
                <div>
                  <span className="text-neutral-500">Date:</span>
                  <span className="ml-1 text-neutral-900 dark:text-white">
                    {new Date(selectedEmail.sentAt).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500">Status:</span>
                  <span className={`ml-1 px-2 py-0.5 text-xs font-medium rounded-full ${getStatusBadge(selectedEmail.status)}`}>
                    {selectedEmail.status}
                  </span>
                </div>
              </div>
              {(selectedEmail.customer || selectedEmail.deal) && (
                <div className="flex gap-4 text-sm">
                  {selectedEmail.customer && (
                    <Link
                      href={`/dashboard/customers?id=${selectedEmail.customer.id}`}
                      className="flex items-center gap-1 text-violet-600 hover:underline"
                    >
                      <User className="w-3 h-3" />
                      {selectedEmail.customer.name}
                    </Link>
                  )}
                  {selectedEmail.deal && (
                    <Link
                      href={`/dashboard/deals?id=${selectedEmail.deal.id}`}
                      className="flex items-center gap-1 text-violet-600 hover:underline"
                    >
                      <Briefcase className="w-3 h-3" />
                      {selectedEmail.deal.title}
                    </Link>
                  )}
                </div>
              )}
              <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4">
                <div
                  className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedEmail.body, { ALLOWED_TAGS: ['b', 'i', 'u', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'blockquote', 'code', 'pre', 'span', 'div'], ALLOWED_ATTR: ['href', 'target', 'style', 'class'] }) }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
