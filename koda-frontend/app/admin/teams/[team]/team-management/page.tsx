'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getUsers, type ApiUser } from '@/lib/api/users';
import { teamsApi, type TeamDetail } from '@/lib/api/teams';

const roleOptions: Array<'intern' | 'coordinator' | 'team_lead'> = [
  'intern',
  'coordinator',
  'team_lead',
];

export default function AdminTeamManagementPage() {
  const params = useParams();
  const teamId = params?.team as string;

  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [availableUsers, setAvailableUsers] = useState<ApiUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<'intern' | 'coordinator' | 'team_lead'>('intern');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const memberUserIds = useMemo(
    () => new Set((team?.members ?? []).map((member) => member.userId)),
    [team],
  );

  const selectableUsers = useMemo(
    () => availableUsers.filter((user) => !memberUserIds.has(user.id)),
    [availableUsers, memberUserIds],
  );

  const loadTeamData = async () => {
    if (!teamId) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [teamData, users] = await Promise.all([
        teamsApi.findOne(teamId),
        getUsers(),
      ]);

      setTeam(teamData);
      setAvailableUsers(users);
    } catch (requestError: unknown) {
      setTeam(null);
      setAvailableUsers([]);
      setError(requestError instanceof Error ? requestError.message : 'Failed to load team management.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadTeamData();
  }, [teamId]);

  useEffect(() => {
    if (!selectedUserId && selectableUsers.length > 0) {
      setSelectedUserId(selectableUsers[0].id);
    }
  }, [selectableUsers, selectedUserId]);

  const handleAddMember = async () => {
    if (!team || !selectedUserId) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const updated = await teamsApi.addMember(team.id, {
        userId: selectedUserId,
        role: selectedRole,
      });
      setTeam(updated);
      setSelectedUserId('');
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to add member.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!team) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const updated = await teamsApi.removeMember(team.id, userId);
      setTeam(updated);
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to remove member.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-text-muted">Loading team management...</div>;
  }

  if (!team || error) {
    return <div className="p-8 text-text-muted">{error ?? 'Team not found.'}</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-mono font-bold text-text-primary">
          {team.name} Team Management
        </h1>
        <p className="text-text-muted mt-2">
          Manage members for teams you created.
        </p>
      </div>

      {error && (
        <Card className="border-border-color bg-bg-surface p-4 text-sm text-accent-secondary">
          {error}
        </Card>
      )}

      <Card className="bg-bg-surface border-border-color p-6 space-y-4">
        <h2 className="text-xl font-mono font-semibold text-text-primary">Add Member</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger className="bg-bg-elevated border-border-color">
              <SelectValue placeholder="Select user" />
            </SelectTrigger>
            <SelectContent className="bg-bg-surface border-border-color">
              {selectableUsers.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name ?? user.github_username ?? user.email ?? user.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedRole}
            onValueChange={(value) => setSelectedRole(value as 'intern' | 'coordinator' | 'team_lead')}
          >
            <SelectTrigger className="bg-bg-elevated border-border-color">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent className="bg-bg-surface border-border-color">
              {roleOptions.map((role) => (
                <SelectItem key={role} value={role}>
                  {role.replace('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={handleAddMember}
          disabled={isSaving || !selectedUserId}
          className="bg-accent-primary hover:bg-accent-secondary text-white"
        >
          Add Member
        </Button>
      </Card>

      <Card className="bg-bg-surface border-border-color p-6">
        <h2 className="text-xl font-mono font-semibold text-text-primary mb-4">Current Members</h2>
        <div className="space-y-3">
          {team.members.map((member) => (
            <div
              key={member.id}
              className="rounded-lg border border-border-color bg-bg-elevated p-4 flex items-center justify-between gap-4"
            >
              <div>
                <p className="text-text-primary font-semibold">
                  {member.name ?? member.githubUsername ?? member.email ?? 'Unnamed member'}
                </p>
                <p className="text-sm text-text-muted">{member.email ?? 'No email'}</p>
                <p className="text-xs uppercase tracking-[0.16em] text-accent-primary mt-1">
                  {member.role.replace('_', ' ')}
                </p>
              </div>
              <Button
                variant="ghost"
                className="text-accent-secondary hover:text-accent-secondary"
                onClick={() => handleRemoveMember(member.userId)}
                disabled={isSaving}
              >
                Remove
              </Button>
            </div>
          ))}
          {team.members.length === 0 && (
            <div className="rounded-lg border border-border-color bg-bg-elevated p-6 text-sm text-text-muted">
              No members in this team yet.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
