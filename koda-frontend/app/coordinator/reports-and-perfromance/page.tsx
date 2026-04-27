// src/app/(dashboard)/reports/page.tsx
'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useReports, type ReportTab } from '../../../hooks/useReports';
import { cn } from '@/lib/utils';

type TabType = ReportTab;

function getReportStatusClass(status: 'pending' | 'reviewed' | string) {
    return status === 'reviewed'
        ? 'bg-accent-primary/10 text-accent-primary border-accent-primary/30'
        : 'bg-accent-warning/10 text-accent-warning border-accent-warning/30';
}

export default function ReportsPerformancePage() {
    const [activeTab, setActiveTab] = useState<TabType>('weekly');
    const { reports, loading, error, totalReports } = useReports(activeTab);

    const tabs = [
        { id: 'weekly', label: 'Weekly Reports' },
        { id: 'monthly', label: 'Monthly Reports' },
    ];

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-4xl font-mono font-bold text-text-primary mb-2">Reports & Performance</h1>
                <p className="text-text-muted">Review submissions and monitor technical output metrics.</p>
            </div>

            {/* Tabbed Layout */}
            <div className="flex gap-8 border-b border-border-color mb-6">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as TabType)}
                        className={cn(
                            'pb-4 text-sm font-medium transition-colors relative',
                            activeTab === tab.id ? 'text-accent-primary' : 'text-text-muted hover:text-text-primary'
                        )}
                    >
                        {tab.label}
                        {activeTab === tab.id && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-primary" />
                        )}
                    </button>
                ))}
            </div>

            {/* Reports Cards */}
            <Card className="bg-bg-surface border-border-color p-6 shadow-xl card-glow">
                <div className="flex items-start justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-xl font-mono font-semibold text-text-primary">
                            {activeTab === 'weekly' ? 'Weekly Submitted Reports' : 'Monthly Submitted Reports'}
                        </h2>
                        <p className="text-xs text-text-muted mt-1">
                            EOD reports are excluded from this coordinator list.
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs uppercase tracking-widest text-text-muted font-mono">Total</p>
                        <p className="text-2xl font-mono font-bold text-accent-primary">{totalReports}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {loading ? (
                        <div className="text-center py-12 text-text-muted font-mono">Loading reports...</div>
                    ) : error ? (
                        <div className="text-center py-12 border-2 border-dashed border-border-color rounded-xl text-red-300 font-mono">
                            {error}
                        </div>
                    ) : reports.length > 0 ? (
                        reports.map((report) => (
                            <div
                                key={report.id}
                                className="p-4 bg-bg-elevated rounded-lg border border-border-color hover:border-accent-primary/30 transition-all group"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-text-primary truncate">
                                            {report.title}
                                        </p>
                                        <p className="text-xs text-text-muted mt-1">
                                            By: {report.internName}
                                        </p>
                                        <p className="text-[10px] text-text-muted/60 mt-1 uppercase font-mono">
                                            Period: {report.period}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                        <Badge
                                            variant="outline"
                                            className={`text-[10px] uppercase font-mono px-2 py-0.5 ${getReportStatusClass(report.status)}`}
                                        >
                                            {report.status}
                                        </Badge>
                                        <Badge
                                            variant="outline"
                                            className="text-[10px] uppercase font-mono px-2 py-0.5 bg-bg-base text-text-muted border-border-color"
                                        >
                                            {report.type}
                                        </Badge>
                                    </div>
                                </div>

                                <p className="mt-4 text-sm text-text-muted line-clamp-2">
                                    {report.content}
                                </p>

                                <div className="mt-4 flex items-center justify-between gap-3">
                                    <div className="text-xs text-text-muted">
                                        Submitted {new Date(report.submittedAt).toLocaleString()}
                                    </div>
                                    <button className="inline-flex items-center gap-2 text-xs font-mono font-bold text-accent-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                        View Report
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12 border-2 border-dashed border-border-color rounded-xl">
                            <p className="text-sm text-text-muted">No {activeTab} reports found.</p>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}