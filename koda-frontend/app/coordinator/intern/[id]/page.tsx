'use client';
 
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getInternById, getReportsByInternId, getIssuesByInternId } from '@/lib/mock-data';
import { ArrowLeft, Calendar, FileText, GitPullRequest, ChevronDown, ChevronUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
 
function getIssueStatusClass(status: string) {
  switch (status) {
    case 'in-progress':
      return 'bg-accent-warning/10 text-accent-warning border-accent-warning/30';
    case 'closed':
      return 'bg-accent-primary/10 text-accent-primary border-accent-primary/30';
    case 'open':
      return 'bg-text-muted/10 text-text-muted border-text-muted/30';
    default:
      return 'bg-text-muted/10 text-text-muted border-text-muted/30';
  }
}
 
function getReportStatusClass(status: string) {
  switch (status) {
    case 'reviewed':
      return 'bg-accent-primary/10 text-accent-primary border-accent-primary/30';
    case 'pending':
      return 'bg-text-muted/10 text-text-muted border-text-muted/30';
    default:
      return 'bg-text-muted/10 text-text-muted border-text-muted/30';
  }
}
 
function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
 
function buildWeeklyActivity(issues: ReturnType<typeof getIssuesByInternId>) {
  const weeks = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'];
  return weeks.map((week, i) => ({
    week,
    issues: Math.max(1, (issues.length + i) % 7),
  }));
}
 
export default function InternProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
 
  const intern = getInternById(id);
  const reports = getReportsByInternId(id);
  const issues = getIssuesByInternId(id);
 
  const [activeTab, setActiveTab] = useState<'weekly' | 'daily'>('weekly');
  const [expandedReports, setExpandedReports] = useState<Set<string>>(new Set());
 
  if (!intern) {
    return (
      <div className="p-8 text-text-muted">Intern not found.</div>
    );
  }
 
  const weeklyReports = reports.filter((r) => r.type === 'weekly');
  const dailyReports = reports.filter((r) => r.type === 'daily');
  const displayedReports = activeTab === 'weekly' ? weeklyReports : dailyReports;
  const weeklyActivity = buildWeeklyActivity(issues);
 
  function toggleReport(reportId: string) {
    setExpandedReports((prev) => {
      const next = new Set(prev);
      if (next.has(reportId)) {
        next.delete(reportId);
      } else {
        next.add(reportId);
      }
      return next;
    });
  }
 
  return (
    <div className="p-8">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Intern Management
      </button>
 
      {/* Profile Header */}
      <div className="flex items-start gap-6 mb-8">
        <div className="w-20 h-20 rounded-full bg-accent-primary/20 border-2 border-accent-primary/40 flex items-center justify-center flex-shrink-0">
          <span className="text-2xl font-mono font-bold text-accent-primary">
            {intern.avatarInitials}
          </span>
        </div>
        <div>
          <h1 className="text-4xl font-mono font-bold text-text-primary mb-1">
            {intern.name}
          </h1>
          <p className="text-text-muted mb-2">{intern.role}</p>
          <div className="flex items-center gap-3">
            <span className="text-sm text-text-muted font-mono">@{intern.github}</span>
            <Badge
              variant="outline"
              className="text-xs bg-accent-primary/10 text-accent-primary border-accent-primary/30"
            >
              🛡 Score: {intern.score}%
            </Badge>
          </div>
          <div className="flex items-center gap-6 mt-3 text-sm text-text-muted">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {intern.assignedPeriod}
            </span>
            <span className="flex items-center gap-1.5">
              <FileText className="w-4 h-4" />
              {intern.reportsSubmitted} reports submitted
            </span>
            <span className="flex items-center gap-1.5">
              <GitPullRequest className="w-4 h-4" />
              {issues.length} GitHub issues
            </span>
          </div>
        </div>
      </div>
 
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 
        {/* Left — Submitted Reports */}
        <Card className="bg-bg-surface border-border-color p-6">
          <h2 className="text-xl font-mono font-semibold text-text-primary mb-4">
            Submitted Reports
          </h2>
 
          {/* Tabs */}
          <div className="flex rounded-lg overflow-hidden border border-border-color mb-4">
            <button
              onClick={() => setActiveTab('weekly')}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                activeTab === 'weekly'
                  ? 'bg-accent-primary/20 text-accent-primary'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Weekly Reports
            </button>
            <button
              onClick={() => setActiveTab('daily')}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                activeTab === 'daily'
                  ? 'bg-accent-primary/20 text-accent-primary'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Daily Logs
            </button>
          </div>
 
          {/* Report list */}
          <div className="space-y-3">
            {displayedReports.length > 0 ? (
              displayedReports.map((report) => {
                const isExpanded = expandedReports.has(report.id);
                return (
                  <div
                    key={report.id}
                    className="p-4 bg-bg-elevated rounded-lg border border-border-color"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-text-primary">
                          {report.period}
                        </p>
                        <p className="text-xs text-text-muted mt-0.5">
                          Submitted {formatDate(report.submittedAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {report.score !== null && (
                          <Badge
                            variant="outline"
                            className="text-xs bg-accent-primary/10 text-accent-primary border-accent-primary/30"
                          >
                            {report.score}%
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          className={`text-xs ${getReportStatusClass(report.status)}`}
                        >
                          {report.status}
                        </Badge>
                      </div>
                    </div>
 
                    <button
                      onClick={() => toggleReport(report.id)}
                      className="flex items-center gap-1 mt-3 text-xs text-accent-primary hover:text-accent-primary/80 transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                      {isExpanded ? 'Hide Report' : 'View Full Report'}
                    </button>
 
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-border-color">
                        <p className="text-xs text-text-muted leading-relaxed">
                          {report.content}
                        </p>
                        {report.coordinatorNote && (
                          <div className="mt-3 p-3 bg-accent-primary/5 border border-accent-primary/20 rounded-lg">
                            <p className="text-xs text-accent-primary font-semibold mb-1">
                              Coordinator Note
                            </p>
                            <p className="text-xs text-text-muted">
                              {report.coordinatorNote}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-text-muted text-center py-6">
                No {activeTab === 'weekly' ? 'weekly reports' : 'daily logs'} found.
              </p>
            )}
          </div>
        </Card>
 
        {/* Right — GitHub Activity + Chart */}
        <div className="space-y-6">
          <Card className="bg-bg-surface border-border-color p-6">
            <h2 className="text-xl font-mono font-semibold text-text-primary mb-1">
              GitHub Activity
            </h2>
            <p className="text-xs text-text-muted uppercase tracking-wider mb-4">
              Linked Issues — Same Period
            </p>
 
            <div className="space-y-3">
              {issues.length > 0 ? (
                issues.map((issue) => (
                  <div
                    key={issue.id}
                    className="p-4 bg-bg-elevated rounded-lg border border-border-color"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <GitPullRequest className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
                          <span className="text-xs text-text-muted">#{issue.number}</span>
                        </div>
                        <p className="text-sm font-mono font-semibold text-text-primary mb-1">
                          {issue.title}
                        </p>
                        <p className="text-xs text-text-muted mb-2">{issue.repo}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {issue.labels.map((label) => (
                            <span
                              key={label}
                              className="px-2 py-0.5 text-xs bg-bg-surface border border-border-color rounded-full text-text-muted"
                            >
                              {label}
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-text-muted mt-2">
                          Opened {formatDate(issue.openedAt)} • Updated {formatDate(issue.updatedAt)}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-xs flex-shrink-0 ${getIssueStatusClass(issue.status)}`}
                      >
                        {issue.status}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-text-muted text-center py-6">
                  No issues found for this intern.
                </p>
              )}
            </div>
          </Card>
 
          {/* Bar Chart */}
          <Card className="bg-bg-surface border-border-color p-6">
            <h3 className="text-sm font-semibold text-text-primary mb-4">
              Issue Activity Per Week
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklyActivity} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
                <XAxis
                  dataKey="week"
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #2a2a2a',
                    borderRadius: '8px',
                    color: '#e5e7eb',
                    fontSize: '12px',
                  }}
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                />
                <Bar dataKey="issues" fill="#00ff88" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>
    </div>
  );
}
 