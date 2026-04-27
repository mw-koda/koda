'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ArrowLeft, Calendar, ChevronDown, FileText, GitPullRequest, Loader2, TrendingUp } from 'lucide-react';
import { ReportFormModal } from './report-form-modal';
import { ReportViewModal } from './report-view-modal';
import { cn } from '@/lib/utils';

// Real API imports
import { internsApi, type InternRecord } from '@/lib/api/interns';
import { reportsApi, type ReportRecord } from '@/lib/api/reports';
import { attendanceApi, type AttendanceSummary, type AttendanceLog } from '@/lib/api/attendance';
import { issuesApi, type Issue } from '@/lib/api/issues';

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(dateStr: string | null) {
  if (!dateStr) return '--:--';
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatDuration(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);
  return `${hours}h ${minutes}m`;
}

function getReportStatusClass(status: string | null) {
  switch (status) {
    case 'reviewed':
      return 'bg-accent-primary/10 text-accent-primary border-accent-primary/30';
    case 'submitted':
      return 'bg-accent-warning/10 text-accent-warning border-accent-warning/30';
    case 'pending':
    case 'draft':
      return 'bg-text-muted/10 text-text-muted border-text-muted/30';
    default:
      return 'bg-text-muted/10 text-text-muted border-text-muted/30';
  }
}

function isEodReport(report: ReportRecord) {
  return (report.title || '').toLowerCase().startsWith('eod report');
}

function isWeeklyReport(report: ReportRecord) {
  return (report.title || '').toLowerCase().startsWith('weekly report');
}

function isMonthlyReport(report: ReportRecord) {
  return (report.title || '').toLowerCase().startsWith('monthly report');
}

