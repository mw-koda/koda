'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { issues } from '@/lib/mock-data';

function getIssueStatusClass(status: string) {
  switch (status) {
    case 'open':
      return 'bg-accent-secondary/10 text-accent-secondary border-accent-secondary/30';
    case 'in-progress':
      return 'bg-accent-warning/10 text-accent-warning border-accent-warning/30';
    case 'closed':
      return 'bg-accent-primary/10 text-accent-primary border-accent-primary/30';
    default:
      return 'bg-text-muted/10 text-text-muted border-text-muted/30';
  }
}

export default function TeamLeadDashboardPage() {
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

  const openIssues = issues.filter((issue) => issue.status === 'open');
  const inProgressIssues = issues.filter((issue) => issue.status === 'in-progress');
  const closedIssues = issues.filter((issue) => issue.status === 'closed');
  const highPriorityIssues = issues.filter((issue) => issue.labels.includes('high-priority'));

  const recentIssues = [...issues]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 6);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-mono font-bold text-text-primary mb-2">
          Team Lead Dashboard
        </h1>
        <p className="text-text-muted">{today}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-bg-surface border-border-color p-6 card-glow">
          <p className="text-label text-text-muted mb-2">Open Issues</p>
          <p className="text-3xl font-mono font-bold text-text-primary">
            {openIssues.length}
          </p>
          <p className="text-xs text-text-muted mt-2">Needs assignment</p>
        </Card>
        <Card className="bg-bg-surface border-border-color p-6 card-glow">
          <p className="text-label text-text-muted mb-2">In Progress</p>
          <p className="text-3xl font-mono font-bold text-text-primary">
            {inProgressIssues.length}
          </p>
          <p className="text-xs text-text-muted mt-2">Currently tracked</p>
        </Card>
        <Card className="bg-bg-surface border-border-color p-6 card-glow">
          <p className="text-label text-text-muted mb-2">Closed Issues</p>
          <p className="text-3xl font-mono font-bold text-text-primary">
            {closedIssues.length}
          </p>
          <p className="text-xs text-text-muted mt-2">Closed this cycle</p>
        </Card>
        <Card className="bg-bg-surface border-border-color p-6 card-glow">
          <p className="text-label text-text-muted mb-2">High Priority</p>
          <p className="text-3xl font-mono font-bold text-text-primary">
            {highPriorityIssues.length}
          </p>
          <p className="text-xs text-text-muted mt-2">Escalated items</p>
        </Card>
      </div>

      <Card className="bg-bg-surface border-border-color p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-mono font-semibold text-text-primary">
            Recent Issue Updates
          </h2>
          <Link
            href="/issues"
            className="text-sm text-accent-secondary hover:text-accent-primary transition-colors"
          >
            View all
          </Link>
        </div>
        <div className="space-y-3">
          {recentIssues.map((issue) => (
            <div
              key={issue.id}
              className="p-3 bg-bg-elevated rounded-lg border border-border-color"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-text-primary">
                    {issue.title}
                  </p>
                  <p className="text-xs text-text-muted mt-1">
                    {issue.repo} • {issue.assignee}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={`text-xs ${getIssueStatusClass(issue.status)}`}
                >
                  {issue.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
