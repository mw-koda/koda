'use client';

import { useState, useEffect } from 'react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { issuesApi, Issue } from '@/lib/api/issues';
import { attendanceApi, type AttendanceSummary } from '@/lib/api/attendance';
import { auth } from '@/lib/auth';
import { getPublicApiBaseUrl } from '@/lib/public-config';

const API_BASE_URL = getPublicApiBaseUrl();

export interface Intern {
  id: string;
  name: string;
  github_username: string;
  role: string;
  team_id?: string;
  batch_id?: string;
  avatar_url?: string;
}

export interface Report {
  id: string;
  intern_id: string;
  status: string;
  period_start: string;
  period_end: string;
  created_at: string;
}

export function useInternDashboard() {
  const { user, isLoading: userLoading } = useCurrentUser();
  
  const [interns, setInterns] = useState<Intern[]>([]);
  const [recentIssues, setRecentIssues] = useState<Issue[]>([]);
  const [openIssuesCount, setOpenIssuesCount] = useState(0);
  const [closedIssuesCount, setClosedIssuesCount] = useState(0);
  const [attendanceSummary, setAttendanceSummary] =
    useState<AttendanceSummary | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const batchId = user.batchId ?? user.batch_id ?? localStorage.getItem('userBatchId');
        
        // 1. Fetch interns
        let fetchedInterns: Intern[] = [];
        if (batchId) {
          const internsRes = await fetch(`${API_BASE_URL}/interns?batchId=${batchId}`, {
            headers: auth.headers(),
          });
          if (internsRes.ok) {
            fetchedInterns = await internsRes.json();
            setInterns(fetchedInterns);
          }
        } else {
          // Fallback to all interns if no batch
          const internsRes = await fetch(`${API_BASE_URL}/interns`, {
            headers: auth.headers(),
          });
          if (internsRes.ok) {
            fetchedInterns = await internsRes.json();
            setInterns(fetchedInterns);
          }
        }

        // 2. Fetch recent issues
        try {
          const issues = await issuesApi.getRecent(4);
          setRecentIssues(issues);
        } catch (e) {
          console.error('Failed to fetch recent issues', e);
        }

        // 3. Fetch open issues count
        try {
          const openIssuesRes = await issuesApi.findAll({ state: 'open', limit: 1 });
          setOpenIssuesCount(openIssuesRes.total ?? openIssuesRes.data.length ?? 0);
        } catch (e) {
          console.error('Failed to fetch open issues count', e);
        }

        // 3.5. Fetch closed issues count for the current intern
        if (user.intern_id) {
          try {
            const closedIssues = await issuesApi.findByInternId(user.intern_id, { state: 'closed' });
            setClosedIssuesCount(closedIssues.length);
          } catch (e) {
            console.error('Failed to fetch closed issues count', e);
          }
        }

        // 4. Fetch attendance summary for the current intern
        if (user.intern_id) {
          try {
            const summary = await attendanceApi.findByInternId(user.intern_id);
            setAttendanceSummary(summary);
          } catch (e) {
            console.error('Failed to fetch attendance summary', e);
            setAttendanceSummary(null);
          }
        } else {
          setAttendanceSummary(null);
        }

      } catch (err: any) {
        setError(err.message || 'Failed to fetch dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, userLoading]);

  return {
    interns,
    recentIssues,
    openIssuesCount,
    closedIssuesCount,
    attendanceSummary,
    isLoading: isLoading || userLoading,
    error,
    user
  };
}
