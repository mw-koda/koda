// src/app/(dashboard)/reports/page.tsx
'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useReports } from '@/hooks/useReports';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

type TabType = 'all' | 'pending' | 'reviewed';

export default function ReportsPerformancePage() {
    const [activeTab, setActiveTab] = useState<TabType>('all');
    const { reports, performanceData, loading } = useReports(activeTab);

    const tabs = [
        { id: 'all', label: 'All Reports' },
        { id: 'pending', label: 'Pending Reviews' },
        { id: 'reviewed', label: 'Reviewed' },
    ];

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-4xl font-mono font-bold text-text-primary mb-2">Reports & Performance</h1>
                <p className="text-text-muted">Review submissions and monitor technical output metrics.</p>
            </div>

            {/* Performance Overview - Horizontal Bar Chart */}
            <Card className="bg-bg-surface border-border-color p-6 mb-8">
                <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-6">
                    Performance Overview
                </h3>
                <div className="h-[300px] w-full"> {/* Increased height for better label spacing */}
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            layout="vertical"
                            data={performanceData}
                            margin={{ left: 60, right: 40, top: 0, bottom: 0 }}
                        >
                            <XAxis type="number" hide />
                            <YAxis
                                dataKey="name"
                                type="category"
                                axisLine={false}
                                tickLine={false}
                                width={100}
                                tick={{
                                    fill: '#94a3b8', // Consistent muted slate for labels
                                    fontSize: 12,
                                    fontFamily: 'monospace'
                                }}
                            />
                            <Tooltip
                                cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                                contentStyle={{
                                    backgroundColor: '#4DFF91',
                                    border: '1px solid #1e293b',
                                    borderRadius: '8px'
                                }}
                            />
                            {/* Using your branding:
                  Primary: #003a6b
                  Accent: #ff4d00 (used for the bar ends/radius for pop)
                */}
                            <Bar
                                dataKey="score"
                                fill="#003a6b"
                                radius={[0, 4, 4, 0]}
                                barSize={24}
                                background={{ fill: '#1e293b', radius: [0, 4, 4, 0] }} // Visible track
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            {/* Tabbed Layout */}
            <div className="flex gap-8 border-b border-border-color mb-6">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as TabType)}
                        className={`pb-4 text-sm font-medium transition-colors relative ${
                            activeTab === tab.id ? 'text-accent-primary' : 'text-text-muted hover:text-text-primary'
                        }`}
                    >
                        {tab.label}
                        {activeTab === tab.id && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-primary" />
                        )}
                    </button>
                ))}
            </div>

            {/* Reports Table */}
            <Card className="bg-bg-surface border-border-color overflow-hidden">
                <table className="w-full">
                    <thead>
                    <tr className="border-b border-border-color bg-bg-elevated/30">
                        <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted uppercase">Name</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted uppercase">Date</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted uppercase">Type</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted uppercase">Status</th>
                        <th className="text-right px-6 py-3 text-xs font-semibold text-text-muted uppercase">Action</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-border-color">
                    {reports.map((report) => (
                        <tr key={report.id} className="hover:bg-bg-elevated/50 transition-colors">
                            <td className="px-6 py-4 text-sm font-medium text-text-primary">{report.internName}</td>
                            <td className="px-6 py-4 text-sm text-text-muted">{report.date}</td>
                            <td className="px-6 py-4 text-sm text-text-muted uppercase">{report.type}</td>
                            <td className="px-6 py-4">
                                <Badge variant="outline" className={report.status === 'pending' ? 'bg-accent-warning/10 text-accent-warning border-accent-warning/30' : 'bg-accent-primary/10 text-accent-primary border-accent-primary/30'}>
                                    {report.status}
                                </Badge>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <button className="text-accent-primary text-sm font-medium hover:underline">View Report</button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </Card>
        </div>
    );
}