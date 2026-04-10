'use client';
 
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { interns } from '@/lib/mock-data';
 
type ReportStatusFilter = 'all' | 'submitted' | 'pending' | 'reviewed';
 
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
 
export default function InternManagementPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReportStatusFilter>('all');
 
  const filtered = useMemo(() => {
    return interns.filter((intern) => {
      const matchesSearch =
        intern.name.toLowerCase().includes(search.toLowerCase()) ||
        intern.github.toLowerCase().includes(search.toLowerCase());
 
      const matchesStatus =
        statusFilter === 'all' || intern.reportStatus === statusFilter;
 
      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter]);
 
  return (
    <div className="p-8">


      {/* Header */}

      <div className="mb-8">
        <h1 className="text-4xl font-mono font-bold text-text-primary mb-2">
          Intern Management
        </h1>
        <p className="text-text-muted">
          Manage and monitor intern progress and performance
        </p>
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
                  GitHub Username
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Assigned Period
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Report Status
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Issues This Week
                </th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-color">
              {filtered.length > 0 ? (
                filtered.map((intern) => (
                  <tr
                    key={intern.id}
                    className="hover:bg-bg-elevated transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-text-primary">
                        {intern.name}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-text-muted font-mono">
                        @{intern.github}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-text-muted">
                        {intern.assignedPeriod}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant="outline"
                        className={`text-xs ${getReportStatusClass(intern.reportStatus)}`}
                      >
                        {intern.reportStatus}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <span className="  text-sm text-text-primary">
                        {intern.issuesThisWeek}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/coordinator/intern/${intern.id}`}
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
                        View Profile
                      </Link>
                    </td>
                  </tr>
                ))
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

 
        {/* Footer count */}


        <div className="px-6 py-3 border-t border-border-color">
          <p className="text-center text-xs text-text-muted">
            Showing {filtered.length} of {interns.length} intern
            {interns.length !== 1 ? 's' : ''}
          </p>
        </div>
      </Card>
    </div>
  );
}