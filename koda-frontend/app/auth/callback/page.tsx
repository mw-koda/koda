'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth } from '@/lib/auth';
import { roleRedirects, AppRole } from '@/lib/role-redirects';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setError('No token received. Please try again.');
      return;
    }

    auth.setToken(token);

    // Fetch the user's role from /auth/me to decide where to redirect
    fetch(`${API_URL}/auth/me`, {
      headers: auth.headers(),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch user');
        return res.json() as Promise<{ user: { role: string; is_onboarded: boolean } }>;
      })
      .then(({ user }) => {
        const normalizedRole = (user.role === 'team_lead' ? 'coordinator' : user.role) as AppRole;
        localStorage.setItem('selectedRole', normalizedRole);

        router.replace(roleRedirects[normalizedRole] ?? '/dashboard');
      })
      .catch(() => {
        auth.removeToken();
        setError('Authentication failed. Please try again.');
      });
  }, [router, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-surface">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => router.replace('/login')}
            className="text-accent-primary underline text-sm"
          >
            Back to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-surface">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-accent-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-text-muted text-sm font-mono">Signing you in...</p>
      </div>
    </div>
  );
}