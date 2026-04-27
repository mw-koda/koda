import { useEffect, useMemo, useState } from 'react';
import { internsApi, type InternRecord } from '@/lib/api/interns';
import { reportsApi, type ReportRecord } from '@/lib/api/reports';

export type ReportTab = 'weekly' | 'monthly';

export interface ReportRow {
  id: string;
  internName: string;
  title: string;
  period: string;
  submittedAt: string;
  status: 'pending' | 'reviewed' | string;
  content: string;
  coordinatorNote: string | null;
  type: 'weekly' | 'monthly';
}

function getReportType(report: ReportRecord): 'weekly' | 'monthly' | null {
  const title = (report.title || '').toLowerCase();

  if (title.startsWith('weekly report')) {
    return 'weekly';
  }

  if (title.startsWith('monthly report')) {
    return 'monthly';
  }

  return null;
}

function getDisplayName(intern: InternRecord): string {
  return intern.user?.name?.trim() || intern.user?.github_username?.trim() || `Intern ${intern.id}`;
}


export function useReports(filter: ReportTab) {
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const loadReports = async () => {
      setLoading(true);
      setError(null);

      try {
        const [interns, rawReports] = await Promise.all([
          internsApi.getAll(),
          reportsApi.findAll(),
        ]);

        if (!isActive) {
          return;
        }

        const internNameById = new Map<string, string>(
          interns.map((intern) => [intern.id, getDisplayName(intern)]),
        );

        const mappedReports = rawReports
          .map((report) => {
            const type = getReportType(report);

            if (!type) {
              return null;
            }

            return {
              id: report.id,
              internName: internNameById.get(report.intern_id) ?? `Intern ${report.intern_id}`,
              title: report.title || 'Untitled Report',
              period: `${report.period_start ? new Date(report.period_start).toLocaleDateString() : '—'} — ${report.period_end ? new Date(report.period_end).toLocaleDateString() : '—'}`,
              submittedAt: report.submitted_at || '',
              status: report.status,
              content: report.content || '',
              coordinatorNote: null,
              type,
            } satisfies ReportRow;
          })
          .filter((report): report is ReportRow => report !== null)
          .sort((a, b) => new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime());

        setReports(
          filter === 'weekly'
            ? mappedReports.filter((report) => report.type === 'weekly')
            : mappedReports.filter((report) => report.type === 'monthly'),
        );
      } catch (err: any) {
        if (!isActive) {
          return;
        }

        setError(err?.message || 'Failed to load reports');
        setReports([]);
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    void loadReports();

    return () => {
      isActive = false;
    };
  }, [filter]);

  const totalReports = useMemo(() => reports.length, [reports]);

  return { reports, loading, error, totalReports };
}