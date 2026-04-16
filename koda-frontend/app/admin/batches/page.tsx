'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CalendarRange, Layers, Users, Plus, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { batchesApi, BatchSummary } from '@/lib/api/batches';
import CreateBatchModal from './create-batch-modal/modal';

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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [batches, setBatches] = useState<BatchSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const fetchBatches = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await batchesApi.findAll();
        setBatches(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load batches');
        console.error('Error fetching batches:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBatches();
  }, [isMounted]);

  const handleCreateSuccess = () => {
    // Refetch batches after successful creation
    const fetchBatches = async () => {
      try {
        const data = await batchesApi.findAll();
        setBatches(data);
      } catch (err) {
        console.error('Error refetching batches:', err);
      }
    };
    fetchBatches();
  };

  if (!isMounted) {
    return <div className="p-8 text-text-muted">Loading batches...</div>;
  }

  return (
    <div className="p-8">
      {/* Header Section for Batch Management */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl font-bold text-text-primary">
            Batch Management
          </h1>
          <p className="mt-2 text-text-muted">
            Manage internship operating windows and enrollment state.
          </p>
        </div>
        
        <Button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-accent-primary hover:bg-accent-primary/90 text-white gap-2 px-6"
        >
          <Plus className="h-4 w-4" />
          Create New Batch
        </Button>
      </div>

      <Card className="card-glow border-border-color bg-bg-surface">
        <CardHeader className="space-y-4 border-b border-border-color/70 bg-bg-elevated/40">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="font-display text-3xl text-text-primary">
                Current Batches
              </CardTitle>
              <CardDescription className="mt-2 text-text-muted max-w-2xl">
                Select a batch to inspect its operating window, capacity, and enrollment state.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="flex justify-center items-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border border-accent-primary/20 border-t-accent-primary" />
            </div>
          ) : error ? (
            <div className="flex gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-500">Error loading batches</p>
                <p className="text-sm text-red-500/80">{error}</p>
              </div>
            </div>
          ) : batches.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border-color bg-bg-elevated/20 p-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-primary/10 mb-4 text-accent-primary">
                <Layers className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-text-primary">No Batches Registered</h3>
              <p className="mt-2 text-text-muted max-w-sm mb-6">
                Start by creating your first batch to manage interns, teams, and project velocity.
              </p>
              <Button 
                onClick={() => setIsCreateModalOpen(true)}
                variant="outline"
                className="border-accent-primary/30 text-accent-primary hover:bg-accent-primary/10"
              >
                Create your first batch
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {batches.map((batch) => (
                <Link key={batch.id} href={`/admin/batches/${batch.id}`} className="group">
                  <div className="h-full rounded-xl border border-border-color bg-bg-elevated p-5 transition-colors group-hover:border-accent-primary/50 group-hover:bg-bg-surface">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-lg font-semibold text-text-primary">
                          {batch.name}
                        </p>
                        <p className="mt-2 text-sm text-text-muted line-clamp-2">
                          {batch.description || 'No description'}
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

      {/* The Batch Creation Modal */}
      <CreateBatchModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}