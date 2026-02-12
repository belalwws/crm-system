'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import api from '@/lib/api';
import { Clock, AlertTriangle, X } from 'lucide-react';

export function TrialBanner() {
  const { getToken } = useAuth();
  const [visible, setVisible] = useState(false);
  const [daysLeft, setDaysLeft] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  const checkTrial = useCallback(async () => {
    try {
      const token = await getToken();
      api.setToken(token);
      const res = await api.getSubscription();
      if (res.success && res.data) {
        const sub = res.data as { status: string; trialEnd: string | null };
        if (sub.status === 'TRIALING' && sub.trialEnd) {
          const end = new Date(sub.trialEnd);
          const days = Math.max(0, Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
          setDaysLeft(days);
          setVisible(true);
        }
      }
    } catch {
      // silent
    }
  }, [getToken]);

  useEffect(() => { checkTrial(); }, [checkTrial]);

  if (!visible || dismissed) return null;

  const urgent = daysLeft <= 3;

  return (
    <div className={`relative px-4 py-2.5 text-sm flex items-center justify-center gap-3 ${
      urgent
        ? 'bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400 border-b border-red-200 dark:border-red-800'
        : 'bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400 border-b border-amber-200 dark:border-amber-800'
    }`}>
      {urgent ? <AlertTriangle className="w-4 h-4 shrink-0" /> : <Clock className="w-4 h-4 shrink-0" />}
      <span>
        {daysLeft <= 0
          ? 'Your free trial has expired.'
          : `Your free trial ends in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}.`
        }
        {' '}
        <Link href="/dashboard/billing" className="underline font-medium hover:opacity-80">
          Upgrade now
        </Link>
      </span>
      <button onClick={() => setDismissed(true)} className="absolute right-3 p-1 hover:opacity-70">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
