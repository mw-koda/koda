'use client';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import type { Batch } from '@/lib/mock-data';

function getBatchStatusClass(status: Batch['status']) {
  switch (status) {
    case 'active':
      return 'bg-accent-primary/10 text-accent-primary border-accent-primary/30';
    case 'completed':
      return 'bg-text-muted/10 text-text-muted border-text-muted/30';
    default:
      return 'bg-text-muted/10 text-text-muted border-text-muted/30';
  }
}

interface BatchCardProps {
  batch: Batch;
}

export function BatchCard({ batch }: BatchCardProps) {
  return (
    <Card className="h-full bg-bg-surface border-border-color p-6 card-glow">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-label text-text-muted mb-3">Batch</p>
          <h2 className="text-2xl font-mono font-bold text-text-primary">
            {batch.name}
          </h2>
        </div>

        <Badge variant="outline" className={`text-xs ${getBatchStatusClass(batch.status)}`}>
          {batch.status === 'active' ? 'Active' : 'Completed'}
        </Badge>
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 bg-bg-elevated rounded-lg border border-border-color">
          <p className="text-xs uppercase tracking-widest text-text-muted mb-2">
            Date Range
          </p>
          <p className="text-sm font-medium text-text-primary">{batch.dateRange}</p>
        </div>

        <div className="p-4 bg-bg-elevated rounded-lg border border-border-color">
          <p className="text-xs uppercase tracking-widest text-text-muted mb-2">
            Interns
          </p>
          <p className="text-3xl font-mono font-bold text-text-primary">
            {batch.internCount}
          </p>
        </div>
      </div>
    </Card>
  );
}