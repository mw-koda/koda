'use client';

import { useState, useEffect } from 'react';
import { issuesApi, Issue } from '@/lib/api/issues';

export function useRecentIssues(limit: number = 5) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        setIsLoading(true);
        const data = await issuesApi.getRecent(limit);
        setIssues(data);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch issues');
      } finally {
        setIsLoading(false);
      }
    };

    fetchIssues();
  }, [limit]);

  return { issues, isLoading, error };
}   