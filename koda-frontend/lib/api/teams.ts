import { requestJson } from '@/lib/api/client';

export interface TeamMember {
  id: string;
  userId: string;
  role: 'admin' | 'coordinator' | 'intern' | 'team_lead';
  githubUsername: string | null;
  name: string | null;
  email: string | null;
  userRole: 'admin' | 'coordinator' | 'intern' | 'team_lead' | null;
}

export interface TeamDetail {
  id: string;
  name: string;
  createdBy: {
    id: string;
    githubUsername: string | null;
    name: string | null;
    email: string | null;
    role: 'admin' | 'coordinator' | 'intern' | 'team_lead' | null;
  } | null;
  createdAt: string | null;
  members: TeamMember[];
  memberCount: number;
}

export interface CreateTeamPayload {
  name: string;
  description?: string;
  teamLeadId?: string;
  maxInterns?: number;
}

export interface AddTeamMemberPayload {
  userId: string;
  role: 'admin' | 'coordinator' | 'intern' | 'team_lead';
}
export const teamsApi = {
  async create(payload: CreateTeamPayload): Promise<TeamDetail> {
    return requestJson<TeamDetail>('/teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },

  async findOne(id: string): Promise<TeamDetail> {
    return requestJson<TeamDetail>(`/teams/${id}`);
  },

  async findMine(): Promise<TeamDetail[]> {
    return requestJson<TeamDetail[]>('/teams');
  },

  async addMember(teamId: string, payload: AddTeamMemberPayload): Promise<TeamDetail> {
    return requestJson<TeamDetail>(`/teams/${teamId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },

  async removeMember(teamId: string, userId: string): Promise<TeamDetail> {
    return requestJson<TeamDetail>(`/teams/${teamId}/members/${userId}`, {
      method: 'DELETE',
    });
  },
};
