'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import InternProfileView from '@/components/InternProfileView';
import { teamsApi } from '@/lib/api/teams';
import { internsApi } from '@/lib/api/interns';

export default function AdminTeamInternProfilePage() {
  const params = useParams();
  const teamId = params?.team as string;
  const memberUserId = params?.id as string;

  const [teamName, setTeamName] = useState<string>('Team');
  const [internId, setInternId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMemberProfile = useCallback(async () => {
    if (!teamId || !memberUserId) {
      setError('Missing team or member identifier.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [team, allInterns] = await Promise.all([
        teamsApi.findOne(teamId),
        internsApi.getAll(),
      ]);

      setTeamName(team.name);

      const matchedMember = team.members.find((member) => member.userId === memberUserId);
      if (!matchedMember) {
        setInternId(null);
        setError('Member not found in this team.');
        return;
      }

      const matchedIntern = allInterns.find((intern) => intern.user_id === memberUserId) ?? null;
      if (!matchedIntern) {
        setInternId(null);
        setError('No intern profile found for this member.');
        return;
      }

      setInternId(matchedIntern.id);
    } catch (requestError: unknown) {
      setInternId(null);
      setError(requestError instanceof Error ? requestError.message : 'Failed to load member profile.');
    } finally {
      setIsLoading(false);
    }
  }, [memberUserId, teamId]);

  useEffect(() => {
    void loadMemberProfile();
  }, [loadMemberProfile]);

  if (isLoading) {
    return <div className="p-8 text-text-muted">Loading member profile...</div>;
  }

  if (internId) {
    return (
      <InternProfileView
        internId={internId}
        backLabel={`${teamName} Team Management`}
        canManageReports={false}
      />
    );
  }

  return (
    <div className="p-8 space-y-6">
      <Card className="bg-bg-surface border-border-color p-6">
        <h1 className="text-3xl font-mono font-bold text-text-primary mb-2">Member Profile</h1>
        <p className="text-sm text-text-muted">{error ?? 'Member profile is unavailable.'}</p>
      </Card>
    </div>
  );
}
