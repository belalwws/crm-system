'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, CheckCircle, XCircle, Mail } from 'lucide-react';

function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token || !email) {
      setStatus('error');
      setErrorMsg('Invalid verification link.');
      return;
    }

    const verify = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const res = await fetch(`${API_URL}/api/auth/verify-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, email }),
        });

        const data = await res.json();
        if (data.success) {
          setStatus('success');
        } else {
          setErrorMsg(data.message || 'Verification failed');
          setStatus('error');
        }
      } catch {
        setErrorMsg('Network error. Please try again.');
        setStatus('error');
      }
    };

    verify();
  }, [token, email]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-gray-200 dark:border-neutral-800 p-8">
          {status === 'verifying' && (
            <div className="text-center py-8">
              <Loader2 className="w-10 h-10 animate-spin text-blue-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Verifying Email...</h2>
              <p className="text-gray-500 dark:text-gray-400">Please wait while we verify your email address.</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Email Verified!</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Your email has been verified successfully. You now have full access to all features.
              </p>
              <Link
                href="/dashboard"
                className="inline-flex px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Go to Dashboard
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-7 h-7 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Verification Failed</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">{errorMsg}</p>
              <Link
                href="/dashboard"
                className="inline-flex px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Go to Dashboard
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 dark:bg-neutral-950 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>}>
      <VerifyEmailForm />
    </Suspense>
  );
}