function toDateKey(value: string | null) {
  if (!value) return null;
  const match = value.match(/\d{4}-\d{2}-\d{2}/);
  if (match) return match[0];
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

function buildAvatarInitials(name: string | null, github: string): string {
  if (name) {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }
  return github.substring(0, 2).toUpperCase();
}

type InternProfileViewProps = {
  backLabel?: string;
  internId: string;
  canManageReports?: boolean;
  canReviewReports?: boolean;
};

export default function InternProfileView({
  backLabel = 'Intern Management',
  internId,
  canManageReports = false,
  canReviewReports = false,
}: InternProfileViewProps) {
  const router = useRouter();
  
  // Data State
  const [intern, setIntern] = useState<InternRecord | null>(null);
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [attendance, setAttendance] = useState<AttendanceSummary | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  
  // Loading & Error State
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI State
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [isAddReportModalOpen, setIsAddReportModalOpen] = useState(false);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');

  const [isReportViewOpen, setIsReportViewOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportRecord | null>(null);
  const [forceEodReport, setForceEodReport] = useState(false);
  const [activeReportTab, setActiveReportTab] = useState<'weekly' | 'monthly'>('weekly');
  const [reviewingReportId, setReviewingReportId] = useState<string | null>(null);

  const [isTimingIn, setIsTimingIn] = useState(false);
  const [isTimingOut, setIsTimingOut] = useState(false);

  useEffect(() => {
    if (!internId) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [internData, reportsData, attendanceData, issuesData] = await Promise.all([
          internsApi.getOne(internId),
          reportsApi.findByInternId(internId),
          attendanceApi.findByInternId(internId),
          issuesApi.findByInternId(internId),
        ]);

        setIntern(internData);
        setReports(reportsData);
        setAttendance(attendanceData);
        setIssues(issuesData);
      } catch (err: any) {
        console.error('Failed to fetch intern profile:', err);
        setError(err.message || 'Failed to load profile data.');
      } finally {
        setIsLoading(false);
      }
    };

    void fetchData();
  }, [internId]);

  const refreshData = async () => {
    try {
      const reportsData = await reportsApi.findByInternId(internId);
      setReports(reportsData);
    } catch (err) {
      console.error('Failed to refresh reports:', err);
    }
  };

  const refreshAttendance = async () => {
    try {
      const attendanceData = await attendanceApi.findByInternId(internId);
      setAttendance(attendanceData);
    } catch (err) {
      console.error('Failed to refresh attendance:', err);
    }
  };

  const handleReviewReport = async (reportId: string) => {
    setReviewingReportId(reportId);
    try {
      await reportsApi.updateStatus(reportId, 'reviewed');
      await refreshData();
      if (selectedReport?.id === reportId) {
        const refreshedReport = (await reportsApi.findByInternId(internId)).find((report) => report.id === reportId) ?? null;
        setSelectedReport(refreshedReport);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update report status');
    } finally {
      setReviewingReportId(null);
    }
  };

  const handleTimeIn = async () => {
    setIsTimingIn(true);
    try {
      await attendanceApi.timeIn();
      await refreshAttendance();
    } catch (err: any) {
      alert(err.message || 'Failed to clock in');
    } finally {
      setIsTimingIn(false);
    }
  };

  const handleTimeOut = async () => {
    setIsTimingOut(true);
    try {
      await attendanceApi.timeOut();
      await refreshAttendance();
      setIsAttendanceModalOpen(false);
      setForceEodReport(true);
      setIsAddReportModalOpen(true);
    } catch (err: any) {
      alert(err.message || 'Failed to clock out');
    } finally {
      setIsTimingOut(false);
    }
  };

  useEffect(() => {
    if (isAttendanceModalOpen) {
      const updateTime = () => {
        const now = new Date();
        setCurrentTime(
          now.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
          })
        );
      };
      updateTime();
      const interval = setInterval(updateTime, 1000);
      return () => clearInterval(interval);
    }
  }, [isAttendanceModalOpen]);

  const sortedAttendance = useMemo(() => {
    return [...(attendance?.logs || [])].sort(
      (a, b) => new Date(b.timeIn).getTime() - new Date(a.timeIn).getTime()
    );
  }, [attendance]);

  const sortedReports = useMemo(() => {
    return [...reports].sort(
      (a, b) => new Date(b.submitted_at || 0).getTime() - new Date(a.submitted_at || 0).getTime()
    );
  }, [reports]);

  const eodReports = useMemo(() => {
    return sortedReports.filter(isEodReport);
  }, [sortedReports]);

  const nonEodReports = useMemo(() => {
    return sortedReports.filter((report) => !isEodReport(report));
  }, [sortedReports]);

  const weeklyReports = useMemo(() => {
    return nonEodReports.filter(isWeeklyReport);
  }, [nonEodReports]);

  const monthlyReports = useMemo(() => {
    return nonEodReports.filter(isMonthlyReport);
  }, [nonEodReports]);

  const eodReportByDate = useMemo(() => {
    const map = new Map<string, ReportRecord>();
    eodReports.forEach((report) => {
      const reportDateKey = toDateKey(report.period_start);
      if (reportDateKey) {
        map.set(reportDateKey, report);
      }
    });
    return map;
  }, [eodReports]);

  const totalMinutes = attendance?.totalHours ? attendance.totalHours * 60 : 0;
  const selectedLog = sortedAttendance.find((log) => log.id === selectedLogId) || null;
  const hasOpenSession = sortedAttendance.some((log) => !log.timeOut);
  const todayDate = new Date().toISOString().split('T')[0];
  const hasCompletedSessionToday = sortedAttendance.some(
    (log) => log.timeOut && log.timeIn.slice(0, 10) === todayDate
  );

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-accent-primary" />
          <p className="text-sm text-text-muted font-mono">Fetching profile data...</p>
        </div>
      </div>
    );
  }

  if (error || !intern) {
    return (
      <div className="p-8">
        <Card className="border-red-500/30 bg-red-500/5 p-8 text-center">
          <p className="text-red-400 font-mono mb-4">{error || 'Intern not found.'}</p>
          <button
            onClick={() => router.back()}
            className="text-sm text-accent-primary underline underline-offset-4"
          >
            Go back
          </button>
        </Card>
      </div>
    );
  }

  const avatarInitials = buildAvatarInitials(intern.user?.name || null, intern.user?.github_username || 'UN');

  return (
    <div className="p-8">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to {backLabel}
      </button>

      <div className="flex flex-col md:flex-row items-start justify-between gap-6 mb-8">
        <div className="flex items-start gap-6 flex-1">
          <div className="w-20 h-20 rounded-full bg-accent-primary/20 border-2 border-accent-primary/40 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl font-mono font-bold text-accent-primary">
              {avatarInitials}
            </span>
          </div>
          <div className="min-w-0">
            <h1 className="text-4xl font-mono font-bold text-text-primary mb-1 truncate">
              {intern.user?.name || intern.user?.github_username}
            </h1>
            <p className="text-text-muted mb-2">Intern</p>
            <div className="flex items-center gap-3">
              <span className="text-sm text-text-muted font-mono">@{intern.user?.github_username}</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4 text-sm text-text-muted">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-accent-primary" />
                Joined {new Date(intern.created_at || '').toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-accent-primary" />
                {reports.length} reports submitted
              </span>
              <span className="flex items-center gap-1.5">
                <GitPullRequest className="w-4 h-4 text-accent-primary" />
                {issues.length} total issues
              </span>
            </div>
          </div>
        </div>
        {canManageReports && (
          <div className="flex items-center gap-3 flex-shrink-0 w-full md:w-auto">
            <button
              onClick={() => setIsAddReportModalOpen(true)}
              className="flex-1 md:flex-none px-4 py-2 text-sm font-semibold text-bg-base bg-accent-primary rounded-md hover:bg-accent-primary/90 transition-colors shadow-lg"
            >
              + Add Report
            </button>
            <button
              onClick={() => setIsAttendanceModalOpen(true)}
              className="flex-1 md:flex-none px-4 py-2 text-sm font-semibold text-accent-secondary border border-accent-secondary/30 rounded-md hover:bg-accent-secondary/10 transition-colors"
            >
              Attendance
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Reports List */}
        <Card className="bg-bg-surface border-border-color p-6 shadow-xl card-glow">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-mono font-semibold text-text-primary">
                Submitted Report List
              </h2>
              <p className="text-xs text-text-muted mt-1">
                List of all submitted reports and their current status.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-bg-elevated border border-border-color rounded-md p-1">
              {(['weekly', 'monthly'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveReportTab(tab)}
                  className={cn(
                    "px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-widest rounded transition-all",
                    activeReportTab === tab
                      ? "bg-accent-primary text-bg-base shadow"
                      : "text-text-muted hover:text-text-primary"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
            {(activeReportTab === 'weekly' ? weeklyReports : monthlyReports).length > 0 ? (
              (activeReportTab === 'weekly' ? weeklyReports : monthlyReports).map((report) => (
                <div
                  key={report.id}
                  className="p-4 bg-bg-elevated rounded-lg border border-border-color hover:border-accent-primary/30 transition-all group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-text-primary truncate">
                        {report.title || 'Untitled Report'}
                      </p>
                      <p className="text-xs text-text-muted mt-1">
                        Period: {new Date(report.period_start || '').toLocaleDateString()} — {new Date(report.period_end || '').toLocaleDateString()}
                      </p>
                      <p className="text-[10px] text-text-muted/60 mt-1 uppercase font-mono">
                        Submitted {new Date(report.submitted_at || '').toLocaleString()}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] uppercase font-mono px-2 py-0.5 ${getReportStatusClass(report.status)}`}
                    >
                      {report.status}
                    </Badge>
                  </div>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <button
                        className="inline-flex items-center gap-2 text-xs font-mono font-bold text-accent-primary opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => {
                          setSelectedReport(report);
                          setIsReportViewOpen(true);
                        }}
                      >
                        <ChevronDown className="w-3 h-3" />
                        Expand Content
                      </button>

                      {canReviewReports && report.status !== 'reviewed' && (
                        <button
                          type="button"
                          onClick={() => void handleReviewReport(report.id)}
                          disabled={reviewingReportId === report.id}
                          className={cn(
                            'inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-widest transition-all',
                            reviewingReportId === report.id
                              ? 'cursor-not-allowed border-border-color text-text-muted opacity-70'
                              : 'border-accent-primary/40 text-accent-primary hover:bg-accent-primary/10'
                          )}
                        >
                          {reviewingReportId === report.id ? 'Updating...' : 'Mark Reviewed'}
                        </button>
                      )}

                      {canReviewReports && report.status === 'reviewed' && (
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-accent-primary">
                          Reviewed
                        </span>
                      )}
                    </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 border-2 border-dashed border-border-color rounded-xl">
                <FileText className="w-8 h-8 text-text-muted mx-auto mb-3 opacity-20" />
                <p className="text-sm text-text-muted">
                  {activeReportTab === 'weekly' ? 'No weekly submissions.' : 'No monthly submissions.'}
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Attendance Log */}
        <Card className="bg-bg-surface border-border-color p-6 shadow-xl card-glow">
          <div className="flex items-start justify-between gap-4 mb-8">
            <div>
              <h2 className="text-xl font-mono font-semibold text-text-primary">
                Attendance Log
              </h2>
              <p className="text-xs text-text-muted mt-1">
                Total Rendered Time
              </p>
              <p className="text-3xl font-mono font-bold text-accent-primary mt-2">
                {formatDuration(totalMinutes)}
              </p>
            </div>
            <button className="px-3 py-1.5 text-xs font-mono font-bold text-text-muted border border-border-color rounded hover:bg-bg-elevated hover:text-text-primary transition-all uppercase tracking-widest">
              Export CSV
            </button>
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            {sortedAttendance.length > 0 ? (
              sortedAttendance.map((log) => {
                const logDateKey = toDateKey(log.timeIn);
                const hasEod = !!logDateKey && eodReportByDate.has(logDateKey);

                return (
                  <div
                    key={log.id}
                    className="p-4 bg-bg-elevated rounded-lg border border-border-color relative overflow-hidden"
                  >
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <p className="text-sm font-semibold text-text-primary">
                      {formatDate(log.timeIn.slice(0, 10))}
                    </p>
                    <Badge
                      variant="outline"
                      className="text-[10px] font-mono bg-accent-primary/5 text-accent-primary border-accent-primary/20"
                    >
                      {formatDuration(log.renderedHours ? log.renderedHours * 60 : 0)}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] uppercase font-mono text-text-muted mb-1">Time In</p>
                      <p className="text-sm text-text-primary font-mono bg-bg-surface px-2 py-1 rounded">
                        {formatTime(log.timeIn)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-mono text-text-muted mb-1">Time Out</p>
                      <p className="text-sm text-text-primary font-mono bg-bg-surface px-2 py-1 rounded">
                        {log.timeOut ? formatTime(log.timeOut) : '--:--'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => {
                        const eodReport = logDateKey ? eodReportByDate.get(logDateKey) : undefined;
                        if (!eodReport) return;
                        setSelectedReport(eodReport);
                        setIsReportViewOpen(true);
                      }}
                      disabled={!hasEod}
                      className={cn(
                        "inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest px-3 py-1.5 rounded border transition-all",
                        hasEod
                          ? "border-accent-primary/40 text-accent-primary hover:bg-accent-primary/10"
                          : "border-border-color text-text-muted cursor-not-allowed"
                      )}
                    >
                      EOD
                    </button>
                  </div>
                </div>
                );
              })
            ) : (
              <div className="text-center py-12 border-2 border-dashed border-border-color rounded-xl">
                <Calendar className="w-8 h-8 text-text-muted mx-auto mb-3 opacity-20" />
                <p className="text-sm text-text-muted">No attendance logs found.</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Add Report Modal */}
      <ReportFormModal
        isOpen={isAddReportModalOpen}
        onOpenChange={(open) => {
          setIsAddReportModalOpen(open);
          if (!open) {
            setForceEodReport(false);
          }
        }}
        internId={internId}
        onSuccess={refreshData}
        initialType={forceEodReport ? 'eod' : undefined}
        lockTypeSelection={forceEodReport}
        showDoLater={forceEodReport}
      />

      <ReportViewModal
        report={selectedReport}
        isOpen={isReportViewOpen}
        onOpenChange={setIsReportViewOpen}
      />

      {/* Attendance Management Modal (Simplified for view) */}
      <Dialog open={isAttendanceModalOpen} onOpenChange={setIsAttendanceModalOpen}>
        <DialogContent className="bg-bg-surface border-border-color sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-text-primary font-mono">
              Attendance
            </DialogTitle>
            <DialogDescription className="text-text-muted">
              {intern.user?.name || intern.user?.github_username} {/* SYSTEM ACCESS */}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-6">
            <div className="text-center bg-bg-elevated rounded-xl p-8 border border-border-color">
              <p className="text-xs font-mono uppercase tracking-[0.3em] text-accent-primary mb-2">Current System Time</p>
              <p className="text-5xl font-mono font-bold text-text-primary tracking-tighter">
                {currentTime}
              </p>
            </div>

            <div className="grid gap-3">
              <button
                onClick={handleTimeIn}
                disabled={hasOpenSession || hasCompletedSessionToday || isTimingIn}
                className={cn(
                  "w-full py-3 px-4 text-sm font-mono font-bold rounded-md transition-all shadow-lg active:scale-95 flex items-center justify-center",
                  hasOpenSession || hasCompletedSessionToday || isTimingIn
                    ? "bg-bg-elevated border border-border-color text-text-muted cursor-not-allowed shadow-none"
                    : "bg-accent-primary text-bg-base hover:bg-accent-primary/90"
                )}
              >
                {isTimingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : 'TIME IN'}
              </button>
              {hasCompletedSessionToday && (
                <div className="rounded-md border border-accent-warning/40 bg-accent-warning/10 px-3 py-2 text-center">
                  <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-accent-warning">
                    Sorry, you already completed your attendance today.
                  </p>
                </div>
              )}
              <button
                onClick={handleTimeOut}
                disabled={!hasOpenSession || isTimingOut}
                className={cn(
                  "w-full py-3 px-4 text-sm font-mono font-bold rounded-md transition-all active:scale-95 flex items-center justify-center",
                  !hasOpenSession || isTimingOut
                    ? "border border-border-color text-text-muted cursor-not-allowed"
                    : "bg-accent-secondary text-white shadow-lg hover:bg-accent-secondary/90"
                )}
              >
                {isTimingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : 'TIME OUT'}
              </button>
            </div>
            
            <p className="text-[10px] text-center text-text-muted font-mono uppercase tracking-widest">
              KODA Framework v1.0.0 // SECURITY LOG ACTIVE
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
