'use client';

import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Calendar,
  FileText,
  TrendingUp,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { reportsApi } from '@/lib/api/reports';
import { cn } from '@/lib/utils';

const getCurrentMonthValue = () => new Date().toISOString().slice(0, 7);

const getCurrentWeekValue = () => {
  const today = new Date();
  const current = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  const dayNumber = current.getUTCDay() || 7;

  current.setUTCDate(current.getUTCDate() - (dayNumber - 1));

  return current.toISOString().split('T')[0];
};

const getWeekPeriod = (weekStartValue: string) => {
  const weekStart = new Date(`${weekStartValue}T00:00:00.000Z`);

  if (Number.isNaN(weekStart.getTime())) {
    return null;
  }

  // Normalize to Monday to keep weekly submissions bounded to Monday-Friday.
  const dayNumber = weekStart.getUTCDay() || 7;
  weekStart.setUTCDate(weekStart.getUTCDate() - (dayNumber - 1));

  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekStart.getUTCDate() + 4);

  return {
    periodStart: weekStart.toISOString().split('T')[0],
    periodEnd: weekEnd.toISOString().split('T')[0],
  };
};

const formatWeekLabel = (weekStartValue: string) => {
  const weekPeriod = getWeekPeriod(weekStartValue);

  if (!weekPeriod) {
    return 'Weekly Report';
  }

  const start = new Date(`${weekPeriod.periodStart}T00:00:00.000Z`);
  const end = new Date(`${weekPeriod.periodEnd}T00:00:00.000Z`);
  const dateFormat = { month: 'short', day: 'numeric', year: 'numeric' } as const;

  return `${start.toLocaleDateString('default', dateFormat)} - ${end.toLocaleDateString('default', dateFormat)}`;
};

const formatMonthLabel = (monthValue: string) => {
  const [year, month] = monthValue.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  });
};

const getMonthPeriod = (monthValue: string) => {
  const [year, month] = monthValue.split('-').map(Number);
  const periodStart = new Date(year, month - 1, 1).toISOString().split('T')[0];
  const periodEnd = new Date(year, month, 0).toISOString().split('T')[0];

  return { periodStart, periodEnd };
};

// --- SCHEMAS ---

const eodSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  taskCompleted: z.string().min(1, 'Task completed is required'),
  date: z.string().min(1, 'Date is required'),
  timeSpent: z.string().min(1, 'Time spent is required'),
  keySuccess: z.string().min(1, 'Key success is required'),
  mainChallenges: z.string().min(1, 'Main challenges is required'),
  plansForTomorrow: z.string().min(1, 'Plans for tomorrow is required'),
  diet: z.number().min(1).max(10),
  exercise: z.number().min(1).max(10),
  relationship: z.number().min(1).max(10),
  overall: z.number().min(1).max(10),
});

const weeklySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  studentName: z.string().min(1, 'Student name is required'),
  yearSection: z.string().min(1, 'Year & section is required'),
  studentId: z.string().min(1, 'Student ID is required'),
  company: z.string().min(1, 'Company is required'),
  department: z.string().min(1, 'Department is required'),
  companyAddress: z.string().optional(),
  supervisor: z.string().min(1, 'Supervisor is required'),
  reportWeek: z.string().min(1, 'Week is required'),
  weeklyLog: z.array(z.object({
    day: z.string(),
    timeIn: z.string(),
    timeOut: z.string(),
    totalHours: z.string(),
    supervisorInitial: z.string(),
  })),
});

const monthlySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  traineeName: z.string().min(1, 'Trainee name is required'),
  ojtId: z.string().min(1, 'OJT ID is required'),
  companyName: z.string().min(1, 'Company name is required'),
  reportMonth: z.string().min(1, 'Month is required'),
  monthlyLog: z.array(z.object({
    week: z.string(),
    workTimes: z.string(),
    totalHours: z.string(),
    workAccomplished: z.string(),
  })),
  totalWorkHours: z.string().min(1, 'Total work hours is required'),
});

type ReportType = 'eod' | 'weekly' | 'monthly';

interface ReportFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  internId: string;
  onSuccess?: () => void;
  initialType?: ReportType;
  lockTypeSelection?: boolean;
  showDoLater?: boolean;
}

