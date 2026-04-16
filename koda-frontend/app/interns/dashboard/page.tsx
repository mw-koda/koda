'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  GitPullRequest,
  
} from 'lucide-react';
import { interns, issues, reports, mockAuthConfig, getAttendanceByInternId } from '@/lib/mock-data';
import { JoinOrganizationCard } from '@/components/join-organization-card';
import Link from 'next/link';

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
  trend: 'up' | 'down';
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
            ) : (
              <TrendingDown className="h-3 w-3 text-accent-danger" />
            )}
            <span
              className={`text-xs ${trend === 'up' ? 'text-accent-primary' : 'text-accent-danger'}`}
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
  switch (status) {
    case 'open':
      return 'bg-accent-secondary/10 text-accent-secondary border-accent-secondary/30';
    case 'closed':
      return 'bg-accent-primary/10 text-accent-primary border-accent-primary/30';
    case 'in-progress':
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

export default function InternDashboardPage() {
  const [currentRole, setCurrentRole] = useState<string>(mockAuthConfig.role);
  const [userOrganizationId, setUserOrganizationId] = useState<string | undefined>(mockAuthConfig.organizationId);

  useEffect(() => {
    const role = localStorage.getItem('selectedRole') || mockAuthConfig.role;
    const orgId = localStorage.getItem('userOrganizationId') || mockAuthConfig.organizationId;
    setCurrentRole(role);
    setUserOrganizationId(orgId || undefined);
  }, []);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const pendingReports = reports.filter((r) => r.status === 'pending').length;
  const openIssues = issues.filter((i) => i.status === 'open').length;

  const recentIssues = [...issues]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 6);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-mono font-bold text-text-primary mb-2">
          Overview
        </h1>
        <p className="text-text-muted">{today}</p>
      </div>

      {/* Show Join Organization card for interns without an organization
      {currentRole === 'intern' && (
        <JoinOrganizationCard currentOrganizationId={userOrganizationId} />
      )} */}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Total Interns"
          value={interns.length}
          change="+2 this month"
          icon={Users}
          trend="up"
        />
        <StatCard
          title="Reports Pending"
          value={pendingReports}
          change="-1 from last week"
          icon={FileText}
          trend="down"
        />
        <StatCard
          title="Open GitHub Issues"
          value={openIssues}
          change="+3 this week"
          icon={GitPullRequest}
          trend="up"
        />
 
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="bg-bg-surface border-border-color p-6">
          <h2 className="text-xl font-mono font-semibold text-text-primary mb-4">
            Recent GitHub Activity Feed
          </h2>
          <div className="space-y-3">
            {recentIssues.map((issue) => (
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
                      className={`text-xs flex-shrink-0 ${getStatusBadgeClass(issue.status)}`}
                    >
                      {issue.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-text-muted">
                    <span className="font-mono">{issue.repo}</span>
                    <span>•</span>
                    <span>{issue.assignee}</span>
                    <span>•</span>
                    <span>{formatTimestamp(issue.updatedAt)}</span>
                  </div>
                </div>
              </div>
            ))}
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
                {formatDuration(
                  interns.reduce(
                    (total, intern) =>
                      total +
                      getAttendanceByInternId(intern.id).reduce(
                        (sum, log) => sum + log.minutesWorked,
                        0
                      ),
                    0
                  )
                )}
              </p>
            </div>
            <button className="px-3 py-1.5 text-xs font-semibold text-text-primary border border-border-color rounded-md hover:bg-bg-elevated transition-colors">
              Export
            </button>
          </div>

          <div className="space-y-3">
            {interns.length > 0 && getAttendanceByInternId(interns[0].id).length > 0 ? (
              [...getAttendanceByInternId(interns[0].id)]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 5)
                .map((log) => (
                  <div
                    key={log.id}
                    className="p-4 bg-bg-elevated rounded-lg border border-border-color"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-text-primary">
                        {formatDate(log.date)}
                      </p>
                      <Badge
                        variant="outline"
                        className="text-xs bg-accent-primary/10 text-accent-primary border-accent-primary/30"
                      >
                        {formatDuration(log.minutesWorked)}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                      <div>
                        <p className="text-xs text-text-muted">In</p>
                        <p className="text-sm text-text-primary font-mono">
                          {formatTime(log.clockIn)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-text-muted">Out</p>
                        <p className="text-sm text-text-primary font-mono">
                          {formatTime(log.clockOut)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3 mt-3">
                      <p className="text-xs text-text-muted">
                        {log.location}
                      </p>
                      <button className="px-2.5 py-1 text-xs font-semibold text-accent-primary border border-accent-primary/30 rounded-md hover:bg-accent-primary/10 transition-colors">
                        View EOD
                      </button>
                    </div>
                  </div>
                ))
            ) : (
              <p className="text-sm text-text-muted text-center py-6">
                No attendance logs found.
              </p>
            )}
          </div>
        </Card>
      </div>


      <Card className="bg-bg-surface border-border-color p-6 mb-8">
        <h2 className="text-xl font-mono font-semibold text-text-primary mb-4">
          Attendance Log Summary
        </h2>
        <div className="space-y-3">
          {interns.map((intern) => (
            <div
              key={intern.id}
              className="p-3 bg-bg-elevated rounded-lg border border-border-color hover:border-accent-primary/30 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Avatar className="h-8 w-8 bg-bg-base border border-border-color flex-shrink-0">
                    <AvatarFallback className="bg-accent-primary/10 text-accent-primary font-mono text-xs font-semibold">
                      {intern.avatarInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {intern.name}
                    </p>
                    <p className="text-xs text-text-muted">{intern.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 ml-2">
              
                  <span className="text-xs text-text-muted font-mono">
                    {intern.lastActive}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card className="bg-bg-surface border-border-color p-6">
        <h2 className="text-xl font-mono font-semibold text-text-primary mb-4">
          Intern Status Summary
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {interns.map((intern) => (
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
                    <p className="text-xs text-text-muted mb-2">{intern.role}</p>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          intern.reportStatus === 'submitted'
                            ? 'bg-accent-warning/10 text-accent-warning border-accent-warning/30'
                            : intern.reportStatus === 'reviewed'
                              ? 'bg-accent-primary/10 text-accent-primary border-accent-primary/30'
                              : 'bg-text-muted/10 text-text-muted border-text-muted/30'
                        }`}
                      >
                        {intern.reportStatus}
                      </Badge>
                      <span className="text-xs text-text-muted font-mono">
                        {intern.score}%
                      </span>
                    </div>
                    <p className="text-xs text-text-muted">{intern.lastActive}</p>
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
