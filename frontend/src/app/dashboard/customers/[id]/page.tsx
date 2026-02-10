'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Mail,
  Phone,
  Building,
  MapPin,
  Calendar,
  Edit,
  Trash2,
  Briefcase,
  DollarSign,
  Plus,
  FileText,
  StickyNote,
  Activity,
  MoreHorizontal,
  Send,
  Clock,
} from 'lucide-react';
import NotesList from '@/components/notes/notes-list';
import FileUpload from '@/components/documents/file-upload';
import { ActivityFeed } from '@/components/activity/activity-timeline';
import EmailComposer from '@/components/email/email-composer';
import { AICustomerInsights } from '@/components/ai/ai-insights';
import { AIEmailComposer } from '@/components/ai/ai-email-composer';
import { api } from '@/lib/api';

function CustomerTimeline({ customerId }: { customerId: string }) {
  const { getToken } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        if (token) api.setToken(token);
        const res = await api.getCustomerTimeline(customerId);
        const resData = res.data as any;
        setEvents(resData?.events || resData || []);
      } catch (err) {
        console.error('Failed to fetch timeline:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [customerId, getToken]);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'CUSTOMER_CREATED': return { icon: Plus, color: 'text-green-500 bg-green-50 dark:bg-green-900/20' };
      case 'STATUS_CHANGED': return { icon: Activity, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' };
      case 'DEAL_CREATED': return { icon: Briefcase, color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20' };
      case 'STAGE_CHANGED': return { icon: Activity, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' };
      case 'DEAL_WON': return { icon: DollarSign, color: 'text-green-500 bg-green-50 dark:bg-green-900/20' };
      case 'DEAL_LOST': return { icon: Trash2, color: 'text-red-500 bg-red-50 dark:bg-red-900/20' };
      case 'NOTE_ADDED': return { icon: StickyNote, color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' };
      case 'EMAIL_SENT': return { icon: Mail, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' };
      case 'MEETING_SCHEDULED': return { icon: Calendar, color: 'text-teal-500 bg-teal-50 dark:bg-teal-900/20' };
      case 'TASK_CREATED': return { icon: Activity, color: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20' };
      case 'DOCUMENT_UPLOADED': return { icon: FileText, color: 'text-violet-500 bg-violet-50 dark:bg-violet-900/20' };
      default: return { icon: Clock, color: 'text-neutral-500 bg-neutral-50 dark:bg-neutral-800' };
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4 animate-pulse">
            <div className="w-10 h-10 bg-neutral-200 dark:bg-neutral-800 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 bg-neutral-200 dark:bg-neutral-800 rounded" />
              <div className="h-3 w-1/2 bg-neutral-200 dark:bg-neutral-800 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700">
        <Clock className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
        <p className="text-neutral-500">No timeline events yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
      <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Timeline</h3>
      <div className="relative">
        <div className="absolute left-5 top-0 bottom-0 w-px bg-neutral-200 dark:bg-neutral-700" />
        <div className="space-y-6">
          {events.map((event: any) => {
            const { icon: EventIcon, color } = getEventIcon(event.type);
            return (
              <div key={event.id} className="relative flex gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 ${color}`}>
                  <EventIcon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <p className="text-sm text-neutral-900 dark:text-white">{event.description}</p>
                  {event.metadata && Object.keys(event.metadata).length > 0 && (
                    <div className="mt-1 text-xs text-neutral-500">
                      {event.metadata.from && event.metadata.to && (
                        <span>{event.metadata.from} → {event.metadata.to}</span>
                      )}
                    </div>
                  )}
                  <p className="text-xs text-neutral-400 mt-1">
                    {new Date(event.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
  notesText?: string;
  status: string;
  createdAt: string;
  deals: {
    id: string;
    title: string;
    value: number;
    stage: string;
    createdAt: string;
  }[];
  tasks: {
    id: string;
    title: string;
    status: string;
    dueDate?: string;
  }[];
}

interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  createdAt: string;
}

export default function CustomerDetailPage() {
  const { getToken } = useAuth();
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;
  
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'documents' | 'activity' | 'timeline' | 'ai'>('overview');
  const [showEmailComposer, setShowEmailComposer] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  const fetchCustomer = async () => {
    try {
      const token = await getToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/customers/${customerId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const response = await res.json();
        setCustomer(response.data || response);
      }
    } catch (error) {
      console.error('Failed to fetch customer:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      const token = await getToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/documents?customerId=${customerId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    }
  };

  useEffect(() => {
    fetchCustomer();
    fetchDocuments();
  }, [customerId]);

  const deleteCustomer = async () => {
    if (!confirm('Are you sure you want to delete this customer? This action cannot be undone.')) return;

    try {
      const token = await getToken();
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/customers/${customerId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      router.push('/dashboard/customers');
    } catch (error) {
      console.error('Failed to delete customer:', error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'INACTIVE': return 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400';
      case 'LEAD': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      default: return 'bg-neutral-100 text-neutral-700';
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'closed-won': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'closed-lost': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'negotiation': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      case 'proposal': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'qualified': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      default: return 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400';
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 w-48 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
        <div className="h-64 bg-neutral-200 dark:bg-neutral-800 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Customer not found</h2>
          <Link href="/dashboard/customers" className="text-blue-600 hover:underline mt-2 inline-block">
            Back to Customers
          </Link>
        </div>
      </div>
    );
  }

  const totalDealValue = customer.deals.reduce((sum, deal) => sum + deal.value, 0);
  const wonDeals = customer.deals.filter(d => d.stage === 'closed-won');
  const wonValue = wonDeals.reduce((sum, deal) => sum + deal.value, 0);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Building },
    { id: 'notes', label: 'Notes', icon: StickyNote },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'timeline', label: 'Timeline', icon: Clock },
    { id: 'ai', label: 'AI Insights', icon: Activity },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/dashboard/customers"
          className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{customer.name}</h1>
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(customer.status)}`}>
              {customer.status}
            </span>
          </div>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Customer since {new Date(customer.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowEmailComposer(true)}
            className="flex items-center gap-2 px-4 py-2 text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800"
          >
            <Send className="w-4 h-4" />
            Email
          </button>
          <button
            onClick={deleteCustomer}
            className="p-2 text-neutral-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">{customer.deals.length}</p>
              <p className="text-sm text-neutral-500">Total Deals</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <DollarSign className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">{formatCurrency(totalDealValue)}</p>
              <p className="text-sm text-neutral-500">Pipeline Value</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">{formatCurrency(wonValue)}</p>
              <p className="text-sm text-neutral-500">Won Revenue</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-neutral-200 dark:border-neutral-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-black dark:border-white text-neutral-900 dark:text-white'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contact Info */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Contact Information</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-neutral-400" />
                  <a href={`mailto:${customer.email}`} className="text-blue-600 hover:underline">
                    {customer.email}
                  </a>
                </div>
                {customer.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-neutral-400" />
                    <a href={`tel:${customer.phone}`} className="text-neutral-700 dark:text-neutral-300 hover:underline">
                      {customer.phone}
                    </a>
                  </div>
                )}
                {customer.company && (
                  <div className="flex items-center gap-3">
                    <Building className="w-5 h-5 text-neutral-400" />
                    <span className="text-neutral-700 dark:text-neutral-300">{customer.company}</span>
                  </div>
                )}
                {customer.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-neutral-400 mt-0.5" />
                    <span className="text-neutral-700 dark:text-neutral-300">{customer.address}</span>
                  </div>
                )}
              </div>
            </div>

            {customer.notesText && (
              <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-3">About</h3>
                <p className="text-neutral-600 dark:text-neutral-400 whitespace-pre-wrap">{customer.notesText}</p>
              </div>
            )}
          </div>

          {/* Deals & Tasks */}
          <div className="lg:col-span-2 space-y-6">
            {/* Deals */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Deals</h3>
                <Link
                  href={`/dashboard/deals?customerId=${customerId}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  View All
                </Link>
              </div>
              {customer.deals.length === 0 ? (
                <p className="text-neutral-500 text-center py-4">No deals yet</p>
              ) : (
                <div className="space-y-3">
                  {customer.deals.slice(0, 5).map((deal) => (
                    <Link
                      key={deal.id}
                      href={`/dashboard/deals/${deal.id}`}
                      className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-neutral-900 dark:text-white">{deal.title}</p>
                        <p className="text-sm text-neutral-500">
                          {new Date(deal.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-neutral-900 dark:text-white">{formatCurrency(deal.value)}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getStageColor(deal.stage)}`}>
                          {deal.stage}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Tasks */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Tasks</h3>
                <Link
                  href={`/dashboard/tasks?customerId=${customerId}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  View All
                </Link>
              </div>
              {customer.tasks.length === 0 ? (
                <p className="text-neutral-500 text-center py-4">No tasks yet</p>
              ) : (
                <div className="space-y-2">
                  {customer.tasks.slice(0, 5).map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          task.status === 'DONE' ? 'bg-green-500' :
                          task.status === 'IN_PROGRESS' ? 'bg-blue-500' : 'bg-neutral-400'
                        }`} />
                        <span className="text-neutral-900 dark:text-white">{task.title}</span>
                      </div>
                      {task.dueDate && (
                        <span className="text-sm text-neutral-500">
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'notes' && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
          <NotesList customerId={customerId} />
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Documents</h3>
            <button
              onClick={() => setShowUpload(!showUpload)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-black text-white dark:bg-white dark:text-black rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100"
            >
              <Plus className="w-4 h-4" />
              Upload
            </button>
          </div>

          {showUpload && (
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
              <FileUpload
                customerId={customerId}
                onUploadComplete={() => {
                  setShowUpload(false);
                  fetchDocuments();
                }}
              />
            </div>
          )}

          {documents.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700">
              <FileText className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
              <p className="text-neutral-500">No documents uploaded yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-neutral-400" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-neutral-900 dark:text-white truncate">{doc.name}</p>
                      <p className="text-xs text-neutral-500">{formatFileSize(doc.size)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
          <ActivityFeed entityType="CUSTOMER" entityId={customerId} />
        </div>
      )}

      {activeTab === 'timeline' && (
        <CustomerTimeline customerId={customerId} />
      )}

      {activeTab === 'ai' && (
        <div className="space-y-6">
          <AICustomerInsights customerId={customerId} customerName={customer.name} />
          <AIEmailComposer customerId={customerId} customerName={customer.name} />
        </div>
      )}

      {/* Email Composer Modal */}
      <EmailComposer
        isOpen={showEmailComposer}
        onClose={() => setShowEmailComposer(false)}
        customer={{ id: customer.id, name: customer.name, email: customer.email }}
        onSent={() => {
          // Could refresh activity or show success message
        }}
      />
    </div>
  );
}
