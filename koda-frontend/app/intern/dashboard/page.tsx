'use client';

import JoinBatchGatekeeperModal from '@/components/join-batch-gatekeeper-modal';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

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

    const storedBatchId = typeof window !== 'undefined' ? localStorage.getItem('userBatchId') : null;
    const assignedBatchId = user?.batchId ?? user?.batch_id ?? storedBatchId;

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
    localStorage.setItem('userBatchId', batchCode.trim());
    localStorage.setItem('userSchool', school.trim());
    setShowJoinModal(false);
    router.replace('/interns/dashboard');
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
