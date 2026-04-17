'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { deslugifyTeamName } from '@/lib/team-utils';
import { useAllIssues } from '@/hooks/use-all-issues';

type IssueStatusFilter = 'all' | 'open' | 'in_progress' | 'closed';

function getStatusBadgeClass(state: string) {
  switch (state) {
    case 'open':
      return 'bg-amber-500/10 text-amber-500 border-amber-500/30';
    case 'in_progress':
      return 'bg-accent-warning/10 text-accent-warning border-accent-warning/30';
    case 'closed':
      return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30';
    default:
      return 'bg-text-muted/10 text-text-muted border-text-muted/30';
  }
}

function formatShortDate(dateStr: string | null) {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function resolveTeamName(teamSlug: string) {
  return deslugifyTeamName(teamSlug) || 'Team';
}

export default function AdminTeamIssueTrackingPage() {
  const params = useParams();
  const teamSlug = params?.team as string;
  const teamName = resolveTeamName(teamSlug || '');

  const { issues, isLoading, error } = useAllIssues();

  const [statusFilter, setStatusFilter] = useState<IssueStatusFilter>('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [repoFilter, setRepoFilter] = useState('all');

  const assignees = useMemo(() => {
    return Array.from(
      new Set(
        issues
          .map((issue) => issue.assignee_name || issue.assignee_username)
          .filter((name): name is string => !!name)
      )
    ).sort();
  }, [issues]);

  const repos = useMemo(() => {
    return Array.from(new Set(issues.map((issue) => issue.repo_id))).sort();
  }, [issues]);

  const filtered = useMemo(() => {
    return issues.filter((issue) => {
      const matchesStatus = statusFilter === 'all' || issue.state === statusFilter;
      const displayName = issue.assignee_name || issue.assignee_username;
      const matchesAssignee = assigneeFilter === 'all' || displayName === assigneeFilter;
      const matchesRepo = repoFilter === 'all' || issue.repo_id === repoFilter;
      return matchesStatus && matchesAssignee && matchesRepo;
    });
  }, [statusFilter, assigneeFilter, repoFilter, issues]);

  if (isLoading) {
    return <div className="p-8 text-text-primary animate-pulse">Loading issues from backend...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-mono font-bold text-text-primary mb-2">
          {teamName} Issue Tracking
        </h1>
        <p className="text-text-muted">
          Monitor and manage GitHub issues assigned to this team.
        </p>
      </div>

      <Card className="bg-bg-surface border-border-color p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as IssueStatusFilter)}
            className="bg-bg-elevated border border-border-color rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-primary"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="closed">Closed</option>
          </select>

          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="bg-bg-elevated border border-border-color rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-primary"
          >
            <option value="all">All Assignees</option>
            {assignees.map((assignee) => (
              <option key={assignee} value={assignee}>
                {assignee}
              </option>
            ))}
          </select>

          <select
            value={repoFilter}
            onChange={(e) => setRepoFilter(e.target.value)}
            className="bg-bg-elevated border border-border-color rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-primary"
          >
            <option value="all">All Repositories</option>
            {repos.map((repo) => (
              <option key={repo} value={repo}>
                {repo}
              </option>
            ))}
          </select>
        </div>
      </Card>

      <Card className="bg-bg-surface border-border-color overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border-color bg-bg-elevated/30">
                <th className="px-6 py-3 text-xs font-semibold text-text-muted uppercase">ID</th>
                <th className="px-6 py-3 text-xs font-semibold text-text-muted uppercase">Title</th>
                <th className="px-6 py-3 text-xs font-semibold text-text-muted uppercase">Repo ID</th>
                <th className="px-6 py-3 text-xs font-semibold text-text-muted uppercase">Assignee</th>
                <th className="px-6 py-3 text-xs font-semibold text-text-muted uppercase">Status</th>
                <th className="px-6 py-3 text-xs font-semibold text-text-muted uppercase">Labels</th>
                <th className="px-6 py-3 text-xs font-semibold text-text-muted uppercase">Created</th>
                <th className="px-6 py-3 text-xs font-semibold text-text-muted uppercase">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-color">
              {filtered.map((issue) => (
                <tr key={issue.id} className="hover:bg-bg-elevated/50">
                  <td className="px-6 py-4 text-sm text-text-muted">
                    {issue.github_issue_id || issue.id.substring(0, 8)}
                  </td>
                  <td className="px-6 py-4 text-sm text-text-primary font-medium">
                    {issue.title}
                  </td>
                  <td className="px-6 py-4 text-text-muted font-mono text-xs">
                    {issue.repo_id}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {issue.assignee_avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={issue.assignee_avatar}
                          alt={issue.assignee_name || 'Assignee'}
                          className="h-6 w-6 rounded-full border border-border-color"
                        />
                      ) : (
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-bg-elevated border border-border-color text-[10px] font-semibold text-text-primary">
                          ?
                        </span>
                      )}
                      <span
                        className={`text-sm ${
                          issue.assignee_name || issue.assignee_username
                            ? 'text-text-primary'
                            : 'text-text-muted italic'
                        }`}
                      >
                        {issue.assignee_name || issue.assignee_username || 'Unassigned'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      variant="outline"
                      className={`text-[10px] uppercase px-3 py-1 rounded-full ${getStatusBadgeClass(
                        issue.state
                      )}`}
                    >
                      {issue.state.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {issue.labels?.map((label: any, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] uppercase px-2.5 py-1 rounded-full border border-border-color text-text-muted"
                        >
                          {label.name || 'LABEL'}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-text-muted">
                    {formatShortDate(issue.created_at)}
                  </td>
                  <td className="px-6 py-4 text-sm text-text-muted">
                    {formatShortDate(issue.updated_at)}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-sm text-text-muted">
                    No issues found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
