'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, CalendarRange, ChevronLeft, Layers, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { batchCatalog, getAttendanceLogsByDate, interns, type BatchCatalogEntry } from '@/lib/mock-data';
import { slugifyTeamName } from '@/lib/team-utils';

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).format(new Date(date));
}

function getDaysRemaining(endDate: string) {
  const differenceInMs = new Date(endDate).getTime() - Date.now();
  return Math.max(Math.ceil(differenceInMs / (1000 * 60 * 60 * 24)), 0);
}

function getTeamProgress(scores: number[]) {
  if (scores.length === 0) {
    return 0;
  }

  const total = scores.reduce((sum, score) => sum + score, 0);
  return Math.round(total / scores.length);
}

function BatchNotFound() {
  return (
    <div className="flex min-h-[calc(100vh-7rem)] items-center justify-center p-8">
      <Card className="card-glow w-full max-w-2xl border-border-color bg-bg-surface">
        <CardHeader className="items-center space-y-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-accent-primary/20 bg-accent-primary/10 text-accent-primary">
            <AlertCircle className="h-7 w-7" />
          </div>
          <div className="space-y-2">
            <CardTitle className="font-display text-3xl text-text-primary">
              Batch not found
            </CardTitle>
            <CardDescription className="mx-auto max-w-md text-text-muted">
              The batch you requested does not exist in the current mock dataset.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex justify-center pb-8">
          <Button asChild variant="ghost" className="text-text-primary hover:bg-bg-elevated hover:text-text-primary">
            <Link href="/admin/batches">Back to Batches</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function BatchDetailsPage({ params }: { params: { id: string } }) {
  const [isMounted, setIsMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const attendanceLogs = useMemo(
    () => getAttendanceLogsByDate(selectedDate),
    [selectedDate]
  );

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div className="p-8 text-text-muted">Loading batch details...</div>;
  }

  const batch = batchCatalog.find((entry) => entry.id === params.id);

  if (!batch) {
    return <BatchNotFound />;
  }

  const daysRemaining = getDaysRemaining(batch.endDate);
  const presentCount = new Set(attendanceLogs.map((log) => log.internId)).size;
  const totalInterns = interns.length;
  const absentCount = Math.max(totalInterns - presentCount, 0);
  const teamMap = interns.reduce((acc, intern) => {
    const entry = acc.get(intern.team) || { name: intern.team, internCount: 0, scores: [] as number[] };
    entry.internCount += 1;
    entry.scores.push(intern.score);
    acc.set(intern.team, entry);
    return acc;
  }, new Map<string, { name: string; internCount: number; scores: number[] }>());
  const teamSummaries = Array.from(teamMap.values()).map((team) => ({
    name: team.name,
    internCount: team.internCount,
    progress: getTeamProgress(team.scores),
  }));

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-accent-primary/80">
            Batch Command Center
          </p>
          <h1 className="mt-3 text-4xl font-display font-bold text-text-primary">
            {batch.name}
          </h1>
          <p className="mt-3 max-w-3xl text-text-muted">
            Monitor the operating window, enrollment capacity, and delivery velocity for this batch.
          </p>
        </div>

        <Button asChild variant="ghost" className="text-text-primary hover:bg-bg-elevated hover:text-text-primary">
          <Link href="/admin/batches">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Batches
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="card-glow border-border-color bg-bg-surface">
          <CardHeader className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-sm font-medium uppercase tracking-[0.24em] text-text-muted">
                Timeline
              </CardTitle>
              <CalendarRange className="h-5 w-5 text-accent-primary" />
            </div>
            <div className="space-y-2">
              <CardDescription className="text-lg text-text-primary">
                {formatDate(batch.startDate)} - {formatDate(batch.endDate)}
              </CardDescription>
              <p className="text-sm text-text-muted">
                {daysRemaining === 0 ? 'Batch completed' : `${daysRemaining} days remaining`}
              </p>
            </div>
          </CardHeader>
        </Card>

        <Link href={`/admin/live-attendance?batchId=${batch.id}`} className="block h-full">
          <Card className="card-glow border-border-color bg-bg-surface h-full transition-colors hover:border-accent-primary/40 hover:bg-bg-elevated/50">
          <CardHeader className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-sm font-medium uppercase tracking-[0.24em] text-text-muted">
                Live Attendance
              </CardTitle>  
              <Users className="h-5 w-5 text-accent-primary" />
            </div>
            <div className="flex items-end gap-3">
              <span className="font-display text-4xl font-bold text-text-primary">
              {presentCount}
              </span>
              <span className="pb-1 text-2xl text-text-muted">/</span>
              <span className="pb-1 text-2xl text-text-muted">{totalInterns}</span>
              <span className="ml-2 pb-1 text-sm text-text-muted">(Absent: {absentCount})</span>
            </div>
          </CardHeader>
          <CardContent>
            <label className="block text-xs font-semibold uppercase tracking-[0.24em] text-text-muted mb-2">
              Attendance date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="w-full bg-bg-elevated border border-border-color rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-primary"
            />
          </CardContent>
          </Card>
        </Link>

        <Card className="card-glow border-border-color bg-bg-surface">
          <CardHeader className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-sm font-medium uppercase tracking-[0.24em] text-text-muted">
                Enrolled Count
              </CardTitle>
              <Layers className="h-5 w-5 text-accent-primary" />
            </div>
            <CardDescription className="text-lg text-text-primary">
              {batch.enrolledCount} interns
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      <Card className="card-glow border-border-color bg-bg-surface">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <CardTitle className="text-xl font-display text-text-primary">
                Teams in this batch
              </CardTitle>
              <CardDescription className="text-text-muted">
                Current team distribution and progress overview for this cohort.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {teamSummaries.length === 0 ? (
            <div className="rounded-xl border border-border-color bg-bg-elevated p-6 text-text-muted">
              No teams are assigned to this batch yet.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {teamSummaries.map((team) => {
                const teamSlug = slugifyTeamName(team.name);

                return (
                  <Link
                    key={team.name}
                    href={`/admin/teams/${teamSlug}/dashboard`}
                    className="group"
                  >
                    <div className="rounded-xl border border-border-color bg-bg-elevated p-5 transition-colors group-hover:border-accent-primary/40 group-hover:bg-bg-surface">
                      <div className="space-y-2">
                        <p className="text-lg font-semibold text-text-primary">
                          {team.name}
                        </p>
                        <p className="text-sm text-text-muted">
                          {team.internCount} interns | Overall Project Progress
                        </p>
                      </div>
                      <div className="mt-4 space-y-2">
                        <Progress value={team.progress} className="h-2.5 rounded-full bg-bg-surface" />
                        <p className="text-xs text-text-muted">
                          {team.progress}% complete
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
