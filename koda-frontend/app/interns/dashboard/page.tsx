'use client';

import JoinBatchGatekeeperModal from '@/components/join-batch-gatekeeper-modal';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  FileText,
  GitPullRequest,
} from 'lucide-react';
import Link from 'next/link';
import { useInternDashboard } from '@/hooks/use-intern-dashboard';
import { internsApi } from '@/lib/api/interns';

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
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

function getInitials(name: string | null | undefined) {
  if (!name) return '??';
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

export default function InternDashboardPage() {
  const { interns, recentIssues, openIssuesCount, closedIssuesCount, internReports, isLoading, error, user } = useInternDashboard();
  
  const [isMounted, setIsMounted] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  const currentIntern = useMemo(() => {
    if (!user) return null;
    return interns.find((i) => i.id === user.id || i.github_username === user.github_username) || null;
  }, [interns, user]);

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
  }, [isLoading, isMounted, user]);

  if (!isMounted || isLoading) {
    return <div className="p-8 text-text-muted">Loading dashboard...</div>;
  }

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

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center items-center h-full">
        <div className="text-text-muted animate-pulse">Loading dashboard data...</div>
      </div>
    );
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

  // Calculate pending reports across all interns in the batch
  const pendingReportsCount = Object.values(internReports)
    .flat()
    .filter(r => r.status === 'pending' || r.status === 'draft').length;

  return (
    <div className="p-8">
      <JoinBatchGatekeeperModal
        isOpen={showJoinModal}
        roleLabel="Intern"
        onJoin={handleJoinBatch}
      />
      <div className="mb-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-4xl font-mono font-bold text-text-primary mb-2">
              {currentIntern?.role || 'Intern'} Dashboard
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
                Total Hours/Minutes Served
              </p>
              <p className="text-2xl font-mono font-semibold text-text-primary mt-2">
                0h 0m
              </p>
            </div>
            <button className="px-3 py-1.5 text-xs font-semibold text-text-primary border border-border-color rounded-md hover:bg-bg-elevated transition-colors">
              Export
            </button>
          </div>

          <div className="space-y-3">
             <p className="text-sm text-text-muted text-center py-6">
                No attendance logs found. Attendance tracking is coming soon.
             </p>
          </div>
        </Card>
      </div>

      <Card className="bg-bg-surface border-border-color p-6">
        <h2 className="text-xl font-mono font-semibold text-text-primary mb-4">
          Intern Status Summary
        </h2>
        {interns.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {interns.map((intern) => {
              const internReps = internReports[intern.id] || [];
              const latestReport = [...internReps].sort(
                (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              )[0];

              return (
                <Link key={intern.id} href={`/interns/${intern.id}`}>
                  <div className="p-4 bg-bg-elevated rounded-lg border border-border-color hover:border-accent-primary/50 transition-all card-glow cursor-pointer">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12 bg-bg-base border border-border-color">
                        <AvatarFallback className="bg-accent-primary/10 text-accent-primary font-mono font-semibold">
                          {getInitials(intern.name || intern.github_username)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-text-primary truncate">
                          {intern.name || intern.github_username || 'Unknown'}
                        </h3>
                        <p className="text-xs text-text-muted mb-2">{intern.role || 'Intern'}</p>
                        <div className="mb-2 flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              latestReport?.status === 'reviewed'
                                ? 'bg-accent-primary/10 text-accent-primary border-accent-primary/30'
                                : latestReport?.status === 'pending' || latestReport?.status === 'draft'
                                  ? 'bg-text-muted/10 text-text-muted border-text-muted/30'
                                  : 'bg-accent-warning/10 text-accent-warning border-accent-warning/30'
                            }`}
                          >
                            {latestReport?.status ?? 'No Reports'}
                          </Badge>
                        </div>
                        <p className="text-xs text-text-muted truncate">
                          Recent report: {latestReport ? `${new Date(latestReport.period_start).toLocaleDateString()} - ${new Date(latestReport.period_end).toLocaleDateString()}` : 'No submitted report yet'}
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
    </div>
  );
}
