'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, CalendarRange, ChevronLeft, Layers, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { batchCatalog, type BatchCatalogEntry } from '@/lib/mock-data';

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

function getEnrollmentProgress(batch: BatchCatalogEntry) {
  return Math.min(Math.round((batch.enrolledCount / batch.maxInterns) * 100), 100);
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

  const progress = getEnrollmentProgress(batch);
  const daysRemaining = getDaysRemaining(batch.endDate);

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

        <Card className="card-glow border-border-color bg-bg-surface">
          <CardHeader className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-sm font-medium uppercase tracking-[0.24em] text-text-muted">
                Capacity
              </CardTitle>
              <Users className="h-5 w-5 text-accent-primary" />
            </div>
            <div className="flex items-end gap-2">
              <span className="font-display text-4xl font-bold text-text-primary">
                {batch.enrolledCount}
              </span>
              <span className="pb-1 text-2xl text-text-muted">/</span>
              <span className="pb-1 text-2xl text-text-muted">{batch.maxInterns}</span>
            </div>
            <CardDescription className="text-sm text-text-muted">
              Enrolled / Total
            </CardDescription>
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
        <CardHeader className="space-y-3">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-xl font-display text-text-primary">
                Enrollment Progress
              </CardTitle>
              <CardDescription className="mt-1 text-text-muted">
                {batch.enrolledCount} of {batch.maxInterns} slots are occupied.
              </CardDescription>
            </div>
            <div className="text-sm text-text-muted">
              {progress}% utilized
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress
            value={progress}
            className="h-3 rounded-full bg-bg-elevated"
          />
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-text-muted">
            <span>Timeline: {formatDate(batch.startDate)} - {formatDate(batch.endDate)}</span>
            <span>Headcount: {batch.enrolledCount}/{batch.maxInterns}</span>
          </div>
          {batch.description ? (
            <p className="max-w-4xl text-sm leading-6 text-text-muted">
              {batch.description}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
