'use client';

import { useState, useEffect } from 'react';
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
import { ArrowLeft, Calendar, ChevronDown, FileText, GitPullRequest } from 'lucide-react';

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

type InternProfileViewProps = {
  backLabel?: string;
  internId?: string;
  canManageReports?: boolean;
};

export default function InternProfileView({
  backLabel = 'Intern Management',
  internId,
  canManageReports = false,
}: InternProfileViewProps) {
  const params = useParams();
  const router = useRouter();
  const idFromParams = params?.id as string | undefined;
  const id = internId ?? idFromParams ?? '';

  const intern = getInternById(id);
  const attendanceLogs = getAttendanceByInternId(id);
  const issues = getIssuesByInternId(id);
  const eodReports = getEodByInternId(id);
  const reports = getReportsByInternId(id);
  const [isEodOpen, setIsEodOpen] = useState(false);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [selectedReportTab, setSelectedReportTab] = useState<'weekly' | 'monthly' | 'eod'>('weekly');
  const [isAddReportModalOpen, setIsAddReportModalOpen] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState<'eod' | 'weekly' | 'monthly' | null>(null);
  const [isEodFormOpen, setIsEodFormOpen] = useState(false);
  const [eodFormData, setEodFormData] = useState({
    taskCompleted: '',
    date: '',
    timeSpent: '',
    keySuccess: '',
    mainChallenges: '',
    plansForTomorrow: '',
    diet: 5,
    exercise: 5,
    relationship: 5,
    overall: 5,
  });
  const [isWeeklyFormOpen, setIsWeeklyFormOpen] = useState(false);
  const [weeklyFormData, setWeeklyFormData] = useState({
    studentName: '',
    yearSection: '',
    studentId: '',
    company: '',
    department: '',
    companyAddress: '',
    supervisor: '',
    periodStarts: '',
    periodEnds: '',
    weeklyLog: [
      { day: 'Monday', timeIn: '', timeOut: '', totalHours: '', supervisorInitial: '' },
      { day: 'Tuesday', timeIn: '', timeOut: '', totalHours: '', supervisorInitial: '' },
      { day: 'Wednesday', timeIn: '', timeOut: '', totalHours: '', supervisorInitial: '' },
      { day: 'Thursday', timeIn: '', timeOut: '', totalHours: '', supervisorInitial: '' },
      { day: 'Friday', timeIn: '', timeOut: '', totalHours: '', supervisorInitial: '' },
    ],
  });
  const [isMonthlyFormOpen, setIsMonthlyFormOpen] = useState(false);
  const [monthlyFormData, setMonthlyFormData] = useState({
    traineeName: '',
    ojtId: '',
    companyName: '',
    companyName2: '',
    periodStarts: '',
    periodEnds: '',
    monthlyLog: [
      { week: 'Week 1', workTimes: '', totalHours: '', workAccomplished: '' },
      { week: 'Week 2', workTimes: '', totalHours: '', workAccomplished: '' },
      { week: 'Week 3', workTimes: '', totalHours: '', workAccomplished: '' },
      { week: 'Week 4', workTimes: '', totalHours: '', workAccomplished: '' },
      { week: 'Week 5', workTimes: '', totalHours: '', workAccomplished: '' },
    ],
    totalWorkHours: '',
  });
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState<'not-timed-in' | 'timed-in' | 'completed'>('not-timed-in');
  const [currentTime, setCurrentTime] = useState<string>('');
  const [timedInTime, setTimedInTime] = useState<string>('');
  const [timedOutTime, setTimedOutTime] = useState<string>('');

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

  if (!intern) {
    return <div className="p-8 text-text-muted">Intern not found.</div>;
  }

  const sortedAttendance = [...attendanceLogs].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const sortedReports = [...reports]
    .filter((report) => report.type === selectedReportTab)
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  const sortedEodReports = [...eodReports]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const totalMinutes = attendanceLogs.reduce((acc, log) => acc + log.minutesWorked, 0);
  const selectedLog = sortedAttendance.find((log) => log.id === selectedLogId) || null;
  const selectedEod = selectedLog
    ? eodReports.find((report) => report.date === selectedLog.date) || null
    : null;

  return (
    <div className="p-8">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to {backLabel}
      </button>

      <div className="flex items-start justify-between gap-6 mb-8">
        <div className="flex items-start gap-6 flex-1">
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
        {canManageReports && (
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => setIsAddReportModalOpen(true)}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              + Add Report
            </button>
            <button
              onClick={() => setIsAttendanceModalOpen(true)}
              className="px-4 py-2 text-sm font-semibold text-accent-secondary border border-accent-secondary rounded-md hover:bg-accent-secondary/10 transition-colors"
            >
              Attendance
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-bg-surface border-border-color p-6">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-mono font-semibold text-text-primary">
                Submitted Reports List
              </h2>
              <p className="text-xs text-text-muted mt-1">
                Track weekly, monthly and EOD submissions
              </p>
            </div>
          </div>

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
              Monthly Reports
            </button>
            <button
              onClick={() => setSelectedReportTab('eod')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                selectedReportTab === 'eod'
                  ? 'bg-accent-primary/15 text-accent-primary border border-accent-primary/30'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              EOD Reports
            </button>
          </div>

          <div className="space-y-4">
            {selectedReportTab === 'eod' ? (
              sortedEodReports.length > 0 ? (
                sortedEodReports.map((report) => (
                  <div
                    key={report.id}
                    className="p-4 bg-bg-elevated rounded-lg border border-border-color"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-text-primary">
                          {new Date(report.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                        <p className="text-xs text-text-muted mt-1">
                          {report.taskCompleted}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-xs bg-accent-primary/10 text-accent-primary border-accent-primary/30"
                      >
                        completed
                      </Badge>
                    </div>
                    <button className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-accent-primary hover:text-accent-secondary transition-colors">
                      <ChevronDown className="w-4 h-4" />
                      View Full Report
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-text-muted text-center py-6">
                  No EOD reports found.
                </p>
              )
            ) : sortedReports.length > 0 ? (
              sortedReports.map((report) => (
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
                        Submitted {new Date(report.submittedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs ${getReportStatusClass(report.status)}`}
                    >
                      {report.status}
                    </Badge>
                  </div>
                  <button className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-accent-primary hover:text-accent-secondary transition-colors">
                    <ChevronDown className="w-4 h-4" />
                    View Full Report
                  </button>
                </div>
              ))
            ) : (
              <p className="text-sm text-text-muted text-center py-6">
                No {selectedReportTab} reports found.
              </p>
            )}
          </div>
        </Card>

        <Card className="bg-bg-surface border-border-color p-6">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-mono font-semibold text-text-primary">
                Attendance Log
              </h2>
              <p className="text-xs text-text-muted mt-1">
                Total Hours/Minutes Served
              </p>
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
                    <p className="text-xs text-text-muted">
                      {log.location}
                    </p>
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

      <Dialog open={isAddReportModalOpen} onOpenChange={setIsAddReportModalOpen}>
        <DialogContent className="bg-bg-surface border-border-color">
          <DialogHeader>
            <DialogTitle className="text-text-primary">
              Add Report
            </DialogTitle>
            <DialogDescription className="text-text-muted">
              Select the type of report you want to submit
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={() => {
                setSelectedReportType('eod');
                setIsAddReportModalOpen(false);
                setIsEodFormOpen(true);
              }}
              className="p-4 text-left border border-border-color rounded-lg hover:bg-bg-elevated transition-colors"
            >
              <p className="text-sm font-semibold text-text-primary">EOD (End of Day) Report</p>
              <p className="text-xs text-text-muted mt-1">Submit your daily end-of-day report</p>
            </button>
            <button
              onClick={() => {
                setSelectedReportType('weekly');
                setIsAddReportModalOpen(false);
                setIsWeeklyFormOpen(true);
              }}
              className="p-4 text-left border border-border-color rounded-lg hover:bg-bg-elevated transition-colors"
            >
              <p className="text-sm font-semibold text-text-primary">Weekly Report</p>
              <p className="text-xs text-text-muted mt-1">Submit your weekly performance report</p>
            </button>
            <button
              onClick={() => {
                setSelectedReportType('monthly');
                setIsAddReportModalOpen(false);
                setIsMonthlyFormOpen(true);
              }}
              className="p-4 text-left border border-border-color rounded-lg hover:bg-bg-elevated transition-colors"
            >
              <p className="text-sm font-semibold text-text-primary">Monthly Report</p>
              <p className="text-xs text-text-muted mt-1">Submit your monthly performance report</p>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEodFormOpen} onOpenChange={setIsEodFormOpen}>
        <DialogContent className="bg-bg-surface border-border-color max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-text-primary">
              Submit EOD Report
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-text-primary block mb-2">
                Task Completed
              </label>
              <textarea
                value={eodFormData.taskCompleted}
                onChange={(e) => setEodFormData({ ...eodFormData, taskCompleted: e.target.value })}
                className="w-full px-3 py-2 bg-bg-elevated border border-border-color rounded-md text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-primary"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-text-primary block mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={eodFormData.date}
                  onChange={(e) => setEodFormData({ ...eodFormData, date: e.target.value })}
                  className="w-full px-3 py-2 bg-bg-elevated border border-border-color rounded-md text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-primary"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-text-primary block mb-2">
                  Time Spent
                </label>
                <input
                  type="text"
                  value={eodFormData.timeSpent}
                  onChange={(e) => setEodFormData({ ...eodFormData, timeSpent: e.target.value })}
                  placeholder="e.g., 8h 30m"
                  className="w-full px-3 py-2 bg-bg-elevated border border-border-color rounded-md text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-primary"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-text-primary block mb-2">
                Key Success
              </label>
              <textarea
                value={eodFormData.keySuccess}
                onChange={(e) => setEodFormData({ ...eodFormData, keySuccess: e.target.value })}
                className="w-full px-3 py-2 bg-bg-elevated border border-border-color rounded-md text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-primary"
                rows={2}
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-text-primary block mb-2">
                Main Challenges
              </label>
              <textarea
                value={eodFormData.mainChallenges}
                onChange={(e) => setEodFormData({ ...eodFormData, mainChallenges: e.target.value })}
                className="w-full px-3 py-2 bg-bg-elevated border border-border-color rounded-md text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-primary"
                rows={2}
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-text-primary block mb-2">
                Plans for tomorrow
              </label>
              <textarea
                value={eodFormData.plansForTomorrow}
                onChange={(e) => setEodFormData({ ...eodFormData, plansForTomorrow: e.target.value })}
                className="w-full px-3 py-2 bg-bg-elevated border border-border-color rounded-md text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-primary"
                rows={2}
              />
            </div>

            <div>
              <p className="text-sm font-semibold text-text-primary mb-3">Rating (1-10)</p>
              <div className="space-y-3">
                {(['diet', 'exercise', 'relationship', 'overall'] as const).map((category) => (
                  <div key={category}>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm text-text-muted capitalize">
                        {category}
                      </label>
                      <span className="text-sm font-mono text-accent-primary">
                        {eodFormData[category]}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                        <button
                          key={num}
                          onClick={() => setEodFormData({ ...eodFormData, [category]: num })}
                          className={`w-8 h-8 rounded-full text-xs font-semibold transition-colors ${
                            eodFormData[category] >= num
                              ? 'bg-accent-primary text-bg-base'
                              : 'bg-border-color text-text-muted hover:bg-bg-elevated'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 mt-6 pt-4 border-t border-border-color">
            <button
              onClick={() => setIsEodFormOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-text-primary border border-border-color rounded-md hover:bg-bg-elevated transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setIsEodFormOpen(false);
                setEodFormData({
                  taskCompleted: '',
                  date: '',
                  timeSpent: '',
                  keySuccess: '',
                  mainChallenges: '',
                  plansForTomorrow: '',
                  diet: 5,
                  exercise: 5,
                  relationship: 5,
                  overall: 5,
                });
              }}
              className="px-4 py-2 text-sm font-semibold text-white bg-accent-secondary rounded-md hover:bg-blue-700 transition-colors"
            >
              Submit Report
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isWeeklyFormOpen} onOpenChange={setIsWeeklyFormOpen}>
        <DialogContent className="bg-bg-surface border-border-color max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-text-primary">
              Submit Weekly Report
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-text-primary block mb-2">
                  Student Name
                </label>
                <input
                  type="text"
                  value={weeklyFormData.studentName}
                  onChange={(e) => setWeeklyFormData({ ...weeklyFormData, studentName: e.target.value })}
                  className="w-full px-3 py-2 bg-bg-elevated border border-border-color rounded-md text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-primary"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-text-primary block mb-2">
                  Year & Section
                </label>
                <input
                  type="text"
                  value={weeklyFormData.yearSection}
                  onChange={(e) => setWeeklyFormData({ ...weeklyFormData, yearSection: e.target.value })}
                  className="w-full px-3 py-2 bg-bg-elevated border border-border-color rounded-md text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-text-primary block mb-2">
                  Student ID No.
                </label>
                <input
                  type="text"
                  value={weeklyFormData.studentId}
                  onChange={(e) => setWeeklyFormData({ ...weeklyFormData, studentId: e.target.value })}
                  className="w-full px-3 py-2 bg-bg-elevated border border-border-color rounded-md text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-primary"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-text-primary block mb-2">
                  Company / Establishment
                </label>
                <input
                  type="text"
                  value={weeklyFormData.company}
                  onChange={(e) => setWeeklyFormData({ ...weeklyFormData, company: e.target.value })}
                  className="w-full px-3 py-2 bg-bg-elevated border border-border-color rounded-md text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-text-primary block mb-2">
                  Department Assigned
                </label>
                <input
                  type="text"
                  value={weeklyFormData.department}
                  onChange={(e) => setWeeklyFormData({ ...weeklyFormData, department: e.target.value })}
                  className="w-full px-3 py-2 bg-bg-elevated border border-border-color rounded-md text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-primary"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-text-primary block mb-2">
                  Company Address
                </label>
                <input
                  type="text"
                  value={weeklyFormData.companyAddress}
                  onChange={(e) => setWeeklyFormData({ ...weeklyFormData, companyAddress: e.target.value })}
                  className="w-full px-3 py-2 bg-bg-elevated border border-border-color rounded-md text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-primary"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-text-primary block mb-2">
                Immediate Supervisor
              </label>
              <input
                type="text"
                value={weeklyFormData.supervisor}
                onChange={(e) => setWeeklyFormData({ ...weeklyFormData, supervisor: e.target.value })}
                className="w-full px-3 py-2 bg-bg-elevated border border-border-color rounded-md text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-primary"
              />
            </div>

            <div>
              <p className="text-sm font-semibold text-text-primary mb-3">Reporting Period</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-text-muted block mb-2">Period Starts</label>
                  <input
                    type="date"
                    value={weeklyFormData.periodStarts}
                    onChange={(e) => setWeeklyFormData({ ...weeklyFormData, periodStarts: e.target.value })}
                    className="w-full px-3 py-2 bg-bg-elevated border border-border-color rounded-md text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-primary"
                  />
                </div>
                <div>
                  <label className="text-xs text-text-muted block mb-2">Period Ends</label>
                  <input
                    type="date"
                    value={weeklyFormData.periodEnds}
                    onChange={(e) => setWeeklyFormData({ ...weeklyFormData, periodEnds: e.target.value })}
                    className="w-full px-3 py-2 bg-bg-elevated border border-border-color rounded-md text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-primary"
                  />
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-text-primary mb-3">Weekly Attendance</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-color">
                      <th className="text-left text-text-muted font-semibold py-2 px-2">Day</th>
                      <th className="text-left text-text-muted font-semibold py-2 px-2">Time In</th>
                      <th className="text-left text-text-muted font-semibold py-2 px-2">Time Out</th>
                      <th className="text-left text-text-muted font-semibold py-2 px-2">Total Hours</th>
                      <th className="text-left text-text-muted font-semibold py-2 px-2">Supervisor Initial</th>
                    </tr>
                  </thead>
                  <tbody>
                    {weeklyFormData.weeklyLog.map((log, idx) => (
                      <tr key={log.day} className="border-b border-border-color">
                        <td className="py-2 px-2 text-text-primary">{log.day}</td>
                        <td className="py-2 px-2">
                          <input
                            type="time"
                            value={log.timeIn}
                            onChange={(e) => {
                              const newLog = [...weeklyFormData.weeklyLog];
                              newLog[idx].timeIn = e.target.value;
                              setWeeklyFormData({ ...weeklyFormData, weeklyLog: newLog });
                            }}
                            className="w-full px-2 py-1 bg-bg-elevated border border-border-color rounded text-text-primary text-xs focus:outline-none focus:border-accent-primary"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="time"
                            value={log.timeOut}
                            onChange={(e) => {
                              const newLog = [...weeklyFormData.weeklyLog];
                              newLog[idx].timeOut = e.target.value;
                              setWeeklyFormData({ ...weeklyFormData, weeklyLog: newLog });
                            }}
                            className="w-full px-2 py-1 bg-bg-elevated border border-border-color rounded text-text-primary text-xs focus:outline-none focus:border-accent-primary"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={log.totalHours}
                            onChange={(e) => {
                              const newLog = [...weeklyFormData.weeklyLog];
                              newLog[idx].totalHours = e.target.value;
                              setWeeklyFormData({ ...weeklyFormData, weeklyLog: newLog });
                            }}
                            placeholder="e.g., 8h"
                            className="w-full px-2 py-1 bg-bg-elevated border border-border-color rounded text-text-primary text-xs focus:outline-none focus:border-accent-primary"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={log.supervisorInitial}
                            onChange={(e) => {
                              const newLog = [...weeklyFormData.weeklyLog];
                              newLog[idx].supervisorInitial = e.target.value;
                              setWeeklyFormData({ ...weeklyFormData, weeklyLog: newLog });
                            }}
                            maxLength={3}
                            className="w-full px-2 py-1 bg-bg-elevated border border-border-color rounded text-text-primary text-xs focus:outline-none focus:border-accent-primary"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 mt-6 pt-4 border-t border-border-color">
            <button
              onClick={() => setIsWeeklyFormOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-text-primary border border-border-color rounded-md hover:bg-bg-elevated transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setIsWeeklyFormOpen(false);
              }}
              className="px-4 py-2 text-sm font-semibold text-white bg-accent-secondary rounded-md hover:bg-blue-700 transition-colors"
            >
              Submit Report
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isMonthlyFormOpen} onOpenChange={setIsMonthlyFormOpen}>
        <DialogContent className="bg-bg-surface border-border-color max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-text-primary">
              Submit Monthly Report
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-text-primary block mb-2">
                  Trainee Name
                </label>
                <input
                  type="text"
                  value={monthlyFormData.traineeName}
                  onChange={(e) => setMonthlyFormData({ ...monthlyFormData, traineeName: e.target.value })}
                  className="w-full px-3 py-2 bg-bg-elevated border border-border-color rounded-md text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-primary"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-text-primary block mb-2">
                  OJT ID No:
                </label>
                <input
                  type="text"
                  value={monthlyFormData.ojtId}
                  onChange={(e) => setMonthlyFormData({ ...monthlyFormData, ojtId: e.target.value })}
                  className="w-full px-3 py-2 bg-bg-elevated border border-border-color rounded-md text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-text-primary block mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  value={monthlyFormData.companyName}
                  onChange={(e) => setMonthlyFormData({ ...monthlyFormData, companyName: e.target.value })}
                  className="w-full px-3 py-2 bg-bg-elevated border border-border-color rounded-md text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-primary"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-text-primary block mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  value={monthlyFormData.companyName2}
                  onChange={(e) => setMonthlyFormData({ ...monthlyFormData, companyName2: e.target.value })}
                  className="w-full px-3 py-2 bg-bg-elevated border border-border-color rounded-md text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-primary"
                />
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-text-primary mb-3">Reporting Period</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-text-muted block mb-2">Period Starts</label>
                  <input
                    type="date"
                    value={monthlyFormData.periodStarts}
                    onChange={(e) => setMonthlyFormData({ ...monthlyFormData, periodStarts: e.target.value })}
                    className="w-full px-3 py-2 bg-bg-elevated border border-border-color rounded-md text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-primary"
                  />
                </div>
                <div>
                  <label className="text-xs text-text-muted block mb-2">Period Ends</label>
                  <input
                    type="date"
                    value={monthlyFormData.periodEnds}
                    onChange={(e) => setMonthlyFormData({ ...monthlyFormData, periodEnds: e.target.value })}
                    className="w-full px-3 py-2 bg-bg-elevated border border-border-color rounded-md text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-primary"
                  />
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-text-primary mb-3">Monthly Work Log</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-color">
                      <th className="text-left text-text-muted font-semibold py-2 px-2">Week</th>
                      <th className="text-left text-text-muted font-semibold py-2 px-2">Actual Work Times (exc. 8:00AM-5:00PM)</th>
                      <th className="text-left text-text-muted font-semibold py-2 px-2">Total No. of Hours Rendered per Week</th>
                      <th className="text-left text-text-muted font-semibold py-2 px-2">List of Work Accomplished</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyFormData.monthlyLog.map((log, idx) => (
                      <tr key={log.week} className="border-b border-border-color">
                        <td className="py-2 px-2 text-text-primary">{log.week}</td>
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={log.workTimes}
                            onChange={(e) => {
                              const newLog = [...monthlyFormData.monthlyLog];
                              newLog[idx].workTimes = e.target.value;
                              setMonthlyFormData({ ...monthlyFormData, monthlyLog: newLog });
                            }}
                            placeholder="e.g., 8:30AM-5:30PM"
                            className="w-full px-2 py-1 bg-bg-elevated border border-border-color rounded text-text-primary text-xs focus:outline-none focus:border-accent-primary"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={log.totalHours}
                            onChange={(e) => {
                              const newLog = [...monthlyFormData.monthlyLog];
                              newLog[idx].totalHours = e.target.value;
                              setMonthlyFormData({ ...monthlyFormData, monthlyLog: newLog });
                            }}
                            placeholder="e.g., 9h"
                            className="w-full px-2 py-1 bg-bg-elevated border border-border-color rounded text-text-primary text-xs focus:outline-none focus:border-accent-primary"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={log.workAccomplished}
                            onChange={(e) => {
                              const newLog = [...monthlyFormData.monthlyLog];
                              newLog[idx].workAccomplished = e.target.value;
                              setMonthlyFormData({ ...monthlyFormData, monthlyLog: newLog });
                            }}
                            placeholder="List of accomplishments"
                            className="w-full px-2 py-1 bg-bg-elevated border border-border-color rounded text-text-primary text-xs focus:outline-none focus:border-accent-primary"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-text-primary block mb-2">
                Number of work-hours rendered this month
              </label>
              <input
                type="text"
                value={monthlyFormData.totalWorkHours}
                onChange={(e) => setMonthlyFormData({ ...monthlyFormData, totalWorkHours: e.target.value })}
                placeholder="e.g., 160h"
                className="w-full px-3 py-2 bg-bg-elevated border border-border-color rounded-md text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-primary"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 mt-6 pt-4 border-t border-border-color">
            <button
              onClick={() => setIsMonthlyFormOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-text-primary border border-border-color rounded-md hover:bg-bg-elevated transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setIsMonthlyFormOpen(false);
              }}
              className="px-4 py-2 text-sm font-semibold text-white bg-accent-secondary rounded-md hover:bg-blue-700 transition-colors"
            >
              Submit Report
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEodOpen} onOpenChange={setIsEodOpen}>
        <DialogContent className="bg-bg-surface border-border-color">
          <DialogHeader>
            <DialogTitle className="text-text-primary">
              Submit EOD Report
            </DialogTitle>
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
                  <p className="text-xs uppercase tracking-wide text-text-muted mb-1">
                    Date
                  </p>
                  <p className="text-text-primary">
                    {formatDate(selectedEod.date)}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-text-muted mb-1">
                    Time Spent
                  </p>
                  <p className="text-text-primary">
                    {formatDuration(selectedEod.timeSpentMinutes)}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-text-muted mb-1">
                  Key Success
                </p>
                <p className="text-text-primary">{selectedEod.keySuccess}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-text-muted mb-1">
                  Main Challenges
                </p>
                <p className="text-text-primary">{selectedEod.mainChallenges}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-text-muted mb-1">
                  Plans For Tomorrow
                </p>
                <p className="text-text-primary">{selectedEod.plansTomorrow}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-text-muted mb-2">
                  Ratings (1-10)
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center justify-between text-text-primary">
                    <span>Diet</span>
                    <span>{selectedEod.ratings.diet}</span>
                  </div>
                  <div className="flex items-center justify-between text-text-primary">
                    <span>Exercise</span>
                    <span>{selectedEod.ratings.exercise}</span>
                  </div>
                  <div className="flex items-center justify-between text-text-primary">
                    <span>Relationship</span>
                    <span>{selectedEod.ratings.relationship}</span>
                  </div>
                  <div className="flex items-center justify-between text-text-primary">
                    <span>Overall</span>
                    <span>{selectedEod.ratings.overall}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-text-muted">No EOD report found for this day.</p>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isAttendanceModalOpen} onOpenChange={setIsAttendanceModalOpen}>
        <DialogContent className="bg-bg-surface border-border-color">
          <DialogHeader>
            <DialogTitle className="text-text-primary">
              Attendance
            </DialogTitle>
            <DialogDescription className="text-text-muted">
              {intern.name} • {intern.role}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="text-center py-6">
              <p className="text-4xl font-mono font-bold text-text-primary mb-2">
                {currentTime}
              </p>
              <div className="px-4 py-2 rounded-md inline-block mb-4">
                {attendanceStatus === 'not-timed-in' && (
                  <p className="text-sm font-semibold text-text-muted bg-text-muted/10 px-3 py-1 rounded">
                    Not Timed In
                  </p>
                )}
                {attendanceStatus === 'timed-in' && (
                  <p className="text-sm font-semibold text-accent-primary bg-accent-primary/10 px-3 py-1 rounded">
                    Timed In
                  </p>
                )}
                {attendanceStatus === 'completed' && (
                  <p className="text-sm font-semibold text-accent-danger bg-accent-danger/10 px-3 py-1 rounded">
                    Completed
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">Time in</span>
                <span className="text-text-primary font-mono">
                  {timedInTime || '----'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Time out</span>
                <span className="text-text-primary font-mono">
                  {timedOutTime || '----'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Total hours</span>
                <span className="text-text-primary font-mono">
                  {timedInTime && timedOutTime ? '8h 13m' : '----'}
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-4">
              <button
                onClick={() => {
                  if (attendanceStatus === 'not-timed-in') {
                    setTimedInTime(currentTime);
                    setAttendanceStatus('timed-in');
                  }
                }}
                disabled={attendanceStatus !== 'not-timed-in'}
                className={`w-full py-2 px-4 text-sm font-semibold rounded-md transition-colors ${
                  attendanceStatus === 'not-timed-in'
                    ? 'text-white bg-accent-secondary hover:bg-blue-700'
                    : 'text-text-muted bg-text-muted/20 cursor-not-allowed'
                }`}
              >
                Time in
              </button>
              <button
                onClick={() => {
                  if (attendanceStatus === 'timed-in') {
                    setTimedOutTime(currentTime);
                    setAttendanceStatus('completed');
                  }
                }}
                disabled={attendanceStatus !== 'timed-in'}
                className={`w-full py-2 px-4 text-sm font-semibold rounded-md transition-colors ${
                  attendanceStatus === 'timed-in'
                    ? 'text-white bg-accent-danger hover:bg-red-600'
                    : 'text-text-muted bg-text-muted/20 cursor-not-allowed'
                }`}
              >
                Time out
              </button>
            </div>

            {attendanceStatus === 'timed-in' && (
              <p className="text-xs text-accent-primary text-center">
                You have successfully timed in.
              </p>
            )}
            {attendanceStatus === 'completed' && (
              <p className="text-xs text-text-muted text-center">
                You have successfully timed out.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

