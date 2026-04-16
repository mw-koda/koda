'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import InternProfileView from '@/components/InternProfileView';
import { interns } from '@/lib/mock-data';
import { deslugifyTeamName, slugifyTeamName } from '@/lib/team-utils';

function resolveTeamName(teamSlug: string) {
  const match = interns.find((intern) => slugifyTeamName(intern.team) === teamSlug);
  return (match?.team ?? deslugifyTeamName(teamSlug)) || 'Team';
}

export default function AdminTeamInternProfilePage() {
  const params = useParams();
  const teamSlug = params?.team as string;
  const teamName = useMemo(() => resolveTeamName(teamSlug || ''), [teamSlug]);

  return <InternProfileView backLabel={`${teamName} Team Management`} />;
}
