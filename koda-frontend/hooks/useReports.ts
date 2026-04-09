// src/hooks/useReports.ts
import { useState, useEffect } from 'react';
import { interns } from '@/lib/mock-data';

// Local mock data for performance since it's missing in lib
const mockPerformanceData = [
    { name: 'Karl Tampus', score: 85 },
    { name: 'Kenneth Ambos', score: 92 },
    { name: 'Tovi Hermosisima', score: 78 },
    { name: 'Jhudiel Artizuela', score: 88 },
    { name: 'Rolando Alvarado', score: 95 },
];

export function useReports(filter: string) {
    // We use the 'interns' data to simulate reports for the table
    const [reports, setReports] = useState<any[]>([]);
    const [performanceData] = useState(mockPerformanceData);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Mapping interns to a "Report" format for your table
        const mappedReports = interns.map((intern) => ({
            id: `rep-${intern.id}`,
            internName: intern.name,
            date: '2024-03-20', // Mock date
            type: 'weekly',
            status: intern.reportStatus, // Uses 'submitted', 'pending', or 'reviewed'
        }));

        if (filter === 'all') {
            setReports(mappedReports);
        } else {
            setReports(mappedReports.filter((r) => r.status === filter));
        }

        setLoading(false);
    }, [filter]);

    return { reports, performanceData, loading };
}