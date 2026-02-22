'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  ArrowLeft,
  DollarSign,
  User,
  Calendar,
  Edit,
  Trash2,
  Plus,
  FileText,
  StickyNote,
  Activity,
  CheckCircle,
  Clock,
  XCircle,
  Send,
  Building,
} from 'lucide-react';
import NotesList from '@/components/notes/notes-list';
import FileUpload from '@/components/documents/file-upload';
import { ActivityFeed } from '@/components/activity/activity-timeline';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useConfirmDialog } from '@/components/ui/use-confirm-dialog';

// Dynamic imports for heavy components
const EmailComposer = dynamic(() => import('@/components/email/email-composer'), { ssr: false, loading: () => null });
const AIDealAnalysis = dynamic(() => import('@/components/ai/ai-insights').then(m => ({ default: m.AIDealAnalysis })), { ssr: false, loading: () => <div className="h-32 animate-pulse bg-neutral-100 dark:bg-neutral-800 rounded-xl" /> });

interface Deal {
  id: string;
  title: string;
  value: number;
  stage: string;
  priority: string;
  notesText?: string;
  expectedCloseDate?: string;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: string;
    name: string;
    email: string;
    company?: string;
  };
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

const STAGES = ['lead', 'qualified', 'proposal', 'negotiation', 'closed-won', 'closed-lost'];

