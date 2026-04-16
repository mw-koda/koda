'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { teamsApi, type TeamDetail } from '@/lib/api/teams';

function generateTeamCode(teamId: string) {
  const normalized = teamId.replace(/[^a-z0-9]/gi, '').toUpperCase();
  const prefix = normalized.slice(0, 3).padEnd(3, 'X');
  let hash = 0;

  for (let i = 0; i < normalized.length; i += 1) {
    hash = (hash * 31 + normalized.charCodeAt(i)) % 100000;
  }

  const suffix = String(hash).padStart(5, '0');
  return `${prefix}-${suffix}`;
}

export default function AdminTeamDashboardPage() {
  const params = useParams();
  const teamId = params?.team as string;
  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || !teamId) {
      return;
    }

    const loadTeam = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await teamsApi.findOne(teamId);
        setTeam(data);
      } catch (requestError: unknown) {
        setTeam(null);
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Failed to load team dashboard.',
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadTeam();
  }, [isMounted, teamId]);

  if (!isMounted || isLoading) {
    return <div className="p-8 text-text-muted">Loading dashboard...</div>;
  }

  if (!team || error) {
    return <div className="p-8 text-text-muted">{error ?? 'Team not found.'}</div>;
  }

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const leadMembers = team.members.filter((member) => member.role === 'team_lead');
  const internMembers = team.members.filter((member) => member.role === 'intern');
  const coordinatorMembers = team.members.filter((member) => member.role === 'coordinator');
  const recentMembers = [...team.members].slice(0, 6);
  const teamCode = generateTeamCode(team.id);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-mono font-bold text-text-primary mb-2">
          {team.name} Dashboard
        </h1>
        <p className="text-sm uppercase tracking-[0.28em] text-text-muted">
          Team code: {teamCode}
        </p>
        <p className="text-text-muted">{today}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-bg-surface border-border-color p-6 card-glow">
          <p className="text-label text-text-muted mb-2">Team Leads</p>
          <p className="text-3xl font-mono font-bold text-text-primary">
            {leadMembers.length}
          </p>
          <p className="text-xs text-text-muted mt-2">Lead members assigned</p>
        </Card>
        <Card className="bg-bg-surface border-border-color p-6 card-glow">
          <p className="text-label text-text-muted mb-2">Intern Members</p>
          <p className="text-3xl font-mono font-bold text-text-primary">
            {internMembers.length}
          </p>
          <p className="text-xs text-text-muted mt-2">Interns currently in team</p>
        </Card>
        <Card className="bg-bg-surface border-border-color p-6 card-glow">
          <p className="text-label text-text-muted mb-2">Coordinator Members</p>
          <p className="text-3xl font-mono font-bold text-text-primary">
            {coordinatorMembers.length}
          </p>
          <p className="text-xs text-text-muted mt-2">Coordinators assigned</p>
        </Card>
        <Card className="bg-bg-surface border-border-color p-6 card-glow">
          <p className="text-label text-text-muted mb-2">Total Members</p>
          <p className="text-3xl font-mono font-bold text-text-primary">
            {team.memberCount}
          </p>
          <p className="text-xs text-text-muted mt-2">Across all roles</p>
        </Card>
      </div>

      <Card className="bg-bg-surface border-border-color p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-mono font-semibold text-text-primary">
            Team Members
          </h2>
          <Link
            href={`/admin/teams/${team.id}/team-management`}
            className="text-sm text-accent-secondary hover:text-accent-primary transition-colors"
          >
            Manage members
          </Link>
        </div>
        <div className="space-y-3">
          {recentMembers.map((member) => (
            <div
              key={member.id}
              className="p-3 bg-bg-elevated rounded-lg border border-border-color"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-text-primary">
                    {member.name ?? member.githubUsername ?? member.email ?? 'Unnamed member'}
                  </p>
                  <p className="text-xs text-text-muted mt-1">
                    {member.email ?? 'No email'}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs capitalize">
                  {member.role.replace('_', ' ')}
                </Badge>
              </div>
            </div>
          ))}
          {recentMembers.length === 0 && (
            <div className="rounded-lg border border-border-color bg-bg-elevated p-6 text-sm text-text-muted">
              No members recorded for this team yet.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
