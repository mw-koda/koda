'use client';

import { useRecentIssues } from '@/hooks/use-issues';
import { cn } from '@/lib/utils';

export function RecentIssuesFeed() {
  const { issues, isLoading, error } = useRecentIssues(5);

  if (isLoading) {
    return <div className="p-4 text-sm text-gray-500 animate-pulse">Loading recent activity...</div>;
  }

  if (error) {
    return <div className="p-4 text-sm text-red-500">Error: {error}</div>;
  }

  if (issues.length === 0) {
    return <div className="p-4 text-sm text-gray-500">No recent GitHub activity found.</div>;
  }

  return (
    <div className="space-y-4">
      {issues.map((issue) => (
        <div 
          key={issue.id} 
          className="flex items-start justify-between p-4 border rounded-lg bg-white shadow-sm"
        >
          <div className="flex flex-col gap-1">
            <span className="font-medium text-gray-900">{issue.title}</span>
            <span className="text-xs text-gray-500">
              ID: {issue.github_issue_id} • Updated: {new Date(issue.updated_at || '').toLocaleDateString()}
            </span>
          </div>
          <span 
            className={cn(
              "px-2 py-1 text-xs font-semibold rounded-full",
              issue.state === 'open' ? "bg-green-100 text-green-700" : 
              issue.state === 'closed' ? "bg-purple-100 text-purple-700" : 
              "bg-blue-100 text-blue-700"
            )}
          >
            {issue.state.toUpperCase()}
          </span>
        </div>
      ))}
    </div>
  );
}