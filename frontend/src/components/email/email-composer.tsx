'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { X, Send, FileText, ChevronDown } from 'lucide-react';
import { RichTextEditor } from '@/components/ui/rich-text-editor';

interface Customer {
  id: string;
  name: string;
  email: string;
}

interface Deal {
  id: string;
  title: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

interface EmailComposerProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: Customer;
  deal?: Deal;
  onSent?: () => void;
}

export default function EmailComposer({ isOpen, onClose, customer, deal, onSent }: EmailComposerProps) {
  const { getToken } = useAuth();
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (customer) {
      setTo(customer.email);
    }
  }, [customer]);

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
    }
  }, [isOpen]);

  const fetchTemplates = async () => {
    try {
      const token = await getToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/emails/templates`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  };

  const applyTemplate = (template: EmailTemplate) => {
    // Replace placeholders with actual values
    let templateBody = template.body;
    let templateSubject = template.subject;

    if (customer) {
      templateBody = templateBody.replace(/\{\{name\}\}/g, customer.name);
      templateSubject = templateSubject.replace(/\{\{name\}\}/g, customer.name);
    }
    if (deal) {
      templateBody = templateBody.replace(/\{\{deal\}\}/g, deal.title);
      templateSubject = templateSubject.replace(/\{\{deal\}\}/g, deal.title);
    }

    setSubject(templateSubject);
    setBody(templateBody);
    setShowTemplates(false);
  };

  const sendEmail = async () => {
    if (!to || !subject || !body) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setSending(true);
      setError('');
      const token = await getToken();
      
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/emails/send`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to,
            subject,
            body,
            customerId: customer?.id,
            dealId: deal?.id,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send email');
      }

      // Reset form
      setTo('');
      setSubject('');
      setBody('');
      onSent?.();
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to send email');
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div 
        className="bg-white dark:bg-neutral-900 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Compose Email</h3>
          <button 
            onClick={onClose} 
            className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-colors"
          >
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-lg">
              {error}
            </div>
          )}

          {/* Template Selector */}
          <div className="relative">
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-600 dark:text-neutral-400 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800"
            >
              <FileText className="w-4 h-4" />
              Use Template
              <ChevronDown className="w-4 h-4" />
            </button>
            
            {showTemplates && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg z-10">
                {templates.length === 0 ? (
                  <div className="p-3 text-sm text-neutral-500">No templates available</div>
                ) : (
                  templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => applyTemplate(template)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700"
                    >
                      <div className="font-medium text-neutral-900 dark:text-white">{template.name}</div>
                      <div className="text-neutral-500 text-xs truncate">{template.subject}</div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* To Field */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">To</label>
            <input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="recipient@example.com"
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Subject Field */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Body Field */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Message</label>
            <RichTextEditor
              value={body}
              onChange={setBody}
              placeholder="Write your message..."
              minHeight="250px"
            />
          </div>

          {/* Context Info */}
          {(customer || deal) && (
            <div className="flex flex-wrap gap-2 text-xs">
              {customer && (
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                  Customer: {customer.name}
                </span>
              )}
              {deal && (
                <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
                  Deal: {deal.title}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-neutral-200 dark:border-neutral-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={sendEmail}
            disabled={sending || !to || !subject || !body}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {sending ? 'Sending...' : 'Send Email'}
          </button>
        </div>
      </div>
    </div>
  );
}
