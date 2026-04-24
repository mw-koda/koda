'use client';

import JoinBatchGatekeeperModal from '@/components/join-batch-gatekeeper-modal';
import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/auth';
import {
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  FileText,
  GitPullRequest,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';
import { useInternDashboard } from '@/hooks/use-intern-dashboard';
import { useInterns } from '@/hooks/use-interns';
import { internsApi } from '@/lib/api/interns';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';

function StatCard({
  title,
  value,
  change,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string | number;
  change: string;
  icon: any;
  trend: 'up' | 'down' | 'neutral';
}) {
  return (
    <Card className="bg-bg-surface border-border-color p-6 card-glow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-label text-text-muted mb-2">{title}</p>
          <p className="text-3xl font-mono font-bold text-text-primary mb-1">
            {value}
          </p>
          <div className="flex items-center gap-1">
            {trend === 'up' ? (
              <TrendingUp className="h-3 w-3 text-accent-primary" />
            ) : trend === 'down' ? (
              <TrendingDown className="h-3 w-3 text-accent-danger" />
            ) : null}
            <span
              className={`text-xs ${trend === 'up' ? 'text-accent-primary' : trend === 'down' ? 'text-accent-danger' : 'text-text-muted'}`}
            >
              {change}
            </span>
          </div>
        </div>
        <div className="p-3 bg-bg-elevated rounded-lg">
          <Icon className="h-6 w-6 text-accent-primary" />
        </div>
      </div>
    </Card>
  );
}

function getStatusBadgeClass(status: string) {
  switch (status?.toLowerCase()) {
    case 'open':
      return 'bg-accent-secondary/10 text-accent-secondary border-accent-secondary/30';
    case 'closed':
      return 'bg-accent-primary/10 text-accent-primary border-accent-primary/30';
    case 'in-progress':
    case 'in_progress':
      return 'bg-accent-warning/10 text-accent-warning border-accent-warning/30';
    default:
      return 'bg-text-muted/10 text-text-muted border-text-muted/30';
  }
}

function formatTimestamp(timestamp: string) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 1) return `${days} days ago`;
  if (days === 1) return 'yesterday';
  if (hours > 0) return `${hours} hours ago`;
  return 'just now';
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatDuration(totalMinutes: number) {
  const roundedMinutes = Math.round(totalMinutes);
  const hours = Math.floor(roundedMinutes / 60);
  const minutes = roundedMinutes % 60;
  return `${hours}h ${minutes}m`;
}

