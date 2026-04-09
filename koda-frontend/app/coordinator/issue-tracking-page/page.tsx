// src/app/(dashboard)/issues/page.tsx
'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useIssues } from '@/hooks/useIssues';

export default function IssueTrackingPage() {
    const [statusFilter, setStatusFilter] = useState('all');
    const [assigneeFilter, setAssigneeFilter] = useState('all');
    const { issues, assignees } = useIssues({ status: statusFilter, assignee: assigneeFilter });

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-4xl font-mono font-bold text-text-primary mb-2">Issue Tracking</h1>
                <p className="text-text-muted">Live feed of GitHub issue activity captured via webhooks.</p>
            </div>

            {/* Filters */}
            <div className="flex gap-4 mb-6">
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-bg-surface border border-border-color rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-primary"
                >
                    <option value="all">All Statuses</option>
                    <option value="open">Open</option>
                    <option value="in progress">In Progress</option>
                    <option value="closed">Closed</option>
                </select>

                <select
                    value={assigneeFilter}
                    onChange={(e) => setAssigneeFilter(e.target.value)}
                    className="bg-bg-surface border border-border-color rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-primary"
                >
                    <option value="all">All Assignees</option>
                    {assignees.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
            </div>

            <Card className="bg-bg-surface border-border-color overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                    <tr className="border-b border-border-color bg-bg-elevated/30">
                        <th className="px-6 py-3 text-xs font-semibold text-text-muted uppercase">Issue Title</th>
                        <th className="px-6 py-3 text-xs font-semibold text-text-muted uppercase">Status</th>
                        <th className="px-6 py-3 text-xs font-semibold text-text-muted uppercase">Assignee</th>
                        <th className="px-6 py-3 text-xs font-semibold text-text-muted uppercase">Timestamp</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-border-color">
                    {issues.map((issue) => (
                        <tr key={issue.id} className="hover:bg-bg-elevated/50">
                            <td className="px-6 py-4 text-sm text-text-primary font-medium">{issue.title}</td>
                            <td className="px-6 py-4">
                                <Badge
                                    variant="outline"
                                    className={`font-mono text-[10px] uppercase px-3 py-1 rounded-full ${
                                        issue.status.toLowerCase() === 'closed'
                                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                                            : issue.status.toLowerCase() === 'open'
                                                ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                                                : 'bg-accent-primary/10 text-accent-primary border-accent-primary/30'
                                    }`}
                                >
                                    {issue.status}
                                </Badge>
                            </td>
                            <td className="px-6 py-4 text-sm text-text-muted">@{issue.assignee}</td>
                            <td className="px-6 py-4 text-sm text-text-muted">{issue.timestamp}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </Card>
        </div>
    );
}