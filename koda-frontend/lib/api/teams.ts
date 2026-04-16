import { auth } from '@/lib/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

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

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.ok) {
    return response.json() as Promise<T>;
  }

  let message = `Request failed (${response.status})`;

  try {
    const errorBody = (await response.json()) as {
      message?: string | string[];
      error?: string;
    };

    if (Array.isArray(errorBody.message)) {
      message = errorBody.message.join(', ');
    } else if (typeof errorBody.message === 'string') {
      message = errorBody.message;
    } else if (typeof errorBody.error === 'string') {
      message = errorBody.error;
    }
  } catch {
    // Ignore JSON parse errors and keep fallback message.
  }

  throw new Error(message);
}

export const teamsApi = {
  async create(payload: CreateTeamPayload): Promise<TeamDetail> {
    const response = await fetch(`${API_BASE_URL}/teams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...auth.headers(),
      },
      body: JSON.stringify(payload),
    });

    return handleResponse<TeamDetail>(response);
  },

  async findOne(id: string): Promise<TeamDetail> {
    const response = await fetch(`${API_BASE_URL}/teams/${id}`, {
      method: 'GET',
      headers: auth.headers(),
    });

    return handleResponse<TeamDetail>(response);
  },

  async findMine(): Promise<TeamDetail[]> {
    const response = await fetch(`${API_BASE_URL}/teams`, {
      method: 'GET',
      headers: auth.headers(),
    });

    return handleResponse<TeamDetail[]>(response);
  },

  async addMember(teamId: string, payload: AddTeamMemberPayload): Promise<TeamDetail> {
    const response = await fetch(`${API_BASE_URL}/teams/${teamId}/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...auth.headers(),
      },
      body: JSON.stringify(payload),
    });

    return handleResponse<TeamDetail>(response);
  },

  async removeMember(teamId: string, userId: string): Promise<TeamDetail> {
    const response = await fetch(`${API_BASE_URL}/teams/${teamId}/members/${userId}`, {
      method: 'DELETE',
      headers: auth.headers(),
    });

    return handleResponse<TeamDetail>(response);
  },
};
