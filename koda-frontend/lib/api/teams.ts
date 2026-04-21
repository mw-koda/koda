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
  batchId: string | null;
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
  batchId: string;
  description?: string;
  teamLeadId?: string;
  maxInterns?: number;
}

export interface AddTeamMemberPayload {
  userId: string;
  role: 'admin' | 'coordinator' | 'intern' | 'team_lead';
}

export type TeamIssueStatus = 'open' | 'closed' | 'in_progress';

export interface TeamDashboardMetrics {
  openIssues: number;
  inProgressIssues: number;
  closedIssues: number;
  highPriorityIssues: number;
}

export interface TeamDashboardRecentIssueItem {
  id: string;
  title: string;
  repo: string;
  user: string;
  status: TeamIssueStatus;
}

export interface TeamDashboardLogItem {
  type: string;
  message: string;
  time: string;
  timestamp: string;
}

export interface TeamDashboardData {
  team: TeamDetail;
  metrics: TeamDashboardMetrics;
  recentIssues: TeamDashboardRecentIssueItem[];
  logs: TeamDashboardLogItem[];
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

  async getDashboard(id: string): Promise<TeamDashboardData> {
    return requestJson<TeamDashboardData>(`/teams/${id}/dashboard`);
  },

  async findMine(batchId?: string): Promise<TeamDetail[]> {
    const params = new URLSearchParams();
    if (batchId) {
      params.append('batchId', batchId);
    }

    const query = params.toString();
    return requestJson<TeamDetail[]>(query ? `/teams?${query}` : '/teams');
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
