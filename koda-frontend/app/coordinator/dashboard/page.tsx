'use client';
 
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { interns, issues, reports, attendanceLogs, getAttendanceByInternId } from '@/lib/mock-data';
import {
  Users,
  FileText,
  GitPullRequest,
  Target,
  TrendingUp,
  TrendingDown,
  Clock,
} from 'lucide-react';
 
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
  if (rate >= 90)
    return { label: 'Excellent', class: 'bg-accent-primary/10 text-accent-primary border-accent-primary/30' };
  if (rate >= 70)
    return { label: 'Good', class: 'bg-accent-warning/10 text-accent-warning border-accent-warning/30' };
  return { label: 'At Risk', class: 'bg-red-500/10 text-red-400 border-red-500/30' };
}
 
function formatMinutes(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}
 
function formatTime(isoString: string) {
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
 
  useEffect(() => {
    setIsMounted(true);
  }, []);
 
  if (!isMounted) {
    return <div className="p-8 text-text-muted">Loading dashboard...</div>;
  }
 
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
 
  const school = 'Cebu Institute of Technology University'; // Replace with actual school data
  const schoolInterns = interns.filter((intern) => intern.school === school);
  const pendingReports = interns.filter((i) => i.reportStatus === 'pending');
  const openIssues = issues.filter((i) => i.status === 'open');
  const avgScore = Math.round(
    interns.reduce((sum, i) => sum + i.score, 0) / interns.length
  );

  const latestReportByIntern = reports.reduce<Record<string, (typeof reports)[number]>>(
    (acc, report) => {
      const existing = acc[report.internId];
      if (
        !existing ||
        new Date(report.submittedAt).getTime() > new Date(existing.submittedAt).getTime()
      ) {
        acc[report.internId] = report;
      }
      return acc;
    },
    {}
  );
 
  const recentIssues = [...issues]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);
 
  const internById = new Map(interns.map((i) => [i.id, i]));
 
  const attendanceSummary = interns.map((intern) => {
    const logs = getAttendanceByInternId(intern.id);
    const totalMinutes = logs.reduce((sum, l) => sum + l.minutesWorked, 0);
    const daysPresent = logs.length;
    const latestLog = [...logs].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];
 
    const allDates = [...new Set(attendanceLogs.map((l) => l.date))].length || 1;
    const attendanceRate = Math.min(100, Math.round((daysPresent / allDates) * 100));
 
    return { intern, totalMinutes, daysPresent, attendanceRate, latestLog };
  });
 
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-mono font-bold text-text-primary mb-2">
          Coordinator Dashboard
        </h1>
        <p className="text-text-primary">{school}</p>
        <p className="text-text-primary">{today}</p>
      </div>
 
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6 mb-8">
        <Card className="bg-bg-surface border-border-color p-6 card-glow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
                Total Interns
              </p>
              <p className="text-4xl font-mono font-bold text-text-primary mb-2">
                {interns.length}
              </p>
              <p className="text-xs text-accent-primary flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                +2 this month
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
              <p className="text-xs text-red-400 flex items-center gap-1">
                <TrendingDown className="w-3 h-3" />
                -1 from last week
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
                {openIssues.length}
              </p>
              <p className="text-xs text-accent-primary flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                +3 this week
              </p>
            </div>
            <div className="p-2 bg-accent-primary/10 rounded-lg">
              <GitPullRequest className="w-6 h-6 text-accent-primary" />
            </div>
          </div>
        </Card>
 
       
      </div>
 
      {/* GitHub Activity + Attendance Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Recent GitHub Activity Feed */}
        <Card className="bg-bg-surface border-border-color p-6">
          <h2 className="text-xl font-mono font-semibold text-text-primary mb-4">
            Recent GitHub Activity Feed
          </h2>
          <div className="space-y-3">
            {recentIssues.map((issue) => {
              const intern = internById.get(issue.internId ?? '');
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
                          {issue.repo} • {intern?.name ?? 'Unknown'} • {timeAgo(issue.updatedAt)}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs flex-shrink-0 ${getIssueStatusClass(issue.status)}`}
                    >
                      {issue.status}
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
 
        {/* Attendance Log Summary */}
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
 
          {/* Scrollable list */}
          <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-bg-elevated scrollbar-track-transparent bg-bg-surface ">
            {attendanceSummary.map(({ intern, totalMinutes, daysPresent, attendanceRate, latestLog }) => {
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
                            {totalMinutes > 0 ? badge.label : 'No logs'}
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
                         <span>{latestLog.date}</span>
                         <span className="text-text-primary">In: {formatTime(latestLog.clockIn)}</span>
                         <span className="text-text-primary">Out: {formatTime(latestLog.clockOut)}</span>
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
            })}
          </div>
        </Card>
      </div>
 
      {/* Intern Status Summary */}
      <Card className="bg-bg-surface border-border-color p-6">
        <h2 className="text-xl font-mono font-semibold text-text-primary mb-6">
          Intern Status Summary
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {schoolInterns.map((intern) => {
            const latestReport = latestReportByIntern[intern.id];

            return (
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
                      <p className="text-xs text-text-muted mb-2">{intern.role}</p>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            latestReport?.status === 'reviewed'
                              ? 'bg-accent-primary/10 text-accent-primary border-accent-primary/30'
                              : latestReport?.status === 'pending'
                                ? 'bg-accent-warning/10 text-accent-warning border-accent-warning/30'
                                : 'bg-text-muted/10 text-text-muted border-text-muted/30'
                          }`}
                        >
                          {latestReport?.status ?? 'no report'}
                        </Badge>
                        <span className="text-xs text-text-muted font-mono capitalize">
                          {latestReport ? `${latestReport.type} report` : 'No recent report'}
                        </span>
                      </div>
                      <p className="text-xs text-text-muted">{intern.lastActive}</p>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
 