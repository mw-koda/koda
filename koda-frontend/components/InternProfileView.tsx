'use client';
 
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  getInternById,
  getAttendanceByInternId,
  getIssuesByInternId,
  getEodByInternId,
  getReportsByInternId,
} from '@/lib/mock-data';
import { ArrowLeft, Calendar, ChevronDown, ChevronUp, FileText, GitPullRequest, Download } from 'lucide-react';
import type { Report } from '@/lib/mock-data';
 
function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}
 
function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}
 
function formatDuration(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}
 
function getReportStatusClass(status: string) {
  switch (status) {
    case 'reviewed':
      return 'bg-accent-primary/10 text-accent-primary border-accent-primary/30';
    case 'submitted':
      return 'bg-accent-warning/10 text-accent-warning border-accent-warning/30';
    case 'pending':
      return 'bg-text-muted/10 text-text-muted border-text-muted/30';
    default:
      return 'bg-text-muted/10 text-text-muted border-text-muted/30';
  }
}
 
async function exportReportsToPDF(
  internName: string,
  internRole: string,
  internGithub: string,
  reports: Report[],
  tab: string
) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();
 
  const margin = 20;
  let y = margin;
 
  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(`${internName} — ${tab.charAt(0).toUpperCase() + tab.slice(1)} Reports`, margin, y);
  y += 8;
 
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text(`${internRole} | @${internGithub}`, margin, y);
  y += 6;
  doc.text(`Exported on ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, margin, y);
  y += 10;
 
  // Divider
  doc.setDrawColor(200);
  doc.line(margin, y, 210 - margin, y);
  y += 10;
 
  if (reports.length === 0) {
    doc.setTextColor(150);
    doc.text('No reports found.', margin, y);
    doc.save(`${internName.replace(' ', '_')}_${tab}_reports.pdf`);
    return;
  }
 
  reports.forEach((report, index) => {
    // Check if we need a new page
    if (y > 260) {
      doc.addPage();
      y = margin;
    }
 
    // Report title
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text(`${index + 1}. ${report.period}`, margin, y);
    y += 6;
 
    // Meta
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(
      `Submitted: ${new Date(report.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}   Status: ${report.status}   Score: ${report.score ?? 'N/A'}`,
      margin,
      y
    );
    y += 6;
 
    // Content
    doc.setTextColor(40);
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(report.content, 210 - margin * 2);
    lines.forEach((line: string) => {
      if (y > 270) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += 5;
    });
 
    // Coordinator note
    if (report.coordinatorNote) {
      y += 3;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(80);
      doc.text('Coordinator Note:', margin, y);
      y += 5;
      const noteLines = doc.splitTextToSize(report.coordinatorNote, 210 - margin * 2);
      noteLines.forEach((line: string) => {
        if (y > 270) {
          doc.addPage();
          y = margin;
        }
        doc.text(line, margin, y);
        y += 5;
      });
    }
 
    y += 8;
    // Divider between reports
    doc.setDrawColor(220);
    doc.line(margin, y, 210 - margin, y);
    y += 8;
  });
 
  doc.save(`${internName.replace(' ', '_')}_${tab}_reports.pdf`);
}
 
type InternProfileViewProps = {
  backLabel?: string;
  internId?: string;
};
 
export default function InternProfileView({
  backLabel = 'Intern Management',
  internId,
}: InternProfileViewProps) {
  const params = useParams();
  const router = useRouter();
  const idFromParams = params?.id as string | undefined;
  const id = internId ?? idFromParams;
 
  const intern = id ? getInternById(id) : null;
  const attendanceLogs = id? getAttendanceByInternId(id) : [];
  const issues = id ? getIssuesByInternId(id) : [];
  const eodReports = id ? getEodByInternId(id) : [];
  const reports = id ? getReportsByInternId(id) : [];
 
  const [isEodOpen, setIsEodOpen] = useState(false);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [selectedReportTab, setSelectedReportTab] = useState<'weekly' | 'monthly'>('weekly');
  const [expandedReports, setExpandedReports] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);
 
  if (!intern) {
    return <div className="p-8 text-text-muted">Intern not found.</div>;
  }
 
  const sortedAttendance = [...attendanceLogs].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
 
  const sortedReports = [...reports]
    .filter((report) => report.type === selectedReportTab)
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
 
  const totalMinutes = attendanceLogs.reduce((acc, log) => acc + log.minutesWorked, 0);
  const selectedLog = sortedAttendance.find((log) => log.id === selectedLogId) || null;
  const selectedEod = selectedLog
    ? eodReports.find((report) => report.date === selectedLog.date) || null
    : null;
 
  function toggleReport(reportId: string) {
    setExpandedReports((prev) => {
      const next = new Set(prev);
      if (next.has(reportId)) {
        next.delete(reportId);
      } else {
        next.add(reportId);
      }
      return next;
    });
  }
 
  async function handleExport() {
    setIsExporting(true);
    try {
      await exportReportsToPDF(
        intern!.name,
        intern!.role,
        intern!.github,
        sortedReports,
        selectedReportTab
      );
    } finally {
      setIsExporting(false);
    }
  }
 
  return (
    <div className="p-8">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to {backLabel}
      </button>
 
      {/* Profile Header */}
      <div className="flex items-start gap-6 mb-8">
        <div className="w-20 h-20 rounded-full bg-accent-primary/20 border-2 border-accent-primary/40 flex items-center justify-center flex-shrink-0">
          <span className="text-2xl font-mono font-bold text-accent-primary">
            {intern.avatarInitials}
          </span>
        </div>
        <div>
          <h1 className="text-4xl font-mono font-bold text-text-primary mb-1">
            {intern.name}
          </h1>
          <p className="text-text-muted mb-2">{intern.role}</p>
          <div className="flex items-center gap-3">
            <span className="text-sm text-text-muted font-mono">@{intern.github}</span>
          </div>
          <div className="flex items-center gap-6 mt-3 text-sm text-text-muted">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {intern.assignedPeriod}
            </span>
            <span className="flex items-center gap-1.5">
              <FileText className="w-4 h-4" />
              {intern.reportsSubmitted} reports submitted
            </span>
            <span className="flex items-center gap-1.5">
              <GitPullRequest className="w-4 h-4" />
              {issues.length} GitHub issues
            </span>
          </div>
        </div>
      </div>
 
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Submitted Reports */}
        <Card className="bg-bg-surface border-border-color p-6">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-mono font-semibold text-text-primary">
                Submitted Reports
              </h2>
              <p className="text-xs text-text-muted mt-1">
                Track weekly and monthly submissions
              </p>
            </div>
            {/* Export Button */}
            <button
              onClick={handleExport}
              disabled={isExporting || sortedReports.length === 0}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-text-primary border border-border-color rounded-md hover:bg-bg-elevated transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-3.5 h-3.5" />
              {isExporting ? 'Exporting...' : 'Export PDF'}
            </button>
          </div>
 
          {/* Tabs */}
          <div className="flex items-center justify-center gap-2 bg-bg-elevated border border-border-color rounded-lg p-2 mb-6">
            <button
              onClick={() => setSelectedReportTab('weekly')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                selectedReportTab === 'weekly'
                  ? 'bg-accent-primary/15 text-accent-primary border border-accent-primary/30'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Weekly Reports
            </button>
            <button
              onClick={() => setSelectedReportTab('monthly')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                selectedReportTab === 'monthly'
                  ? 'bg-accent-primary/15 text-accent-primary border border-accent-primary/30'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Monthly Report
            </button>
          </div>
 
          {/* Report List */}
          <div className="space-y-4">
            {sortedReports.length > 0 ? (
              sortedReports.map((report) => {
                const isExpanded = expandedReports.has(report.id);
                return (
                  <div
                    key={report.id}
                    className="p-4 bg-bg-elevated rounded-lg border border-border-color"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-text-primary">
                          {report.period}
                        </p>
                        <p className="text-xs text-text-muted mt-1">
                          Submitted{' '}
                          {new Date(report.submittedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {report.score !== null && (
                          <Badge
                            variant="outline"
                            className="text-xs bg-accent-primary/10 text-accent-primary border-accent-primary/30"
                          >
                            {report.score}%
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          className={`text-xs ${getReportStatusClass(report.status)}`}
                        >
                          {report.status}
                        </Badge>
                      </div>
                    </div>
 
                    {/* Toggle Full Report */}
                    <button
                      onClick={() => toggleReport(report.id)}
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-accent-primary hover:text-accent-secondary transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                      {isExpanded ? 'Hide Report' : 'View Full Report'}
                    </button>
 
                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-border-color space-y-3">
                        <p className="text-xs text-text-muted leading-relaxed">
                          {report.content}
                        </p>
                        {report.coordinatorNote && (
                          <div className="p-3 bg-accent-primary/5 border border-accent-primary/20 rounded-lg">
                            <p className="text-xs text-accent-primary font-semibold mb-1">
                              Coordinator Note
                            </p>
                            <p className="text-xs text-text-muted leading-relaxed">
                              {report.coordinatorNote}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-text-muted text-center py-6">
                No {selectedReportTab} reports found.
              </p>
            )}
          </div>
        </Card>
 
        {/* Attendance Log */}
        <Card className="bg-bg-surface border-border-color p-6">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-mono font-semibold text-text-primary">
                Attendance Log
              </h2>
              <p className="text-xs text-text-muted mt-1">Total Hours/Minutes Served</p>
              <p className="text-2xl font-mono font-semibold text-text-primary mt-2">
                {formatDuration(totalMinutes)}
              </p>
            </div>
            <button className="px-3 py-1.5 text-xs font-semibold text-text-primary border border-border-color rounded-md hover:bg-bg-elevated transition-colors">
              Export
            </button>
          </div>
 
          <div className="space-y-3">
            {sortedAttendance.length > 0 ? (
              sortedAttendance.map((log) => (
                <div
                  key={log.id}
                  className="p-4 bg-bg-elevated rounded-lg border border-border-color"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-text-primary">
                      {formatDate(log.date)}
                    </p>
                    <Badge
                      variant="outline"
                      className="text-xs bg-accent-primary/10 text-accent-primary border-accent-primary/30"
                    >
                      {formatDuration(log.minutesWorked)}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                    <div>
                      <p className="text-xs text-text-muted">In</p>
                      <p className="text-sm text-text-primary font-mono">
                        {formatTime(log.clockIn)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-text-muted">Out</p>
                      <p className="text-sm text-text-primary font-mono">
                        {formatTime(log.clockOut)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 mt-3">
                    <p className="text-xs text-text-muted">{log.location}</p>
                    <button
                      onClick={() => {
                        setSelectedLogId(log.id);
                        setIsEodOpen(true);
                      }}
                      className="px-2.5 py-1 text-xs font-semibold text-accent-primary border border-accent-primary/30 rounded-md hover:bg-accent-primary/10 transition-colors"
                    >
                      View EOD
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-text-muted text-center py-6">
                No attendance logs found.
              </p>
            )}
          </div>
        </Card>
      </div>
 
      {/* EOD Dialog */}
      <Dialog open={isEodOpen} onOpenChange={setIsEodOpen}>
        <DialogContent className="bg-bg-surface border-border-color">
          <DialogHeader>
            <DialogTitle className="text-text-primary">EOD Report</DialogTitle>
            <DialogDescription className="text-text-muted">
              {selectedLog ? formatDate(selectedLog.date) : 'No date selected'}
            </DialogDescription>
          </DialogHeader>
 
          {selectedEod ? (
            <div className="space-y-4 text-sm text-text-muted">
              <div>
                <p className="text-xs uppercase tracking-wide text-text-muted mb-1">
                  Task Completed
                </p>
                <p className="text-text-primary">{selectedEod.taskCompleted}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-text-muted mb-1">Date</p>
                  <p className="text-text-primary">{formatDate(selectedEod.date)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-text-muted mb-1">Time Spent</p>
                  <p className="text-text-primary">{formatDuration(selectedEod.timeSpentMinutes)}</p>
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-text-muted mb-1">Key Success</p>
                <p className="text-text-primary">{selectedEod.keySuccess}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-text-muted mb-1">Main Challenges</p>
                <p className="text-text-primary">{selectedEod.mainChallenges}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-text-muted mb-1">Plans For Tomorrow</p>
                <p className="text-text-primary">{selectedEod.plansTomorrow}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-text-muted mb-2">Ratings (1-10)</p>
                <div className="grid grid-cols-2 gap-2">
                  {(['diet', 'exercise', 'relationship', 'overall'] as const).map((key) => (
                    <div key={key} className="flex items-center justify-between text-text-primary">
                      <span className="capitalize">{key}</span>
                      <span>{selectedEod.ratings[key]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-text-muted">No EOD report found for this day.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