export default function DealDetailPage() {
  const { getToken } = useAuth();
  const params = useParams();
  const router = useRouter();
  const dealId = params.id as string;
  const { confirm, dialogProps } = useConfirmDialog();
  
  const [deal, setDeal] = useState<Deal | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'documents' | 'activity' | 'ai'>('overview');
  const [showEmailComposer, setShowEmailComposer] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [updating, setUpdating] = useState(false);

  const fetchDeal = async () => {
    try {
      const token = await getToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/deals/${dealId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const response = await res.json();
        setDeal(response.data || response);
      }
    } catch (error) {
      console.error('Failed to fetch deal:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      const token = await getToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/documents?dealId=${dealId}`,
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
    fetchDeal();
    fetchDocuments();
  }, [dealId]);

  const updateStage = async (newStage: string) => {
    if (!deal || updating) return;
    
    try {
      setUpdating(true);
      const token = await getToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/deals/${dealId}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ stage: newStage }),
        }
      );
      
      if (res.ok) {
        setDeal({ ...deal, stage: newStage });
      }
    } catch (error) {
      console.error('Failed to update stage:', error);
    } finally {
      setUpdating(false);
    }
  };

  const deleteDeal = async () => {
    const ok = await confirm({ title: 'Delete Deal', message: 'Are you sure you want to delete this deal? This action cannot be undone.', variant: 'danger', confirmLabel: 'Delete' });
    if (!ok) return;

    try {
      const token = await getToken();
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/deals/${dealId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      router.push('/dashboard/deals');
    } catch (error) {
      console.error('Failed to delete deal:', error);
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

  const getStageColor = (stage: string, isCurrent: boolean) => {
    if (stage === 'closed-won') return 'bg-green-500';
    if (stage === 'closed-lost') return 'bg-red-500';
    if (isCurrent) return 'bg-blue-500';
    
    const currentIndex = STAGES.indexOf(deal?.stage || '');
    const stageIndex = STAGES.indexOf(stage);
    
    if (stageIndex < currentIndex) return 'bg-blue-500';
    return 'bg-neutral-300 dark:bg-neutral-600';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'LOW': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      default: return 'bg-neutral-100 text-neutral-700';
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

  if (!deal) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Deal not found</h2>
          <Link href="/dashboard/deals" className="text-blue-600 hover:underline mt-2 inline-block">
            Back to Deals
          </Link>
        </div>
      </div>
    );
  }

  const completedTasks = deal.tasks.filter(t => t.status === 'DONE').length;
  const daysOpen = Math.floor((new Date().getTime() - new Date(deal.createdAt).getTime()) / (1000 * 60 * 60 * 24));

  const tabs = [
    { id: 'overview', label: 'Overview', icon: DollarSign },
    { id: 'notes', label: 'Notes', icon: StickyNote },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'ai', label: 'AI Analysis', icon: Activity },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/dashboard/deals"
          className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{deal.title}</h1>
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getPriorityColor(deal.priority)}`}>
              {deal.priority}
            </span>
          </div>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Created {new Date(deal.createdAt).toLocaleDateString()} · {daysOpen} days open
          </p>
        </div>
        <div className="flex items-center gap-2">
          {deal.customer && (
            <button
              onClick={() => setShowEmailComposer(true)}
              className="flex items-center gap-2 px-4 py-2 text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800"
            >
              <Send className="w-4 h-4" />
              Email
            </button>
          )}
          <button
            onClick={deleteDeal}
            className="p-2 text-neutral-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Pipeline Stage Selector */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5 mb-6">
        <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-4">Pipeline Stage</h3>
        <div className="flex items-center gap-2">
          {STAGES.filter(s => s !== 'closed-lost').map((stage, index) => {
            const isCurrent = deal.stage === stage;
            const isPast = STAGES.indexOf(stage) < STAGES.indexOf(deal.stage);
            
            return (
              <div key={stage} className="flex-1 flex items-center">
                <button
                  onClick={() => updateStage(stage)}
                  disabled={updating || deal.stage === 'closed-lost'}
                  className={`
                    flex-1 py-2 px-3 text-xs font-medium rounded-lg transition-all
                    ${isCurrent 
                      ? stage === 'closed-won' 
                        ? 'bg-green-500 text-white' 
                        : 'bg-blue-500 text-white'
                      : isPast
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                    }
                    ${updating ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  {stage}
                </button>
                {index < STAGES.length - 2 && (
                  <div className={`w-4 h-0.5 ${isPast || isCurrent ? 'bg-blue-300' : 'bg-neutral-200 dark:bg-neutral-700'}`} />
                )}
              </div>
            );
          })}
        </div>
        {deal.stage !== 'closed-won' && deal.stage !== 'closed-lost' && (
          <button
            onClick={() => updateStage('closed-lost')}
            disabled={updating}
            className="mt-3 text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
          >
            <XCircle className="w-4 h-4" />
            Mark as Lost
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xl font-bold text-neutral-900 dark:text-white">{formatCurrency(deal.value)}</p>
              <p className="text-xs text-neutral-500">Deal Value</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xl font-bold text-neutral-900 dark:text-white">{completedTasks}/{deal.tasks.length}</p>
              <p className="text-xs text-neutral-500">Tasks Done</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-xl font-bold text-neutral-900 dark:text-white">{daysOpen}</p>
              <p className="text-xs text-neutral-500">Days Open</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Calendar className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-xl font-bold text-neutral-900 dark:text-white">
                {deal.expectedCloseDate 
                  ? new Date(deal.expectedCloseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  : '-'
                }
              </p>
              <p className="text-xs text-neutral-500">Expected Close</p>
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
          {/* Customer & Details */}
          <div className="lg:col-span-1 space-y-6">
            {/* Customer Card */}
            {deal.customer && (
              <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Customer</h3>
                <Link
                  href={`/dashboard/customers/${deal.customer.id}`}
                  className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                >
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-white">{deal.customer.name}</p>
                    {deal.customer.company && (
                      <p className="text-sm text-neutral-500">{deal.customer.company}</p>
                    )}
                  </div>
                </Link>
              </div>
            )}

            {/* Notes */}
            {deal.notesText && (
              <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-3">Description</h3>
                <p className="text-neutral-600 dark:text-neutral-400 whitespace-pre-wrap">{deal.notesText}</p>
              </div>
            )}
          </div>

          {/* Tasks */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Tasks</h3>
                <Link
                  href={`/dashboard/tasks?dealId=${dealId}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  View All
                </Link>
              </div>
              {deal.tasks.length === 0 ? (
                <p className="text-neutral-500 text-center py-8">No tasks yet</p>
              ) : (
                <div className="space-y-2">
                  {deal.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          task.status === 'DONE' 
                            ? 'bg-green-500 border-green-500' 
                            : 'border-neutral-300 dark:border-neutral-600'
                        }`}>
                          {task.status === 'DONE' && (
                            <CheckCircle className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <span className={`${task.status === 'DONE' ? 'line-through text-neutral-400' : 'text-neutral-900 dark:text-white'}`}>
                          {task.title}
                        </span>
                      </div>
                      {task.dueDate && (
                        <span className={`text-sm ${
                          new Date(task.dueDate) < new Date() && task.status !== 'DONE'
                            ? 'text-red-500'
                            : 'text-neutral-500'
                        }`}>
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
          <NotesList dealId={dealId} />
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
                dealId={dealId}
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
          <ActivityFeed entityType="DEAL" entityId={dealId} />
        </div>
      )}

      {activeTab === 'ai' && (
        <div className="space-y-6">
          <AIDealAnalysis dealId={dealId} dealTitle={deal.title} />
        </div>
      )}

      {/* Email Composer Modal */}
      {deal.customer && (
        <EmailComposer
          isOpen={showEmailComposer}
          onClose={() => setShowEmailComposer(false)}
          customer={{ id: deal.customer.id, name: deal.customer.name, email: deal.customer.email }}
          deal={{ id: deal.id, title: deal.title }}
          onSent={() => {}}
        />
      )}
      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
