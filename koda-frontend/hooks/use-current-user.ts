'use client';

import { auth } from '@/lib/auth';
import { useEffect, useState } from 'react';
import { getPublicApiBaseUrl } from '@/lib/public-config';

const API_URL = getPublicApiBaseUrl();

export type CurrentUser = {
  id: string;
  role: 'admin' | 'coordinator' | 'intern' | 'team_lead';
  name: string | null;
  email: string | null;
  github_username: string;
  avatar_url: string | null;
  is_onboarded: boolean;
  batchId?: string | null;
  batch_id?: string | null;
  school?: string | null;
  school_name?: string | null;
};

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = auth.getToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    fetch(`${API_URL}/auth/me`, { headers: auth.headers() })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch user');
        return res.json() as Promise<{ user: CurrentUser }>;
      })
      .then(({ user }) => {
        setUser(user);
        setError(null);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to fetch user');
      })
      .finally(() => setIsLoading(false));
  }, []);

  return { user, isLoading, error };
}
