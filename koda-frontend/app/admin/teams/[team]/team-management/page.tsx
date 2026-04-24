'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { teamsApi, type TeamDetail } from '@/lib/api/teams';
import { getUsers, type ApiUser } from '@/lib/api/users';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

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
  const [search, setSearch] = useState('');
  const [memberRoleFilter, setMemberRoleFilter] = useState<'all' | 'intern' | 'coordinator' | 'team_lead'>('all');
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

  const filteredMembers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return (team?.members ?? []).filter((member) => {
      const matchesRole = memberRoleFilter === 'all' || member.role === memberRoleFilter;
      if (!matchesRole) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return [member.name, member.githubUsername, member.email]
        .filter((value): value is string => Boolean(value))
        .some((value) => value.toLowerCase().includes(normalizedSearch));
    });
  }, [memberRoleFilter, search, team?.members]);

  const loadTeamData = useCallback(async () => {
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
  }, [teamId]);

  useEffect(() => {
    void loadTeamData();
  }, [loadTeamData]);

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
              <Link
                href="/admin/batches"
                className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-text-muted hover:text-accent-primary transition-colors w-fit group mb-4"
              >
                <ArrowLeft className="w-3 h-3 transition-transform group-hover:-translate-x-1" />
                Back to Batch Management
              </Link>
      <div>
        <h1 className="text-3xl font-mono font-bold text-text-primary">
          {team.name} Team Management
        </h1>
        <p className="text-text-muted mt-2">
          Manage members for any team in your scope.
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
          className="bg-accent-primary hover:bg-accent-secondary text-black"
        >
          Add Member
        </Button>
      </Card>

      <Card className="bg-bg-surface border-border-color p-6">
        <h2 className="text-xl font-mono font-semibold text-text-primary mb-4">Current Members</h2>

        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
              />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, GitHub username, or email..."
              className="w-full pl-10 pr-4 py-2 bg-bg-elevated border border-border-color rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary transition-colors"
            />
          </div>

          <select
            value={memberRoleFilter}
            onChange={(e) => setMemberRoleFilter(e.target.value as 'all' | 'intern' | 'coordinator' | 'team_lead')}
            className="px-4 py-2 bg-bg-elevated border border-border-color rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent-primary transition-colors cursor-pointer min-w-[180px]"
          >
            <option value="all">All Roles</option>
            <option value="intern">Intern</option>
            <option value="coordinator">Coordinator</option>
            <option value="team_lead">Team Lead</option>
          </select>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border-color bg-bg-elevated/40">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-color">
                <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Name</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">GitHub</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Email</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Role</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-color">
              {filteredMembers.length > 0 ? (
                filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-bg-elevated transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-text-primary">
                        {member.name ?? member.githubUsername ?? member.email ?? 'Unnamed member'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-text-muted font-mono">
                        {member.githubUsername ? `@${member.githubUsername}` : '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-text-muted">{member.email ?? 'No email'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs uppercase tracking-[0.16em] text-accent-primary">
                        {member.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={`/admin/teams/${team.id}/intern/${member.userId}`}
                          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-accent-primary border border-accent-primary/30 rounded-lg hover:bg-accent-primary/10 transition-colors"
                        >
                          View
                        </Link>
                        <Button
                          variant="ghost"
                          className="text-accent-secondary hover:text-accent-secondary"
                          onClick={() => handleRemoveMember(member.userId)}
                          disabled={isSaving}
                        >
                          Remove
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-sm text-text-muted"
                  >
                    No members found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-3 text-center text-xs text-text-muted">
          Showing {filteredMembers.length} of {team.members.length} member{team.members.length === 1 ? '' : 's'}
        </div>
      </Card>
    </div>
  );
}
