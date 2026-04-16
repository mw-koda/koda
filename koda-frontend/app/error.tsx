'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-bg-surface flex items-center justify-center p-8">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-2xl font-mono font-bold text-text-primary">
          Something went wrong
        </h1>
        <p className="text-sm text-text-muted">
          Please try again. If the issue persists, contact support.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button onClick={reset} className="bg-accent-primary text-bg-base">
            Try again
          </Button>
          <Button
            variant="outline"
            className="border-border-color text-text-primary"
            onClick={() => (window.location.href = '/login')}
          >
            Back to login
          </Button>
        </div>
      </div>
    </div>
  );
}
