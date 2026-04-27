// src/hooks/useReports.ts
import { useState, useEffect } from 'react';
import { reports as mockReports } from '@/lib/mock-data';

export type ReportTab = 'all' | 'weekly' | 'monthly';

export interface ReportRow {
    id: string;
    internName: string;
    period: string;
    submittedAt: string;
    score: number | null;
    status: 'pending' | 'reviewed';
    content: string;
    coordinatorNote: string | null;
    type: 'weekly' | 'monthly';
}

// Local mock data for performance since it's missing in lib
const mockPerformanceData = [
    { name: 'Karl Tampus', score: 85 },
    { name: 'Kenneth Ambos', score: 92 },
    { name: 'Tovi Hermosisima', score: 78 },
    { name: 'Jhudiel Artizuela', score: 88 },
    { name: 'Rolando Alvarado', score: 95 },
];

const internNameById: Record<string, string> = {
    '1': 'Sarah Chen',
    '2': 'Marcus Rodriguez',
    '3': 'Emily Watson',
    '4': 'Alex Kim',
    '5': 'Aisha Patel',
    '6': 'Noah Williams',
    '7': 'Mia Garcia',
    '8': 'Liam Johnson',
};

export function useReports(filter: ReportTab) {
    const [reports, setReports] = useState<ReportRow[]>([]);
    const [performanceData] = useState(mockPerformanceData);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const mappedReports: ReportRow[] = mockReports
            .filter((report) => report.type !== 'daily')
            .map((report) => ({
                id: report.id,
                internName: internNameById[report.internId] ?? `Intern ${report.internId}`,
                period: report.period,
                submittedAt: report.submittedAt,
                score: report.score,
                status: report.status,
                content: report.content,
                coordinatorNote: report.coordinatorNote,
                type: report.type,
            }));

        if (filter === 'all') {
            setReports(mappedReports);
        } else {
            setReports(mappedReports.filter((r) => r.type === filter));
        }

        setLoading(false);
    }, [filter]);

    return { reports, performanceData, loading };
}