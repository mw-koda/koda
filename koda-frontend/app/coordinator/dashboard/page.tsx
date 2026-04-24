'use client';

import JoinBatchGatekeeperModal from '@/components/join-batch-gatekeeper-modal';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useAllIssues } from '@/hooks/use-all-issues';
import { useAttendanceSummary } from '@/hooks/use-attendance-summary';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useInterns } from '@/hooks/use-interns';
import { Clock, FileText, GitPullRequest, Users } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

function normalizeIssueStatus(status: string) {
  if (status === 'in_progress') {
    return 'in-progress';
  }

  return status;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function getIssueStatusClass(status: string) {
  switch (status) {
    case 'in-progress':
      return 'bg-accent-warning/10 text-accent-warning border-accent-warning/30';
    case 'closed':
      return 'bg-accent-primary/10 text-accent-primary border-accent-primary/30';
    case 'open':
      return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    default:
      return 'bg-text-muted/10 text-text-muted border-text-muted/30';
  }
}

function getAttendanceBarColor(rate: number) {
  if (rate >= 90) return 'bg-accent-primary';
  if (rate >= 70) return 'bg-accent-warning';
  return 'bg-red-500';
}

function getAttendanceBadge(rate: number) {
  if (rate >= 90) {
    return {
      label: 'Excellent',
      class: 'bg-accent-primary/10 text-accent-primary border-accent-primary/30',
    };
  }

  if (rate >= 70) {
    return {
      label: 'Good',
      class: 'bg-accent-warning/10 text-accent-warning border-accent-warning/30',
    };
  }

  return {
    label: 'At Risk',
    class: 'bg-red-500/10 text-red-400 border-red-500/30',
  };
}

function formatMinutes(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

function formatTime(isoString: string | null) {
  if (!isoString) {
    return '--';
  }

  return new Date(isoString).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

export default function CoordinatorDashboardPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [persistedSchool, setPersistedSchool] = useState<string | null>(null);
  const [persistedBatchId, setPersistedBatchId] = useState<string | undefined>(
    undefined,
  );
  const [hasBatchAssignment, setHasBatchAssignment] = useState(false);

  const { user, isLoading } = useCurrentUser();
  const safeBatchId = useMemo(() => {
    if (!persistedBatchId) {
      return undefined;
    }

    return isUuid(persistedBatchId) ? persistedBatchId : undefined;
  }, [persistedBatchId]);

  const {
    interns: schoolScopedInterns,
    isLoading: isInternsLoading,
    error: internsError,
  } = useInterns(safeBatchId);
  const { issues: allIssues, isLoading: isIssuesLoading, error: issuesError } =
    useAllIssues();

  const internIdsKey = useMemo(
    () => schoolScopedInterns.map((intern) => intern.id).join(','),
    [schoolScopedInterns],
  );

  const stableInternIds = useMemo(
    () => (internIdsKey ? internIdsKey.split(',') : []),
    [internIdsKey],
  );

  const {
    attendanceByInternId,
    isLoading: isAttendanceLoading,
    error: attendanceError,
  } = useAttendanceSummary(stableInternIds);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || isLoading) {
      return;
    }

    const localSchool = localStorage.getItem('userSchool');
    const localBatchId = localStorage.getItem('userBatchId');
    const assignedBatchId = user?.batchId ?? user?.batch_id ?? localBatchId;

    setPersistedSchool(localSchool);
    setPersistedBatchId(assignedBatchId ? String(assignedBatchId) : undefined);
    setHasBatchAssignment(Boolean(assignedBatchId));
  }, [isLoading, isMounted, user]);

  const coordinatorSchool = useMemo(() => {
    return user?.school ?? user?.school_name ?? persistedSchool ?? null;
  }, [persistedSchool, user]);

  const school = coordinatorSchool ?? 'School not assigned';

  const handleJoinBatch = async ({
    batchCode,
    school: schoolName,
  }: {
    batchCode: string;
    school: string;
  }) => {
    const trimmedBatchCode = batchCode.trim();
    const trimmedSchoolName = schoolName.trim();

    localStorage.setItem('userBatchId', trimmedBatchCode);
    localStorage.setItem('userSchool', trimmedSchoolName);
    setPersistedSchool(trimmedSchoolName);
    setPersistedBatchId(trimmedBatchCode || undefined);
    setHasBatchAssignment(true);
  };

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const pendingReports = schoolScopedInterns.filter(
    (intern) => intern.reportStatus === 'pending',
  );

  const openIssuesCount = allIssues.filter((issue) => issue.state === 'open').length;

  const recentIssues = [...allIssues]
    .sort(
      (a, b) =>
        new Date(b.updated_at ?? b.created_at ?? 0).getTime() -
        new Date(a.updated_at ?? a.created_at ?? 0).getTime(),
    )
    .slice(0, 5);

  const attendanceSummary = useMemo(() => {
    const uniqueDates = new Set<string>();

    for (const summary of Object.values(attendanceByInternId)) {
      for (const log of summary.logs) {
        uniqueDates.add(log.timeIn.slice(0, 10));
      }
    }

    const allDates = uniqueDates.size || 1;

    return schoolScopedInterns.map((intern) => {
      const summary = attendanceByInternId[intern.id];
      const logs = summary?.logs ?? [];
      const totalMinutes = Math.round((summary?.totalHours ?? 0) * 60);
      const daysPresent = new Set(logs.map((log) => log.timeIn.slice(0, 10))).size;
      const latestLog = [...logs].sort(
        (a, b) => new Date(b.timeIn).getTime() - new Date(a.timeIn).getTime(),
      )[0];
      const attendanceRate = Math.min(100, Math.round((daysPresent / allDates) * 100));

      return { intern, totalMinutes, daysPresent, attendanceRate, latestLog };
    });
  }, [attendanceByInternId, schoolScopedInterns]);

  const pageError =
    internsError?.message ?? issuesError ?? attendanceError?.message ?? null;

  if (!isMounted || isLoading) {
    return <div className="p-8 text-text-muted">Loading dashboard...</div>;
  }

  const isPageLoading = isInternsLoading || isIssuesLoading || isAttendanceLoading;

  return (
    <div className="p-8">
      <JoinBatchGatekeeperModal
        isOpen={!hasBatchAssignment}
        roleLabel="Coordinator"
        onJoin={handleJoinBatch}
      />
      {pageError ? (
        <div className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {pageError}
        </div>
      ) : null}

      <div className="mb-8">
        <h1 className="text-4xl font-mono font-bold text-text-primary mb-2">
          Coordinator Dashboard
        </h1>
        <p className="text-text-primary">{school}</p>
        <p className="text-text-primary">{today}</p>
        {isPageLoading ? (
          <p className="text-xs text-text-muted mt-2">Refreshing live data...</p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6 mb-8">
        <Card className="bg-bg-surface border-border-color p-6 card-glow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
                Total Interns
              </p>
              <p className="text-4xl font-mono font-bold text-text-primary mb-2">
                {schoolScopedInterns.length}
              </p>
            </div>
            <div className="p-2 bg-accent-primary/10 rounded-lg">
              <Users className="w-6 h-6 text-accent-primary" />
            </div>
          </div>
        </Card>

        <Card className="bg-bg-surface border-border-color p-6 card-glow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
                Reports Pending
              </p>
              <p className="text-4xl font-mono font-bold text-text-primary mb-2">
                {pendingReports.length}
              </p>
            </div>
            <div className="p-2 bg-accent-primary/10 rounded-lg">
              <FileText className="w-6 h-6 text-accent-primary" />
            </div>
          </div>
        </Card>

        <Card className="bg-bg-surface border-border-color p-6 card-glow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
                Open GitHub Issues
              </p>
              <p className="text-4xl font-mono font-bold text-text-primary mb-2">
                {openIssuesCount}
              </p>
            </div>
            <div className="p-2 bg-accent-primary/10 rounded-lg">
              <GitPullRequest className="w-6 h-6 text-accent-primary" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="bg-bg-surface border-border-color p-6">
          <h2 className="text-xl font-mono font-semibold text-text-primary mb-4">
            Recent GitHub Activity Feed
          </h2>
          <div className="space-y-3">
            {recentIssues.map((issue) => {
              const issueStatus = normalizeIssueStatus(issue.state);
              const activityDate = issue.updated_at ?? issue.created_at ?? new Date().toISOString();

              return (
                <div
                  key={issue.id}
                  className="p-3 bg-bg-elevated rounded-lg border border-border-color"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <GitPullRequest className="w-4 h-4 text-text-muted mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-text-primary truncate">
                          {issue.title}
                        </p>
                        <p className="text-xs text-text-muted mt-0.5">
                          {issue.repo_id} • {issue.assignee_name ?? 'Unassigned'} • {timeAgo(activityDate)}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs flex-shrink-0 ${getIssueStatusClass(issueStatus)}`}
                    >
                      {issueStatus}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
          <Link
            href="/coordinator/issue-tracking-page"
            className="inline-block mt-4 text-sm text-accent-primary hover:text-accent-primary/80 transition-colors"
          >
            View all issues →
          </Link>
        </Card>

        <Card className="bg-bg-surface border-border-color p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-mono font-semibold text-text-primary">
              Attendance Log Summary
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-text-muted">
              <Clock className="w-3.5 h-3.5" />
              Total work rendered
            </div>
          </div>

          <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-bg-elevated scrollbar-track-transparent bg-bg-surface ">
            {attendanceSummary.map(
              ({ intern, totalMinutes, daysPresent, attendanceRate, latestLog }) => {
                const badge = getAttendanceBadge(attendanceRate);

                return (
                  <div
                    key={intern.id}
                    className="p-3 bg-bg-elevated rounded-lg border border-border-color"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent-primary/20 border border-accent-primary/40 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-mono font-bold text-accent-primary">
                          {intern.avatarInitials}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-semibold text-text-primary truncate">
                            {intern.name}
                          </p>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs font-mono text-text-primary">
                              {totalMinutes > 0 ? formatMinutes(totalMinutes) : '—'}
                            </span>
                            <Badge variant="outline" className={`text-xs ${badge.class}`}>
                              {totalMinutes > 0 || daysPresent > 0 ? badge.label : 'No logs'}
                            </Badge>
                          </div>
                        </div>

                        <div className="w-full bg-bg-surface rounded-full h-1.5 mb-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-all ${getAttendanceBarColor(attendanceRate)}`}
                            style={{ width: `${attendanceRate}%` }}
                          />
                        </div>

                        <div className="flex items-center gap-3 text-xs text-text-primary">
                          {latestLog ? (
                            <>
                              <span>{new Date(latestLog.timeIn).toLocaleDateString('en-US')}</span>
                              <span className="text-text-primary">In: {formatTime(latestLog.timeIn)}</span>
                              <span className="text-text-primary">Out: {formatTime(latestLog.timeOut)}</span>
                            </>
                          ) : (
                            <span>No recent activity</span>
                          )}
                          <span className="ml-auto font-mono">{attendanceRate}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              },
            )}
          </div>
        </Card>
      </div>

      <Card className="bg-bg-surface border-border-color p-6">
        <h2 className="text-xl font-mono font-semibold text-text-primary mb-6">
          Intern Status Summary
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {schoolScopedInterns.map((intern) => (
            <Link key={intern.id} href={`/coordinator/intern/${intern.id}`}>
              <div className="p-4 bg-bg-elevated rounded-lg border border-border-color hover:border-accent-primary/50 transition-all card-glow cursor-pointer">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12 bg-bg-base border border-border-color">
                    <AvatarFallback className="bg-accent-primary/10 text-accent-primary font-mono font-semibold">
                      {intern.avatarInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-text-primary truncate">
                      {intern.name}
                    </h3>
                    <p className="text-xs text-text-muted mb-2">@{intern.github}</p>
                    <div className="mb-2 flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          intern.reportStatus === 'reviewed'
                            ? 'bg-accent-primary/10 text-accent-primary border-accent-primary/30'
                            : intern.reportStatus === 'pending'
                              ? 'bg-text-muted/10 text-text-muted border-text-muted/30'
                              : 'bg-accent-warning/10 text-accent-warning border-accent-warning/30'
                        }`}
                      >
                        {intern.reportStatus}
                      </Badge>
                    </div>
                    <p className="text-xs text-text-muted truncate">
                      Recent report: {intern.assignedPeriod}
                    </p>
                    <p className="text-xs text-text-muted">
                      Latest submit: {intern.latestReportSubmittedAt ? timeAgo(intern.latestReportSubmittedAt) : 'No reports yet'}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
