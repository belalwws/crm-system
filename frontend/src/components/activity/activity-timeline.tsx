'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  ArrowRight, 
  Mail, 
  FileText, 
  Upload, 
  CheckCircle,
  Clock
} from 'lucide-react';

interface Activity {
  id: string;
  type: string;
  entityType: string;
  entityId: string;
  title: string;
  details?: Record<string, any>;
  createdAt: string;
}

interface ActivityTimelineProps {
  entityType?: 'customer' | 'deal' | 'task';
  entityId?: string;
  limit?: number;
}

export function ActivityTimeline({ entityType, entityId, limit = 20 }: ActivityTimelineProps) {
  const { getToken } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        const token = await getToken();
        let url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/activities`;
        
        if (entityType && entityId) {
          url = `${url}/${entityType}/${entityId}`;
        } else {
          url = `${url}?limit=${limit}`;
        }

        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setActivities(data);
        }
      } catch (error) {
        console.error('Failed to fetch activities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [entityType, entityId, limit]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'CREATED':
        return <Plus className="w-4 h-4 text-green-600" />;
      case 'UPDATED':
        return <Pencil className="w-4 h-4 text-blue-600" />;
      case 'DELETED':
        return <Trash2 className="w-4 h-4 text-red-600" />;
      case 'STATUS_CHANGED':
      case 'STAGE_CHANGED':
        return <ArrowRight className="w-4 h-4 text-purple-600" />;
      case 'EMAIL_SENT':
        return <Mail className="w-4 h-4 text-cyan-600" />;
      case 'NOTE_ADDED':
        return <FileText className="w-4 h-4 text-yellow-600" />;
      case 'FILE_UPLOADED':
        return <Upload className="w-4 h-4 text-orange-600" />;
      case 'TASK_COMPLETED':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return <Clock className="w-4 h-4 text-neutral-500" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'CREATED':
        return 'bg-green-100 dark:bg-green-900/30';
      case 'UPDATED':
        return 'bg-blue-100 dark:bg-blue-900/30';
      case 'DELETED':
        return 'bg-red-100 dark:bg-red-900/30';
      case 'STATUS_CHANGED':
      case 'STAGE_CHANGED':
        return 'bg-purple-100 dark:bg-purple-900/30';
      case 'EMAIL_SENT':
        return 'bg-cyan-100 dark:bg-cyan-900/30';
      case 'NOTE_ADDED':
        return 'bg-yellow-100 dark:bg-yellow-900/30';
      case 'FILE_UPLOADED':
        return 'bg-orange-100 dark:bg-orange-900/30';
      case 'TASK_COMPLETED':
        return 'bg-green-100 dark:bg-green-900/30';
      default:
        return 'bg-neutral-100 dark:bg-neutral-800';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="py-8 text-center">
        <div className="w-6 h-6 border-2 border-neutral-300 border-t-black rounded-full animate-spin mx-auto"></div>
        <p className="mt-2 text-sm text-neutral-500">Loading activity...</p>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="py-8 text-center text-neutral-500">
        <Clock className="w-10 h-10 mx-auto mb-2 opacity-30" />
        <p>No activity yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity, index) => (
        <div key={activity.id} className="flex gap-3">
          {/* Timeline line */}
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getActivityColor(activity.type)}`}>
              {getActivityIcon(activity.type)}
            </div>
            {index < activities.length - 1 && (
              <div className="w-0.5 h-full bg-neutral-200 dark:bg-neutral-700 mt-2"></div>
            )}
          </div>
          
          {/* Content */}
          <div className="flex-1 pb-4">
            <p className="text-sm text-neutral-900 dark:text-white">{activity.title}</p>
            <p className="text-xs text-neutral-500 mt-1">{formatDate(activity.createdAt)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// Dashboard Activity Feed Component
interface ActivityFeedProps {
  entityType?: string;
  entityId?: string;
}

export function ActivityFeed({ entityType, entityId }: ActivityFeedProps = {}) {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-neutral-900 dark:text-white">Recent Activity</h3>
        {!entityType && (
          <a href="/dashboard/activity" className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400">
            View all
          </a>
        )}
      </div>
      <ActivityTimeline 
        entityType={entityType as 'customer' | 'deal' | 'task' | undefined} 
        entityId={entityId} 
        limit={10} 
      />
    </div>
  );
}
