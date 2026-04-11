'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import InternManagementView from '@/components/intern-management-view';
import { interns } from '@/lib/mock-data';
import { deslugifyTeamName, slugifyTeamName } from '@/lib/team-utils';

function resolveTeamName(teamSlug: string) {
  const match = interns.find((intern) => slugifyTeamName(intern.team) === teamSlug);
  return (match?.team ?? deslugifyTeamName(teamSlug)) || 'Team';
}

export default function AdminTeamManagementPage() {
  const params = useParams();
  const teamSlug = params?.team as string;
  const teamName = useMemo(() => resolveTeamName(teamSlug || ''), [teamSlug]);

  return (
    <InternManagementView
      profileBasePath={`/admin/teams/${teamSlug}/intern`}
      title={`${teamName} Team Management`}
      subtitle="Manage and monitor team progress and performance"
      showAssignedPeriod={false}
      showReportStatus={false}
      teamFilter={teamName || undefined}
    />
  );
}
