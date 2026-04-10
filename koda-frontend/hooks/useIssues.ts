// src/hooks/useIssues.ts
import { useState, useEffect, useMemo } from 'react';
import { interns } from '@/lib/mock-data';

// Defined based on the system architecture for GitHub event ingestion
export interface GitHubIssue {
    id: string;
    title: string;
    status: 'open' | 'in progress' | 'closed';
    assignee: string;
    timestamp: string;
}

// Local mock data reflecting the "Correlated Evidence" engine
const mockIssues: GitHubIssue[] = [
    { id: '1', title: 'Fix: Sidebar overlapping header on mobile', status: 'closed', assignee: 'Karl Tampus', timestamp: '2024-03-25 10:30 AM' },
    { id: '2', title: 'Feature: Add horizontal bar chart to reports', status: 'in progress', assignee: 'Kenneth Ambos', timestamp: '2024-03-26 02:15 PM' },
    { id: '3', title: 'Bug: Webhook signature validation failing', status: 'open', assignee: 'Tovi Hermosisima', timestamp: '2024-03-27 09:00 AM' },
    { id: '4', title: 'Docs: Update ERD link in project proposal', status: 'closed', assignee: 'Jhudiel Artizuela', timestamp: '2024-03-28 11:45 AM' },
    { id: '5', title: 'Refactor: Optimize Supabase RLS policies', status: 'open', assignee: 'Rolando Alvarado', timestamp: '2024-03-29 04:20 PM' },
];

interface UseIssuesProps {
    status: string;
    assignee: string;
}

export function useIssues({ status, assignee }: UseIssuesProps) {
    const [issues, setIssues] = useState<GitHubIssue[]>(mockIssues);

    // Extract unique assignees from the interns list for the filter dropdown
    const assignees = useMemo(() => {
        return interns.map(intern => intern.name);
    }, []);

    useEffect(() => {
        let filteredData = [...mockIssues];

        // Filter by Status (Open, In Progress, Closed)
        if (status !== 'all') {
            filteredData = filteredData.filter(
                issue => issue.status.toLowerCase() === status.toLowerCase()
            );
        }

        // Filter by Assignee
        if (assignee !== 'all') {
            filteredData = filteredData.filter(
                issue => issue.assignee === assignee
            );
        }

        setIssues(filteredData);
    }, [status, assignee]);

    return {
        issues,
        assignees,
        totalCount: mockIssues.length,
        filteredCount: issues.length
    };
}