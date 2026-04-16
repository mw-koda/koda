'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, CalendarRange, ChevronLeft, Layers, Users, Plus } from 'lucide-react'; // Added Plus icon
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { batchesApi, type BatchDetail } from '@/lib/api/batches';
import CreateTeamModal from '../create-team-modal/modal'; // Adjust path based on your folder structure
import type { TeamDetail } from '@/lib/api/teams';

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
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [batch, setBatch] = useState<BatchDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
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

  // 2. Add Success Handler
  const handleTeamCreated = (team: TeamDetail) => {
    router.push(`/admin/teams/${team.id}/dashboard`);
  };

  if (!isMounted || isLoading) {
    return <div className="p-8 text-text-muted">Loading batch details...</div>;
  }

  if (error || !batch) {
    return <BatchNotFound />;
  }

  const daysRemaining = getDaysRemaining(batch.endDate);
  const totalInterns = batch.assignedInterns.length;

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
          {/* 3. Add Team Button */}
          <Button 
            onClick={() => setIsTeamModalOpen(true)}
            className="bg-accent-primary hover:bg-accent-secondary text-white gap-2 px-6"
          >
            <Plus className="h-4 w-4" />
            Add Team
          </Button>

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

        <Card className="card-glow border-border-color bg-bg-surface h-full transition-colors hover:border-accent-primary/40 hover:bg-bg-elevated/50">
          <CardHeader className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-sm font-medium uppercase tracking-[0.24em] text-text-muted">
                Assigned Interns
              </CardTitle>  
              <Users className="h-5 w-5 text-accent-primary" />
            </div>
            <div className="space-y-2">
              <span className="font-display text-4xl font-bold text-text-primary">
                {totalInterns}
              </span>
              <p className="text-sm text-text-muted">interns assigned to this batch</p>
            </div>
          </CardHeader>
        </Card>

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
                Assigned Interns
              </CardTitle>
              <CardDescription className="text-text-muted">
                View all interns assigned to this batch.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {totalInterns === 0 ? (
            <div className="rounded-xl border border-border-color bg-bg-elevated p-6 text-text-muted">
              No interns are assigned to this batch yet.
            </div>
          ) : (
            <div className="space-y-3">
              {batch.assignedInterns.map((intern) => (
                <div
                  key={intern.id}
                  className="rounded-lg border border-border-color bg-bg-elevated p-4 hover:border-accent-primary/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-text-primary">
                        {intern.name || 'Unnamed Intern'}
                      </p>
                      <p className="text-sm text-text-muted">
                        {intern.email || 'No email'}
                      </p>
                      {intern.githubUsername && (
                        <p className="text-sm text-text-muted">
                          @{intern.githubUsername}
                        </p>
                      )}
                    </div>
                    <div className="text-right text-sm text-text-muted">
                      {intern.assignedAt && (
                        <p>Assigned {formatDate(intern.assignedAt)}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
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