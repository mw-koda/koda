'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Layers, CalendarRange, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { batchCatalog } from '@/lib/mock-data';

function formatDateRange(startDate: string, endDate: string) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return `${formatter.format(new Date(startDate))} - ${formatter.format(new Date(endDate))}`;
}

export default function AdminBatchesPage() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div className="p-8 text-text-muted">Loading batches...</div>;
  }

  return (
    <div className="p-8">
      <Card className="card-glow border-border-color bg-bg-surface">
        <CardHeader className="space-y-4 border-b border-border-color/70 bg-bg-elevated/40">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="font-display text-3xl text-text-primary">
                Batch Management
              </CardTitle>
              <CardDescription className="mt-2 text-text-muted max-w-2xl">
                Select a batch to inspect its operating window, capacity, and enrollment state.
              </CardDescription>
            </div>
            <div className="hidden rounded-full border border-accent-primary/20 bg-accent-primary/10 px-4 py-2 text-sm text-accent-primary md:flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Command Center
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {batchCatalog.length === 0 ? (
            <div className="rounded-xl border border-border-color bg-bg-elevated p-6 text-text-muted">
              No batches have been registered yet.
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {batchCatalog.map((batch) => (
                <Link key={batch.id} href={`/admin/batches/${batch.id}`} className="group">
                  <div className="h-full rounded-xl border border-border-color bg-bg-elevated p-5 transition-colors group-hover:border-accent-primary/50 group-hover:bg-bg-surface">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-lg font-semibold text-text-primary">
                          {batch.name}
                        </p>
                        <p className="mt-2 text-sm text-text-muted">
                          {batch.description}
                        </p>
                      </div>
                      <ArrowRight className="mt-1 h-5 w-5 text-accent-primary transition-transform group-hover:translate-x-0.5" />
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-lg border border-border-color/60 bg-bg-surface p-3">
                        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-text-muted">
                          <CalendarRange className="h-4 w-4 text-accent-primary" />
                          Timeline
                        </div>
                        <p className="mt-2 text-sm text-text-primary">{formatDateRange(batch.startDate, batch.endDate)}</p>
                      </div>
                      <div className="rounded-lg border border-border-color/60 bg-bg-surface p-3">
                        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-text-muted">
                          <Users className="h-4 w-4 text-accent-primary" />
                          Capacity
                        </div>
                        <p className="mt-2 text-sm text-text-primary">{batch.maxInterns} interns</p>
                      </div>
                      <div className="rounded-lg border border-border-color/60 bg-bg-surface p-3">
                        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-text-muted">
                          <Layers className="h-4 w-4 text-accent-primary" />
                          Enrolled
                        </div>
                        <p className="mt-2 text-sm text-text-primary">{batch.enrolledCount} interns</p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <Button asChild variant="ghost" className="text-text-primary hover:bg-bg-elevated hover:text-text-primary">
              <Link href="/admin/dashboard">Return to dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
