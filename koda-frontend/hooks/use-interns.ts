import { useEffect, useState } from 'react';
import { internsApi, type InternRecord } from '@/lib/api/interns';
import type { ApiUser } from '@/lib/api/users';

export type InternListItem = {
  id: string;
  userId: string;
  teamId: string | null;
  name: string;
  github: string;
  school: string | null;
  avatarInitials: string;
  assignedPeriod: string;
  reportStatus: 'pending' | 'submitted' | 'reviewed';
  latestReportTitle: string | null;
  latestReportSubmittedAt: string | null;
  issuesThisWeek: number;
  user: ApiUser | null;
  intern: InternRecord;
  latestReport: {
    id: string;
    title: string | null;
    period_start: string | null;
    period_end: string | null;
    submitted_at: string | null;
    status: string | null;
  } | null;
};

function buildAvatarInitials(user: ApiUser): string {
  const fromName = user.name?.trim();

  if (fromName) {
    const initials = fromName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');

    if (initials) {
      return initials;
    }
  }

  return user.github_username.slice(0, 2).toUpperCase();
}

function formatPeriod(start?: string | null, end?: string | null): string {
  if (!start && !end) {
    return 'No reports yet';
  }

  const startLabel = start ? new Date(start).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown';
  const endLabel = end ? new Date(end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown';

  return `${startLabel} - ${endLabel}`;
}

export function useInterns(batchId?: string) {
  const [interns, setInterns] = useState<InternListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadInterns() {
      try {
        setIsLoading(true);
        setError(null);

        const internRows = await internsApi.getAll(batchId ? { batchId } : undefined);
        const rows = internRows.map((intern) => {
          const user = intern.user
            ? ({
                id: intern.user.id,
                github_id: null,
                github_username: intern.user.github_username,
                name: intern.user.name,
                email: intern.user.email,
                avatar_url: intern.user.avatar_url,
                role: 'intern',
                is_onboarded: true,
                created_at: intern.created_at ?? '',
                updated_at: intern.created_at ?? '',
              } satisfies ApiUser)
            : null;

          const sortedReports = [...intern.reports].sort((a, b) => {
            const aTime = a.submitted_at ? new Date(a.submitted_at).getTime() : 0;
            const bTime = b.submitted_at ? new Date(b.submitted_at).getTime() : 0;
            return bTime - aTime;
          });

          const latestReport = sortedReports[0] ?? null;
          const reportStatus =
            latestReport?.status === 'reviewed'
              ? 'reviewed'
              : latestReport?.status === 'submitted'
                ? 'submitted'
                : 'pending';

          return {
            id: intern.id,
            userId: intern.user_id,
            teamId: intern.team_id,
            name: user?.name ?? user?.github_username ?? 'Unknown Intern',
            github: user?.github_username ?? 'unknown',
            school: intern.school ?? null,
            avatarInitials: user ? buildAvatarInitials(user) : 'UN',
            assignedPeriod: formatPeriod(latestReport?.period_start, latestReport?.period_end),
            reportStatus,
            latestReportTitle: latestReport?.title ?? null,
            latestReportSubmittedAt: latestReport?.submitted_at ?? null,
            issuesThisWeek: intern.issue_assignments.length,
            user,
            intern,
            latestReport,
          } satisfies InternListItem;
        });

        if (isActive) {
          setInterns(rows);
        }
      } catch (err) {
        if (isActive) {
          if (err instanceof Error && /404|Not Found/i.test(err.message)) {
            setInterns([]);
            return;
          }

          setError(err instanceof Error ? err : new Error('Failed to fetch interns'));
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadInterns();

    return () => {
      isActive = false;
    };
  }, [batchId]);

  return { interns, isLoading, error };
}