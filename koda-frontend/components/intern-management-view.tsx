'use client';
 
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { interns, getReportsByInternId } from '@/lib/mock-data';
 
type ReportStatusFilter = 'all' | 'submitted' | 'pending' | 'reviewed';
 
type InternManagementViewProps = {
  profileBasePath?: string;
  title?: string;
  subtitle?: string;
  teamFilter?: string;
};
 
function getReportStatusClass(status: string) {
  switch (status) {
    case 'submitted':
      return 'bg-accent-warning/10 text-accent-warning border-accent-warning/30';
    case 'reviewed':
      return 'bg-accent-primary/10 text-accent-primary border-accent-primary/30';
    case 'pending':
      return 'bg-text-muted/10 text-text-muted border-text-muted/30';
    default:
      return 'bg-text-muted/10 text-text-muted border-text-muted/30';
  }
}
 
function getReportTypeClass(type: string) {
  switch (type) {
    case 'weekly':
      return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    case 'daily':
      return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
    default:
      return 'bg-text-muted/10 text-text-muted border-text-muted/30';
  }
}
 
export default function InternManagementView({
  profileBasePath = '/coordinator/intern',
  title = 'Intern Management',
  subtitle = 'Manage and monitor intern progress and performance',
  teamFilter,
}: InternManagementViewProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReportStatusFilter>('all');
 
  const availableInterns = teamFilter
    ? interns.filter((intern) => intern.team === teamFilter)
    : interns;
 
  const filtered = useMemo(() => {
    return availableInterns.filter((intern) => {
      const matchesSearch =
        intern.name.toLowerCase().includes(search.toLowerCase()) ||
        intern.github.toLowerCase().includes(search.toLowerCase());
 
      const reports = getReportsByInternId(intern.id);
      const latestReport = reports.sort(
        (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      )[0];
 
      const matchesStatus =
        statusFilter === 'all' || (latestReport?.status === statusFilter);
 
      return matchesSearch && matchesStatus;
    });
  }, [availableInterns, search, statusFilter]);
 
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-mono font-bold text-text-primary mb-2">
          {title}
        </h1>
        <p className="text-text-muted">{subtitle}</p>
      </div>
 
      {/* Filters */}
      <Card className="bg-bg-surface border-border-color p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
              />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or GitHub username..."
              className="w-full pl-10 pr-4 py-2 bg-bg-elevated border border-border-color rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary transition-colors"
            />
          </div>
 
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ReportStatusFilter)}
            className="px-4 py-2 bg-bg-elevated border border-border-color rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent-primary transition-colors cursor-pointer min-w-[160px]"
          >
            <option value="all">All Interns</option>
            <option value="submitted">Submitted</option>
            <option value="pending">Pending</option>
            <option value="reviewed">Reviewed</option>
          </select>
        </div>
      </Card>
 
      {/* Table */}
      <Card className="bg-bg-surface border-border-color overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-color">
                <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Name
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                  GitHub
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Recent Report Type
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Report Status
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Issues
                </th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-color">
              {filtered.length > 0 ? (
                filtered.map((intern) => {
                  const reports = getReportsByInternId(intern.id);
                  const latestReport = [...reports].sort(
                    (a, b) =>
                      new Date(b.submittedAt).getTime() -
                      new Date(a.submittedAt).getTime()
                  )[0];
 
                  return (
                    <tr
                      key={intern.id}
                      className="hover:bg-bg-elevated transition-colors"
                    >
                      {/* Name */}
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-text-primary">
                          {intern.name}
                        </span>
                      </td>
 
                      {/* GitHub */}
                      <td className="px-6 py-4">
                        <span className="text-sm text-text-muted font-mono">
                          @{intern.github}
                        </span>
                      </td>
 
                      {/* Recent Report Type */}
                      <td className="px-6 py-4">
                        {latestReport ? (
                          <div>
                            <Badge
                              variant="outline"
                              className={`text-xs ${getReportTypeClass(latestReport.type)}`}
                            >
                              {latestReport.type}
                            </Badge>
                            <p className="text-xs text-text-primary mt-1">
                              {latestReport.period}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-text-muted">No reports</span>
                        )}
                      </td>
 
                      {/* Report Status */}
                      <td className="px-6 py-4">
                        {latestReport ? (
                          <Badge
                            variant="outline"
                            className={`text-xs ${getReportStatusClass(latestReport.status)}`}
                          >
                            {latestReport.status}
                          </Badge>
                        ) : (
                          <span className="text-xs text-text-muted">—</span>
                        )}
                      </td>
 
                      {/* Issues */}
                      <td className="px-6 py-4">
                        <span className="text-sm text-text-primary">
                          {intern.issuesThisWeek}
                        </span>
                      </td>
 
                      {/* Actions */}
                      <td className="px-6 py-4 text-center">
                        <Link
                          href={`${profileBasePath}/${intern.id}`}
                          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-accent-primary border border-accent-primary/30 rounded-lg hover:bg-accent-primary/10 transition-colors"
                        >
                          <svg
                            className="w-4 h-4"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-sm text-text-muted"
                  >
                    No interns found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
 
        {/* Footer */}
        <div className="px-6 py-3 border-t border-border-color">
          <p className="text-center text-xs text-text-muted">
            Showing {filtered.length} of {availableInterns.length} intern
            {availableInterns.length !== 1 ? 's' : ''}
          </p>
        </div>
      </Card>
    </div>
  );
}
 