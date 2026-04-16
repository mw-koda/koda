import { useState, useEffect } from 'react';
import { issuesApi, Issue, IssueFilter } from '@/lib/api/issues';

export function useAllIssues(filters: IssueFilter = {}) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filterString = JSON.stringify(filters);

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        setIsLoading(true);
        // 2. Parse it back inside the effect
        const currentFilters = JSON.parse(filterString);
        const result = await issuesApi.findAll(currentFilters);
        
        setIssues(result.data);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch issues');
      } finally {
        setIsLoading(false);
      }
    };

    fetchIssues();
  }, [filterString]);

  return { issues, isLoading, error };
}