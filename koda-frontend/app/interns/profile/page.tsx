'use client';

import InternProfileView from '@/components/InternProfileView';
import { useCurrentUser } from '@/hooks/use-current-user';

export default function InternProfilePage() {
  const { user, isLoading } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-base p-8">
        <div className="flex items-center gap-3 text-text-muted font-mono animate-pulse">
          <div className="h-4 w-4 rounded-full border-2 border-accent-primary/20 border-t-accent-primary animate-spin" />
          Loading profile...
        </div>
      </div>
    );
  }

  if (!user || !user.intern_id) {
    return (
      <div className="p-8 text-center text-text-muted">
        Intern record not found. Please join a batch first.
      </div>
    );
  }

  return (
    <InternProfileView
      internId={user.intern_id}
      backLabel="Dashboard"
      canManageReports={true}
    />
  );
}
