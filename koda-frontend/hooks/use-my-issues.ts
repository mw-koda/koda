'use client';

import { useState, useEffect } from 'react';
import { issuesApi, Issue, IssueFilter } from '@/lib/api/issues';
import { useCurrentUser } from './use-current-user';

export function useMyIssues(filters: IssueFilter = {}) {
  const { user, isLoading: userLoading } = useCurrentUser();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filterString = JSON.stringify(filters);

  useEffect(() => {
    if (userLoading) return;
    if (!user || !user.intern_id) {
      setIssues([]);
      setIsLoading(false);
      return;
    }

    const fetchIssues = async () => {
      try {
        setIsLoading(true);
        const currentFilters = JSON.parse(filterString);
        const result = await issuesApi.findByInternId(user.intern_id!, currentFilters);
        
        setIssues(result);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch issues');
      } finally {
        setIsLoading(false);
      }
    };

    fetchIssues();
  }, [filterString, user, userLoading]);

  return { issues, isLoading: isLoading || userLoading, error };
}