export function ReportFormModal({
  isOpen,
  onOpenChange,
  internId,
  onSuccess,
  initialType,
  lockTypeSelection = false,
  showDoLater = false,
}: ReportFormModalProps) {
  const [step, setStep] = useState<'type' | 'form' | 'success'>('type');
  const [selectedType, setSelectedType] = useState<ReportType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missingAccomplishmentWeeks, setMissingAccomplishmentWeeks] = useState<string[]>([]);
  const [isAccomplishmentWarningOpen, setIsAccomplishmentWarningOpen] = useState(false);

  // EOD Form
  const eodForm = useForm<z.infer<typeof eodSchema>>({
    resolver: zodResolver(eodSchema),
    defaultValues: {
      title: '',
      taskCompleted: '',
      timeSpent: '',
      keySuccess: '',
      mainChallenges: '',
      plansForTomorrow: '',
      diet: 5, exercise: 5, relationship: 5, overall: 5,
      date: new Date().toISOString().split('T')[0],
    }
  });

  const eodRatings = eodForm.watch(['diet', 'exercise', 'relationship', 'overall']);

  // Weekly Form
  const weeklyForm = useForm<z.infer<typeof weeklySchema>>({
    resolver: zodResolver(weeklySchema),
    defaultValues: {
      title: '',
      studentName: '',
      yearSection: '',
      studentId: '',
      company: '',
      department: '',
      companyAddress: '',
      supervisor: '',
      weeklyLog: [
        { day: 'Monday', timeIn: '', timeOut: '', totalHours: '', supervisorInitial: '' },
        { day: 'Tuesday', timeIn: '', timeOut: '', totalHours: '', supervisorInitial: '' },
        { day: 'Wednesday', timeIn: '', timeOut: '', totalHours: '', supervisorInitial: '' },
        { day: 'Thursday', timeIn: '', timeOut: '', totalHours: '', supervisorInitial: '' },
        { day: 'Friday', timeIn: '', timeOut: '', totalHours: '', supervisorInitial: '' },
      ],
      reportWeek: getCurrentWeekValue(),
    }
  });

  const weeklyLogArray = useFieldArray({
    control: weeklyForm.control,
    name: 'weeklyLog'
  });

  // Monthly Form
  const monthlyForm = useForm<z.infer<typeof monthlySchema>>({
    resolver: zodResolver(monthlySchema),
    defaultValues: {
      title: '',
      traineeName: '',
      ojtId: '',
      companyName: 'Metawatt LLC',
      totalWorkHours: '',
      monthlyLog: [
        { week: 'Week 1', workTimes: '', totalHours: '', workAccomplished: '' },
        { week: 'Week 2', workTimes: '', totalHours: '', workAccomplished: '' },
        { week: 'Week 3', workTimes: '', totalHours: '', workAccomplished: '' },
        { week: 'Week 4', workTimes: '', totalHours: '', workAccomplished: '' },
        { week: 'Week 5', workTimes: '', totalHours: '', workAccomplished: '' },
      ],
      reportMonth: getCurrentMonthValue(),
    }
  });

  const monthlyLogArray = useFieldArray({
    control: monthlyForm.control,
    name: 'monthlyLog'
  });

  const selectedWeeklyPeriod = getWeekPeriod(weeklyForm.watch('reportWeek'));

  const initializeType = (type: ReportType) => {
    setError(null);
    setSelectedType(type);
    setStep('form');
    
    // Defer setValue to avoid interrupting the render cycle
    setTimeout(() => {
      const date = new Date().toLocaleDateString();
      if (type === 'eod') {
        eodForm.setValue('title', `EOD Report - ${date}`);
        eodForm.setValue('date', new Date().toISOString().split('T')[0]);
      }
      if (type === 'weekly') {
        const currentWeek = getCurrentWeekValue();
        weeklyForm.setValue('reportWeek', currentWeek);
        weeklyForm.setValue('title', `Weekly Report - ${formatWeekLabel(currentWeek)}`);
      }
      if (type === 'monthly') {
        const currentMonth = getCurrentMonthValue();
        monthlyForm.setValue('reportMonth', currentMonth);
        monthlyForm.setValue('title', `Monthly Report - ${formatMonthLabel(currentMonth)}`);
      }
    }, 0);
  };

  const handleTypeSelect = (type: ReportType) => {
    initializeType(type);
  };

  useEffect(() => {
    if (!isOpen || !initialType) {
      return;
    }

    initializeType(initialType);
  }, [initialType, isOpen]);


  const submitEod = async (values: z.infer<typeof eodSchema>) => {
    setError(null);
    setIsSubmitting(true);
    try {
      const content = `
### Task Completed
${values.taskCompleted}

### Key Success
${values.keySuccess}

### Main Challenges
${values.mainChallenges}

### Plans for Tomorrow
${values.plansForTomorrow}

### Ratings
- Diet: ${values.diet}/10
- Exercise: ${values.exercise}/10
- Relationship: ${values.relationship}/10
- Overall: ${values.overall}/10
      `.trim();

      await reportsApi.submit({
        intern_id: internId,
        title: values.title,
        content,
        period_start: values.date,
        period_end: values.date,
      });
      setStep('success');
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Failed to submit');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitWeekly = async (values: z.infer<typeof weeklySchema>) => {
    setError(null);
    setIsSubmitting(true);
    try {
      const weekPeriod = getWeekPeriod(values.reportWeek);
      if (!weekPeriod) {
        throw new Error('Please select a valid week start date.');
      }

      const { periodStart, periodEnd } = weekPeriod;
      const reportTitle = `Weekly Report - ${formatWeekLabel(values.reportWeek)}`;
      const logTable = values.weeklyLog.map(l => 
        `| ${l.day} | ${l.timeIn} | ${l.timeOut} | ${l.totalHours} | ${l.supervisorInitial} |`
      ).join('\n');

      const content = `
**Student:** ${values.studentName} (${values.studentId})
**Section:** ${values.yearSection}
**Company:** ${values.company} - ${values.department}
**Supervisor:** ${values.supervisor}

### Weekly Log
| Day | In | Out | Hours | Initial |
|-----|----|-----|-------|---------|
${logTable}
      `.trim();

      await reportsApi.submit({
        intern_id: internId,
        title: reportTitle,
        content,
        period_start: periodStart,
        period_end: periodEnd,
      });
      setStep('success');
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Failed to submit');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitMonthly = async (values: z.infer<typeof monthlySchema>) => {
    setError(null);
    const missingWeeks = values.monthlyLog
      .filter((log) => {
        const hasWorkTime = log.workTimes.trim().length > 0;
        const hasHours = log.totalHours.trim().length > 0;
        const hasAccomplishment = log.workAccomplished.trim().length > 0;
        return (hasWorkTime || hasHours) && !hasAccomplishment;
      })
      .map((log) => log.week);

    if (missingWeeks.length > 0) {
      setMissingAccomplishmentWeeks(missingWeeks);
      setIsAccomplishmentWarningOpen(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const { periodStart, periodEnd } = getMonthPeriod(values.reportMonth);
      const reportTitle = `Monthly Report - ${formatMonthLabel(values.reportMonth)}`;
      const logTable = values.monthlyLog.map(l => 
        `| ${l.week} | ${l.workTimes} | ${l.totalHours} | ${l.workAccomplished} |`
      ).join('\n');

      const content = `
**Trainee:** ${values.traineeName} (ID: ${values.ojtId})
**Company:** ${values.companyName}
**Total Hours:** ${values.totalWorkHours}

### Monthly Summary
| Week | Work Times | Hours | Accomplishments |
|------|------------|-------|-----------------|
${logTable}
      `.trim();

      await reportsApi.submit({
        intern_id: internId,
        title: reportTitle,
        content,
        period_start: periodStart,
        period_end: periodEnd,
      });
      setStep('success');
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Failed to submit');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setStep('type');
      setSelectedType(null);
      setError(null);
      eodForm.reset();
      weeklyForm.reset();
      monthlyForm.reset();
    }, 300);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className={cn(
        "bg-bg-surface border-border-color overflow-y-auto max-h-[90vh]",
        selectedType === 'eod' ? "sm:max-w-xl" : "sm:max-w-4xl"
      )}>
        <DialogHeader>
          <DialogTitle className="text-text-primary text-xl font-mono">
            {step === 'type' ? 'Initialize Report' : `Submit ${selectedType?.toUpperCase()} Report`}
          </DialogTitle>
          <DialogDescription className="text-text-muted">
            {step === 'type' ? 'Select the reporting structure for your submission.' : 'Fill in the required details below.'}
          </DialogDescription>
        </DialogHeader>

        {step === 'type' && !lockTypeSelection && (
          <div className="grid grid-cols-1 gap-3 pt-4">
            <button type="button" onClick={() => handleTypeSelect('eod')} className="p-4 text-left border border-border-color rounded-lg bg-bg-elevated hover:border-accent-primary transition-all group">
              <div className="flex items-center justify-between"><p className="text-sm font-bold text-text-primary group-hover:text-accent-primary transition-colors">EOD Report</p><Calendar className="h-4 w-4 text-text-muted" /></div>
              <p className="text-[10px] text-text-muted mt-1 uppercase tracking-wider">End of Day Submission</p>
            </button>
            <button type="button" onClick={() => handleTypeSelect('weekly')} className="p-4 text-left border border-border-color rounded-lg bg-bg-elevated hover:border-accent-primary transition-all group">
              <div className="flex items-center justify-between"><p className="text-sm font-bold text-text-primary group-hover:text-accent-primary transition-colors">Weekly Report</p><FileText className="h-4 w-4 text-text-muted" /></div>
              <p className="text-[10px] text-text-muted mt-1 uppercase tracking-wider">Weekly Progress Summary</p>
            </button>
            <button type="button" onClick={() => handleTypeSelect('monthly')} className="p-4 text-left border border-border-color rounded-lg bg-bg-elevated hover:border-accent-primary transition-all group">
              <div className="flex items-center justify-between"><p className="text-sm font-bold text-text-primary group-hover:text-accent-primary transition-colors">Monthly Report</p><TrendingUp className="h-4 w-4 text-text-muted" /></div>
              <p className="text-[10px] text-text-muted mt-1 uppercase tracking-wider">Monthly Performance Review</p>
            </button>
          </div>
        )}

        {step === 'form' && selectedType === 'eod' && (
          <form onSubmit={eodForm.handleSubmit(submitEod)} className="space-y-4 pt-4">
            <input type="hidden" {...eodForm.register('title')} />
            {(['diet', 'exercise', 'relationship', 'overall'] as const).map(cat => (
              <input key={cat} type="hidden" {...eodForm.register(cat, { valueAsNumber: true })} />
            ))}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><label className="text-[10px] uppercase font-mono text-text-muted">Date</label><Input type="date" {...eodForm.register('date')} /></div>
              <div className="space-y-1"><label className="text-[10px] uppercase font-mono text-text-muted">Time Spent</label><Input placeholder="e.g. 8h 30m" {...eodForm.register('timeSpent')} /></div>
            </div>
            <div className="space-y-1"><label className="text-[10px] uppercase font-mono text-text-muted">Task Completed</label><Textarea rows={3} className="bg-bg-elevated border-border-color" {...eodForm.register('taskCompleted')} /></div>
            <div className="space-y-1"><label className="text-[10px] uppercase font-mono text-text-muted">Key Success</label><Textarea rows={2} className="bg-bg-elevated border-border-color" {...eodForm.register('keySuccess')} /></div>
            <div className="space-y-1"><label className="text-[10px] uppercase font-mono text-text-muted">Main Challenges</label><Textarea rows={2} className="bg-bg-elevated border-border-color" {...eodForm.register('mainChallenges')} /></div>
            <div className="space-y-1"><label className="text-[10px] uppercase font-mono text-text-muted">Plans for Tomorrow</label><Textarea rows={2} className="bg-bg-elevated border-border-color" {...eodForm.register('plansForTomorrow')} /></div>
            
            <div className="space-y-4 pt-2">
              <p className="text-sm font-semibold text-text-primary font-mono uppercase tracking-widest">Ratings (1-10)</p>
              {(['diet', 'exercise', 'relationship', 'overall'] as const).map(cat => (
                <div key={cat} className="space-y-2">
                  <div className="flex justify-between text-[10px] uppercase text-text-muted"><span>{cat}</span><span className="text-accent-primary font-bold">{eodForm.watch(cat)}</span></div>
                  <div className="flex justify-between w-full">
                    {Array.from({length:10}, (_, i) => i+1).map(n => (
                      <button key={n} type="button" onClick={() => eodForm.setValue(cat, n)} className={cn("w-7 h-7 flex items-center justify-center rounded-full text-[10px] font-bold transition-all flex-shrink-0", eodForm.watch(cat) >= n ? "bg-accent-primary text-bg-base shadow-sm" : "bg-bg-elevated text-text-muted border border-border-color hover:border-accent-primary/50")}>{n}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {error && (
              <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2">
                <p className="flex items-start gap-2 text-xs text-red-300 font-mono">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-border-color">
              {lockTypeSelection ? (
                showDoLater ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 font-mono uppercase tracking-widest text-xs"
                    onClick={handleClose}
                  >
                    Do it later
                  </Button>
                ) : null
              ) : (
                <Button type="button" variant="outline" className="flex-1 font-mono uppercase tracking-widest text-xs" onClick={() => setStep('type')}>Back</Button>
              )}
              <Button type="submit" className="flex-1 bg-accent-primary text-bg-base hover:bg-accent-primary/90 font-mono uppercase tracking-widest text-xs" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : 'Submit EOD'}</Button>
            </div>
          </form>
        )}

        {step === 'form' && selectedType === 'weekly' && (
          <form onSubmit={weeklyForm.handleSubmit(submitWeekly)} className="space-y-6 pt-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono text-text-muted">Week Start (Monday)</label>
                <Input type="date" step={7} min="2024-01-01" {...weeklyForm.register('reportWeek')} />
                {selectedWeeklyPeriod && (
                  <p className="text-[10px] text-text-muted font-mono uppercase tracking-wider">
                    Period: {selectedWeeklyPeriod.periodStart} to {selectedWeeklyPeriod.periodEnd}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1"><label className="text-[10px] uppercase font-mono text-text-muted">Student Name</label><Input {...weeklyForm.register('studentName')} /></div>
              <div className="space-y-1"><label className="text-[10px] uppercase font-mono text-text-muted">Year & Section</label><Input {...weeklyForm.register('yearSection')} /></div>
              <div className="space-y-1"><label className="text-[10px] uppercase font-mono text-text-muted">Student ID</label><Input {...weeklyForm.register('studentId')} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><label className="text-[10px] uppercase font-mono text-text-muted">Company</label><Input {...weeklyForm.register('company')} /></div>
              <div className="space-y-1"><label className="text-[10px] uppercase font-mono text-text-muted">Department</label><Input {...weeklyForm.register('department')} /></div>
            </div>
            <div className="space-y-1"><label className="text-[10px] uppercase font-mono text-text-muted">Immediate Supervisor</label><Input {...weeklyForm.register('supervisor')} /></div>
            
            <div className="border border-border-color rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-bg-elevated border-b border-border-color text-text-muted">
                  <tr><th className="p-2">Day</th><th className="p-2">Time In</th><th className="p-2">Time Out</th><th className="p-2">Total Hrs</th><th className="p-2">Initial</th></tr>
                </thead>
                <tbody className="divide-y divide-border-color">
                  {weeklyLogArray.fields.map((item, idx) => (
                    <tr key={item.id}>
                      <td className="p-2 text-text-primary font-bold">{weeklyForm.getValues(`weeklyLog.${idx}.day`)}</td>
                      <td className="p-2"><input type="time" {...weeklyForm.register(`weeklyLog.${idx}.timeIn` as const)} className="bg-transparent outline-none w-full text-text-primary" /></td>
                      <td className="p-2"><input type="time" {...weeklyForm.register(`weeklyLog.${idx}.timeOut` as const)} className="bg-transparent outline-none w-full text-text-primary" /></td>
                      <td className="p-2"><input placeholder="0h" {...weeklyForm.register(`weeklyLog.${idx}.totalHours` as const)} className="bg-transparent outline-none w-full text-text-primary" /></td>
                      <td className="p-2"><input maxLength={3} {...weeklyForm.register(`weeklyLog.${idx}.supervisorInitial` as const)} className="bg-transparent outline-none w-full uppercase text-text-primary" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {error && (
              <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2">
                <p className="flex items-start gap-2 text-xs text-red-300 font-mono">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" className="flex-1 font-mono uppercase tracking-widest text-xs" onClick={() => setStep('type')}>Back</Button>
              <Button type="submit" className="flex-1 bg-accent-primary text-bg-base hover:bg-accent-primary/90 font-mono uppercase tracking-widest text-xs" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : 'Submit Weekly'}</Button>
            </div>
          </form>
        )}

        {step === 'form' && selectedType === 'monthly' && (
          <form onSubmit={monthlyForm.handleSubmit(submitMonthly)} className="space-y-6 pt-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1"><label className="text-[10px] uppercase font-mono text-text-muted">Month</label><Input type="month" {...monthlyForm.register('reportMonth')} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><label className="text-[10px] uppercase font-mono text-text-muted">Trainee Name</label><Input {...monthlyForm.register('traineeName')} /></div>
              <div className="space-y-1"><label className="text-[10px] uppercase font-mono text-text-muted">OJT ID</label><Input {...monthlyForm.register('ojtId')} /></div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-mono text-text-muted">Company Name</label>
              <Input {...monthlyForm.register('companyName')} readOnly />
            </div>
            
            <div className="border border-border-color rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-bg-elevated border-b border-border-color text-text-muted">
                  <tr><th className="p-2">Week</th><th className="p-2">Actual Work Times</th><th className="p-2">Weekly Hours</th><th className="p-2">Accomplishments</th></tr>
                </thead>
                <tbody className="divide-y divide-border-color">
                  {monthlyLogArray.fields.map((item, idx) => (
                    <tr key={item.id}>
                      <td className="p-2 text-text-primary font-bold whitespace-nowrap">{monthlyForm.getValues(`monthlyLog.${idx}.week`)}</td>
                      <td className="p-2"><input placeholder="8:30-5:30" {...monthlyForm.register(`monthlyLog.${idx}.workTimes` as const)} className="bg-transparent outline-none w-full text-text-primary" /></td>
                      <td className="p-2"><input placeholder="0h" {...monthlyForm.register(`monthlyLog.${idx}.totalHours` as const)} className="bg-transparent outline-none w-full text-text-primary" /></td>
                      <td className="p-2">
                        <textarea
                          rows={2}
                          placeholder="..."
                          {...monthlyForm.register(`monthlyLog.${idx}.workAccomplished` as const)}
                          className="bg-transparent outline-none w-full text-text-primary resize-none whitespace-pre-wrap"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-1"><label className="text-[10px] uppercase font-mono text-text-muted">Total Monthly Hours</label><Input placeholder="e.g. 160h" {...monthlyForm.register('totalWorkHours')} /></div>

            {error && (
              <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2">
                <p className="flex items-start gap-2 text-xs text-red-300 font-mono">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" className="flex-1 font-mono uppercase tracking-widest text-xs" onClick={() => setStep('type')}>Back</Button>
              <Button type="submit" className="flex-1 bg-accent-primary text-bg-base hover:bg-accent-primary/90 font-mono uppercase tracking-widest text-xs" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : 'Submit Monthly'}</Button>
            </div>
          </form>
        )}

        {step === 'success' && (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-6">
            <div className="h-20 w-20 rounded-full bg-emerald-500/10 flex items-center justify-center border-2 border-emerald-500/20"><CheckCircle2 className="h-10 w-10 text-emerald-500" /></div>
            <div><h3 className="text-xl font-mono font-bold text-text-primary">Submission Successful</h3><p className="text-sm text-text-muted mt-2">Your report has been logged in the system.</p></div>
            <Button className="w-full bg-bg-elevated border border-border-color hover:border-accent-primary transition-all font-mono uppercase tracking-widest text-xs" onClick={handleClose}>Close Terminal</Button>
          </div>
        )}
      </DialogContent>
      <Dialog open={isAccomplishmentWarningOpen} onOpenChange={setIsAccomplishmentWarningOpen}>
        <DialogContent className="bg-bg-surface border-border-color max-w-md">
          <DialogHeader>
            <DialogTitle className="text-text-primary text-lg font-mono">
              Missing Accomplishments
            </DialogTitle>
            <DialogDescription className="text-text-muted">
              Add accomplishments for the weeks below before submitting.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm text-text-primary">
            {missingAccomplishmentWeeks.map((week) => (
              <div key={week} className="rounded-md border border-border-color bg-bg-elevated px-3 py-2">
                {week}
              </div>
            ))}
          </div>
          <Button
            type="button"
            className="w-full bg-accent-primary text-bg-base hover:bg-accent-primary/90 font-mono uppercase tracking-widest text-xs"
            onClick={() => setIsAccomplishmentWarningOpen(false)}
          >
            Got it
          </Button>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
