'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { interns, reports, issues, organizations } from '@/lib/mock-data';

function getReportStatusClass(status: string) {
  switch (status) {
    case 'pending':
      return 'bg-accent-warning/10 text-accent-warning border-accent-warning/30';
    case 'reviewed':
      return 'bg-accent-primary/10 text-accent-primary border-accent-primary/30';
    default:
      return 'bg-text-muted/10 text-text-muted border-text-muted/30';
  }
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

  const pendingReports = reports.filter((report) => report.status === 'pending');
  const openIssues = issues.filter((issue) => issue.status === 'open');
  const recentReports = [...reports]
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
    .slice(0, 6);

  const internById = new Map(interns.map((intern) => [intern.id, intern]));
  const primaryOrg = organizations[0];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-mono font-bold text-text-primary mb-2">
          Coordinator Dashboard
        </h1>
        <p className="text-text-muted">{today}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-bg-surface border-border-color p-6 card-glow">
          <p className="text-label text-text-muted mb-2">Total Interns</p>
          <p className="text-3xl font-mono font-bold text-text-primary">
            {interns.length}
          </p>
          <p className="text-xs text-text-muted mt-2">Active this cycle</p>
        </Card>
        <Card className="bg-bg-surface border-border-color p-6 card-glow">
          <p className="text-label text-text-muted mb-2">Pending Reports</p>
          <p className="text-3xl font-mono font-bold text-text-primary">
            {pendingReports.length}
          </p>
          <p className="text-xs text-text-muted mt-2">Awaiting review</p>
        </Card>
        <Card className="bg-bg-surface border-border-color p-6 card-glow">
          <p className="text-label text-text-muted mb-2">Open Issues</p>
          <p className="text-3xl font-mono font-bold text-text-primary">
            {openIssues.length}
          </p>
          <p className="text-xs text-text-muted mt-2">Needs triage</p>
        </Card>
        <Card className="bg-bg-surface border-border-color p-6 card-glow">
          <p className="text-label text-text-muted mb-2">Active Organizations</p>
          <p className="text-3xl font-mono font-bold text-text-primary">
            {organizations.length}
          </p>
          <p className="text-xs text-text-muted mt-2">Current cohorts</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-bg-surface border-border-color p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-mono font-semibold text-text-primary">
              Recent Reports
            </h2>
            <Link
              href="/reports"
              className="text-sm text-accent-secondary hover:text-accent-primary transition-colors"
            >
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {recentReports.map((report) => {
              const intern = internById.get(report.internId);

              return (
                <div
                  key={report.id}
                  className="p-3 bg-bg-elevated rounded-lg border border-border-color"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-text-primary">
                        {intern?.name ?? 'Unknown Intern'}
                      </p>
                      <p className="text-xs text-text-muted">{report.period}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs ${getReportStatusClass(report.status)}`}
                    >
                      {report.status}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="bg-bg-surface border-border-color p-6">
          <h2 className="text-xl font-mono font-semibold text-text-primary mb-4">
            Organization Snapshot
          </h2>
          {primaryOrg ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-text-muted">Cohort</p>
                <p className="text-lg font-semibold text-text-primary">
                  {primaryOrg.name}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-bg-elevated rounded-lg border border-border-color">
                  <p className="text-xs text-text-muted">Interns</p>
                  <p className="text-xl font-mono font-bold text-text-primary">
                    {primaryOrg.interns.length}
                  </p>
                </div>
                <div className="p-3 bg-bg-elevated rounded-lg border border-border-color">
                  <p className="text-xs text-text-muted">Coordinator</p>
                  <p className="text-sm font-semibold text-text-primary">
                    {primaryOrg.coordinatorName}
                  </p>
                </div>
              </div>
              <div className="p-3 bg-bg-elevated rounded-lg border border-border-color">
                <p className="text-xs text-text-muted">Organization Code</p>
                <p className="text-sm font-mono text-text-primary">
                  {primaryOrg.code}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-text-muted">No organization assigned.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