export default function InternDashboardPage() {
  const {
    interns,
    recentIssues,
    openIssuesCount,
    closedIssuesCount,
    attendanceSummary,
    isLoading,
    error,
    user,
  } = useInternDashboard();
  
  const [isMounted, setIsMounted] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showNoTeamModal, setShowNoTeamModal] = useState(false);
  const [summaryBatchId, setSummaryBatchId] = useState<string | undefined>(undefined);

  const {
    interns: statusInterns,
    isLoading: isStatusLoading,
    error: statusError,
  } = useInterns(summaryBatchId);

  const currentIntern = useMemo(() => {
    if (!user) return null;
    return interns.find((i) => i.user_id === user.id || i.user?.github_username === user.github_username) || null;
  }, [interns, user]);

  // Check if intern has team assignment
  useEffect(() => {
    if (!isMounted) return;

    const isInternRole = user?.role === 'intern';
    const hasInternRecord = !!currentIntern;
    const hasTeam = !!(currentIntern?.team_id ?? user?.team_id);
    const assignedBatchId = user?.batchId ?? user?.batch_id ?? localStorage.getItem('userBatchId');

    // Team assignment gating applies to intern role only.
    if (isInternRole && hasInternRecord && assignedBatchId && !hasTeam) {
      setShowNoTeamModal(true);
    } else {
      setShowNoTeamModal(false);
    }
  }, [isMounted, currentIntern, user]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || isLoading) {
      return;
    }

    const storedBatchId = typeof window !== 'undefined' ? localStorage.getItem('userBatchId') : null;
    const assignedBatchId = user?.batchId ?? user?.batch_id ?? storedBatchId;

    setShowJoinModal(!assignedBatchId);
    setSummaryBatchId(assignedBatchId ? String(assignedBatchId) : undefined);
  }, [isLoading, isMounted, user]);

  const handleJoinBatch = async ({ batchCode, school }: { batchCode: string; school: string }) => {
    try {
      await internsApi.join(batchCode.trim(), school.trim());
      localStorage.setItem('userBatchId', batchCode.trim());
      localStorage.setItem('userSchool', school.trim());
      setShowJoinModal(false);
      window.location.reload(); // Refresh to update user state with new school/batch
    } catch (err: any) {
      console.error('Failed to join batch:', err);
      alert(err.message || 'Failed to join batch. Please check your code.');
    }
  };

  const handleLogout = () => {
    auth.logoutAndRedirect();
  };

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const sortedAttendance = useMemo(() => {
    return [...(attendanceSummary?.logs || [])].sort(
      (a, b) => new Date(b.timeIn).getTime() - new Date(a.timeIn).getTime()
    );
  }, [attendanceSummary]);

  const totalMinutes = attendanceSummary?.totalHours
    ? Math.round(attendanceSummary.totalHours * 60)
    : 0;

  const pendingReportsCount = statusInterns.filter(
    (intern) => intern.reportStatus === 'pending',
  ).length;

  if (!isMounted || isLoading) {
    return <div className="p-8 text-text-muted">Loading dashboard...</div>;
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-500/10 text-red-500 border border-red-500/30 p-4 rounded-lg">
          Error loading dashboard: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <JoinBatchGatekeeperModal
        isOpen={showJoinModal}
        roleLabel="Intern"
        onJoin={handleJoinBatch}
      />
      <Dialog open={showNoTeamModal} onOpenChange={(open) => {
        // Prevent closing the modal - it should only close when team is assigned
        if (open === false) return;
      }}>
        <DialogContent className="bg-bg-surface border-border-color sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()} hideCloseButton>
          <div className="text-center">
            <h2 className="text-text-primary font-mono text-lg font-semibold">
              Team Assignment Pending
            </h2>
            <p className="text-text-muted text-sm mt-1">
              Awaiting Team Lead Assignment
            </p>
          </div>

          <div className="space-y-6 py-6">
            <div className="text-center space-y-4">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-accent-primary/10 border-2 border-accent-primary/30">
                <div className="h-8 w-8 border-2 border-accent-primary/30 border-t-accent-primary rounded-full animate-spin" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary mb-2">
                  Please wait for your Team Lead to assign you to a team.
                </p>
                <p className="text-xs text-text-muted">
                  Once assigned, you'll see your team name on this dashboard.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleLogout}
              className="w-full bg-accent-danger hover:bg-accent-danger/90 text-white"
            >
              Logout
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {!showNoTeamModal && (
      <><div className="mb-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-4xl font-mono font-bold text-text-primary mb-2">
              {`${currentIntern?.role || 'Team'} - ${user?.team_name || currentIntern?.team_id || user?.team_id || 'Unassigned'}`}
            </h1>
            <p className="text-text-primary">{user?.school_name || user?.school || 'School not assigned'}</p>
            <p className="text-text-muted">{today}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Tasks Done"
          value={closedIssuesCount}
          change="Completed by you"
          icon={ShieldCheck}
          trend="neutral"
        />
        <StatCard
          title="Reports Pending"
          value={pendingReportsCount}
          change="Across batch"
          icon={FileText}
          trend="neutral"
        />
        <StatCard
          title="Open GitHub Issues"
          value={openIssuesCount}
          change="Current open tasks"
          icon={GitPullRequest}
          trend="neutral"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="bg-bg-surface border-border-color p-6">
          <h2 className="text-xl font-mono font-semibold text-text-primary mb-4">
            Recent GitHub Activity Feed
          </h2>
          <div className="space-y-3">
            {recentIssues.length > 0 ? recentIssues.map((issue) => (
              <div
                key={issue.id}
                className="flex items-start gap-3 p-3 bg-bg-elevated rounded-lg border border-border-color hover:border-accent-primary/30 transition-colors"
              >
                <GitPullRequest className="h-5 w-5 text-text-muted mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {issue.title}
                    </p>
                    <Badge
                      variant="outline"
                      className={`text-xs flex-shrink-0 ${getStatusBadgeClass(issue.state)}`}
                    >
                      {issue.state?.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-text-muted">
                    <span className="font-mono">Repository</span>
                    <span>•</span>
                    <span>{issue.assignee_name || issue.assignee_username || 'Unassigned'}</span>
                    <span>•</span>
                    <span>{formatTimestamp(issue.updated_at || issue.created_at || new Date().toISOString())}</span>
                  </div>
                </div>
              </div>
            )) : (
              <p className="text-sm text-text-muted text-center py-6">
                No recent activity found.
              </p>
            )}
          </div>
          <Link
            href="/issues"
            className="inline-block mt-4 text-sm text-accent-secondary hover:text-accent-primary transition-colors"
          >
            View all issues →
          </Link>
        </Card>

        <Card className="bg-bg-surface border-border-color p-6">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-mono font-semibold text-text-primary">
                Attendance Log
              </h2>
              <p className="text-xs text-text-muted mt-1">
                Total Rendered Time
              </p>
              <p className="text-2xl font-mono font-semibold text-text-primary mt-2">
                {formatDuration(totalMinutes)}
              </p>
            </div>
            <button className="px-3 py-1.5 text-xs font-semibold text-text-primary border border-border-color rounded-md hover:bg-bg-elevated transition-colors">
              Export
            </button>
          </div>

          <div className="space-y-3 max-h-[360px] overflow-y-auto pr-2">
            {sortedAttendance.length > 0 ? (
              sortedAttendance.map((log) => (
                <div
                  key={log.id}
                  className="p-4 bg-bg-elevated rounded-lg border border-border-color"
                >
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <p className="text-sm font-semibold text-text-primary">
                      {formatDate(log.timeIn.slice(0, 10))}
                    </p>
                    <Badge
                      variant="outline"
                      className="text-[10px] font-mono bg-accent-primary/5 text-accent-primary border-accent-primary/20"
                    >
                      {formatDuration(log.renderedHours ? log.renderedHours * 60 : 0)}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] uppercase font-mono text-text-muted mb-1">
                        Time In
                      </p>
                      <p className="text-sm text-text-primary font-mono bg-bg-surface px-2 py-1 rounded">
                        {formatTime(log.timeIn)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-mono text-text-muted mb-1">
                        Time Out
                      </p>
                      <p className="text-sm text-text-primary font-mono bg-bg-surface px-2 py-1 rounded">
                        {log.timeOut ? formatTime(log.timeOut) : '--:--'}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 border-2 border-dashed border-border-color rounded-xl">
                <Calendar className="w-8 h-8 text-text-muted mx-auto mb-3 opacity-20" />
                <p className="text-sm text-text-muted">No attendance logs found.</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      <Card className="bg-bg-surface border-border-color p-6">
        <h2 className="text-xl font-mono font-semibold text-text-primary mb-4">
          Intern Status Summary
        </h2>
        {isStatusLoading ? (
          <p className="text-sm text-text-muted text-center py-6">
            Loading intern status summary...
          </p>
        ) : statusError ? (
          <p className="text-sm text-red-400 text-center py-6">
            Failed to load intern status summary.
          </p>
        ) : statusInterns.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {statusInterns.map((intern) => {
              return (
                <Link key={intern.id} href={`/interns/${intern.id}`}>
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
                          Latest submit: {intern.latestReportSubmittedAt ? formatTimestamp(intern.latestReportSubmittedAt) : 'No reports yet'}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-text-muted text-center py-6">
             No interns found in your batch.
          </p>
        )}
      </Card>
      </> )}
    </div>
  );
}
