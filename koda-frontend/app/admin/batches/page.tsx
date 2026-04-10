'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';

import { BatchCard } from './batch-card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { batches } from '@/lib/mock-data';

export default function AdminBatchesPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const filteredBatches = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return batches;
    }

    return batches.filter((batch) =>
      batch.name.toLowerCase().includes(normalizedSearch)
    );
  }, [searchTerm]);

  if (!isMounted) {
    return <div className="p-8 text-text-muted">Loading batches...</div>;
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-label text-accent-secondary mb-3">
            Admin / Batch Management
          </p>
          <h1 className="text-4xl font-mono font-bold text-text-primary mb-2">
            Batch Management
          </h1>
          <p className="max-w-2xl text-text-muted">
            Review active and completed batches, search by name, and start new cohorts from the admin workspace.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:justify-end">
          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <Input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search batches..."
              className="pl-10 bg-bg-elevated border-border-color text-text-primary placeholder:text-text-muted focus-visible:ring-accent-primary"
            />
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-accent-primary text-bg-base font-semibold hover:bg-accent-secondary shadow-lg shadow-accent-primary/10">
                Create New Batch
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-bg-surface border-border-color text-text-primary sm:max-w-lg card-glow">
              <DialogHeader>
                <DialogTitle className="font-mono text-2xl">
                  Create New Batch
                </DialogTitle>
                <DialogDescription className="text-text-muted">
                  Placeholder modal for the next step of the batch creation flow.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 text-sm text-text-muted">
                <p>Batch setup form will live here in the next task.</p>
                <p>For now, this modal confirms the toolbar trigger is wired correctly.</p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="mb-6 flex items-center justify-between gap-4">
        <p className="text-sm text-text-muted">
          Showing {filteredBatches.length} of {batches.length} batches
        </p>
        <p className="text-xs uppercase tracking-widest text-text-muted">
          1 column mobile · 2 tablet · 3 desktop
        </p>
      </div>

      {filteredBatches.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredBatches.map((batch) => (
            <BatchCard key={batch.id} batch={batch} />
          ))}
        </div>
      ) : (
        <Card className="bg-bg-surface border-border-color p-8 text-center card-glow">
          <h2 className="text-xl font-mono font-semibold text-text-primary mb-2">
            No batches found
          </h2>
          <p className="text-sm text-text-muted">
            Try a different search term or clear the filter to see all batches.
          </p>
        </Card>
      )}
    </div>
  );
}