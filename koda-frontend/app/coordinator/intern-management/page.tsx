 'use client';

import InternManagementView from '@/components/intern-management-view';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useEffect, useState } from 'react';

export default function InternManagementPage() {
  const { user, isLoading } = useCurrentUser();
  const [isMounted, setIsMounted] = useState(false);
  const [localSchool, setLocalSchool] = useState<string | null>(null);
  const [localBatchId, setLocalBatchId] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) {
      return;
    }

    setLocalSchool(localStorage.getItem('userSchool'));
    setLocalBatchId(localStorage.getItem('userBatchId'));
  }, [isMounted]);

  if (!isMounted || isLoading) {
    return <div className="p-8 text-text-muted">Loading intern management...</div>;
  }

  const coordinatorSchool = user?.school ?? user?.school_name ?? localSchool ?? undefined;
  const coordinatorBatchId = user?.batchId ?? user?.batch_id ?? localBatchId ?? undefined;

  return (
    <InternManagementView
      profileBasePath="/coordinator/intern"
      coordinatorScoped
      coordinatorSchoolFilter={coordinatorSchool}
      coordinatorBatchIdFilter={coordinatorBatchId}
    />
  );
}