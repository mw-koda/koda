'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowRight, CalendarRange, ChevronLeft, Clock3, Layers, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { batchesApi, type BatchDetail } from '@/lib/api/batches';
import { teamsApi, type TeamDetail } from '@/lib/api/teams';
import CreateTeamModal from '../create-team-modal/modal';

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
              The batch you requested could not be loaded.
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
  const [batch, setBatch] = useState<BatchDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teams, setTeams] = useState<TeamDetail[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [teamsError, setTeamsError] = useState<string | null>(null);
  
  // 1. Add State for the Modal
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const loadBatch = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await batchesApi.findOne(params.id);
        setBatch(data);
      } catch (requestError) {
        setBatch(null);
        setError(requestError instanceof Error ? requestError.message : 'Failed to load batch details.');
      } finally {
        setIsLoading(false);
      }
    };

    void loadBatch();
  }, [isMounted, params.id]);

  useEffect(() => {
    if (!isMounted) return;

    const loadTeams = async () => {
      setTeamsLoading(true);
      setTeamsError(null);
      try {
        const data = await teamsApi.findMine();
        setTeams(data);
      } catch (requestError) {
        setTeams([]);
        setTeamsError(requestError instanceof Error ? requestError.message : 'Failed to load teams.');
      } finally {
        setTeamsLoading(false);
      }
    };

    void loadTeams();
  }, [isMounted]);

  // 2. Add Success Handler
  const handleTeamCreated = (team: TeamDetail) => {
    setTeams((prev) => [team, ...prev]);
  };

  if (!isMounted || isLoading) {
    return <div className="p-8 text-text-muted">Loading batch details...</div>;
  }

  if (error || !batch) {
    return <BatchNotFound />;
  }

  const daysRemaining = getDaysRemaining(batch.endDate);
  const totalInterns = batch.assignedInterns.length;
  const attendanceHref = `/admin/live-attendance?batchId=${batch.id}`;

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

        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" className="text-text-primary hover:bg-bg-elevated hover:text-text-primary">
            <Link href="/admin/batches">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Batches
            </Link>
          </Button>
        </div>
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

        <Link href={attendanceHref} className="block h-full group">
          <Card className="card-glow border-border-color bg-bg-surface h-full transition-colors group-hover:border-accent-primary/40 group-hover:bg-bg-elevated/50">
            <CardHeader className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-sm font-medium uppercase tracking-[0.24em] text-text-muted">
                  Live Attendance
                </CardTitle>
                <Clock3 className="h-5 w-5 text-accent-primary" />
              </div>
              <div className="space-y-2">
                <span className="font-display text-4xl font-bold text-text-primary">
                  {totalInterns}
                </span>
                <p className="text-sm text-text-muted">interns ready for tracking</p>
              </div>
              <div className="flex items-center justify-between border-t border-border-color/60 pt-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-text-muted">
                    Attendance date
                  </p>
                  <p className="mt-1 text-sm text-text-primary">
                    {formatDate(new Date().toISOString())}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-accent-primary transition-transform group-hover:translate-x-0.5">
                  Open tracker
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </CardHeader>
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
            <Button
              onClick={() => setIsTeamModalOpen(true)}
              className="bg-accent-primary/90 hover:bg-accent-secondary text-bg-base gap-2 px-6 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Create team
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {teamsLoading ? (
            <div className="rounded-xl border border-border-color bg-bg-elevated p-6 text-text-muted">
              Loading teams...
            </div>
          ) : teamsError ? (
            <div className="rounded-xl border border-border-color bg-bg-elevated p-6 text-text-muted">
              {teamsError}
            </div>
          ) : teams.length === 0 ? (
            <div className="rounded-xl border border-border-color bg-bg-elevated p-6 text-text-muted">
              No teams created for this batch yet.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {teams.map((team) => {
                const assignedUserIds = new Set(
                  batch.assignedInterns
                    .map((intern) => intern.userId)
                    .filter((id): id is string => Boolean(id))
                );
                const teamInternCount = team.members.filter(
                  (member) =>
                    member.role === 'intern' &&
                    member.userId &&
                    assignedUserIds.has(member.userId)
                ).length;
                const progress = Math.min(
                  100,
                  Math.round((teamInternCount / Math.max(totalInterns, 1)) * 100)
                );

                return (
                  <Link key={team.id} href={`/admin/teams/${team.id}/dashboard`} className="group">
                    <div className="rounded-xl border border-border-color bg-bg-elevated p-5 transition-colors hover:border-accent-primary/40">
                      <p className="text-sm font-semibold text-text-primary">
                        {team.name}
                      </p>
                      <p className="mt-2 text-xs text-text-muted">
                        {teamInternCount} interns | Overall Project Progress
                      </p>
                      <div className="mt-4">
                        <Progress value={progress} className="h-2" />
                        <p className="mt-2 text-xs text-text-muted">
                          {progress}% complete
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

      {/* 4. Render the Modal */}
      <CreateTeamModal 
        isOpen={isTeamModalOpen}
        onClose={() => setIsTeamModalOpen(false)}
        onSuccess={handleTeamCreated}
      />
    </div>
  );
}