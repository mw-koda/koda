'use client';

import JoinBatchGatekeeperModal from '@/components/join-batch-gatekeeper-modal';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { internsApi } from '@/lib/api/interns';

export default function InternDashboardRedirect() {
  const router = useRouter();
  const { user, isLoading } = useCurrentUser();
  const [isMounted, setIsMounted] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || isLoading) {
      return;
    }

    const assignedBatchId = user?.batchId ?? user?.batch_id;

    if (assignedBatchId) {
      setShowJoinModal(false);
      router.replace('/interns/dashboard');
      return;
    }

    setShowJoinModal(true);
  }, [isLoading, isMounted, router, user]);

  if (!isMounted || isLoading) {
    return <div className="p-8 text-text-muted">Loading dashboard...</div>;
  }

  const handleJoinBatch = async ({ batchCode, school }: { batchCode: string; school: string }) => {
    try {
      // 1. Call real API to join batch in database
      await internsApi.join(batchCode.trim(), school.trim());
      
      // 2. Fallback for school (as it is not yet in the schema but used for UI display)
      localStorage.setItem('userSchool', school.trim());
      
      // 3. Clear modal and redirect
      setShowJoinModal(false);
      window.location.href = '/interns/dashboard'; // Full reload to refresh user state
    } catch (err: any) {
      console.error('Failed to join batch:', err);
      alert(err.message || 'Failed to join batch. Please check your code.');
    }
  };

  return (
    <div className="p-8">
      <JoinBatchGatekeeperModal
        isOpen={showJoinModal}
        roleLabel="Intern"
        onJoin={handleJoinBatch}
      />
      <div className="rounded-xl border border-border-color bg-bg-surface p-6 card-glow">
        <p className="text-sm text-text-muted">Preparing your intern dashboard...</p>
      </div>
    </div>
  );
}
