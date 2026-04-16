'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import InternProfileView from '@/components/InternProfileView';
import { teamsApi, type TeamDetail } from '@/lib/api/teams';
import { interns } from '@/lib/mock-data';

type MemberProfile = TeamDetail['members'][number] | null;

function normalize(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

function resolveMockInternId(member: NonNullable<MemberProfile>, teamName: string): string | null {
  const github = normalize(member.githubUsername);
  const name = normalize(member.name);

  const byGithub = github
    ? interns.find((intern) => normalize(intern.github) === github)
    : undefined;
  if (byGithub) {
    return byGithub.id;
  }

  const byName = name
    ? interns.find((intern) => normalize(intern.name) === name)
    : undefined;
  if (byName) {
    return byName.id;
  }

  const byTeam = interns.find((intern) => normalize(intern.team) === normalize(teamName));
  if (byTeam) {
    return byTeam.id;
  }

  return interns[0]?.id ?? null;
}

export default function AdminTeamInternProfilePage() {
  const params = useParams();
  const teamId = params?.team as string;
  const memberUserId = params?.id as string;

  const [teamName, setTeamName] = useState<string>('Team');
  const [mockInternId, setMockInternId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMemberProfile = useCallback(async () => {
    if (!teamId || !memberUserId) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const team = await teamsApi.findOne(teamId);
      setTeamName(team.name);

      const matchedMember = team.members.find((item) => item.userId === memberUserId) ?? null;

      if (!matchedMember) {
        setError('Member not found in this team.');
        setMockInternId(null);
        return;
      }

      const resolvedId = resolveMockInternId(matchedMember, team.name);
      setMockInternId(resolvedId);
    } catch (requestError: unknown) {
      setMockInternId(null);
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

  if (mockInternId && !error) {
    return (
      <InternProfileView
        internId={mockInternId}
        backLabel={`${teamName} Team Management`}
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
