import { requestJson } from '@/lib/api/client';

export interface InternRecord {
  id: string;
  user_id: string;
  team_id: string | null;
  school: string | null;
  created_at: string | null;
  user: {
    id: string;
    github_username: string;
    name: string | null;
    email: string | null;
    avatar_url: string | null;
  } | null;
  reports: Array<{
    id: string;
    title: string | null;
    period_start: string | null;
    period_end: string | null;
    submitted_at: string | null;
    status: string | null;
  }>;
  issue_assignments: Array<{
    id: string;
  }>;
}

export interface CreateInternPayload {
  user_id: string;
  team_id: string;
  name?: string;
}

export interface UpdateInternPayload {
  team_id?: string;
  name?: string;
}

export const internsApi = {
  async getAll(filters?: { teamId?: string; batchId?: string }): Promise<InternRecord[]> {
    const params = new URLSearchParams();

    if (filters?.teamId) {
      params.set('teamId', filters.teamId);
    }

    if (filters?.batchId) {
      params.set('batchId', filters.batchId);
    }

    const querySuffix = params.toString() ? `?${params.toString()}` : '';
    return requestJson<InternRecord[]>(`/interns${querySuffix}`);
  },

  async getOne(id: string): Promise<InternRecord> {
    return requestJson<InternRecord>(`/interns/${id}`);
  },

  async getProfile(id: string): Promise<{
    intern: InternRecord;
    reports: Array<Record<string, unknown>>;
  }> {
    return requestJson<{ intern: InternRecord; reports: Array<Record<string, unknown>> }>(
      `/interns/${id}/profile`
    );
  },

  async create(dto: CreateInternPayload): Promise<InternRecord> {
    return requestJson<InternRecord>('/interns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
  },

  async update(id: string, dto: UpdateInternPayload): Promise<InternRecord> {
    return requestJson<InternRecord>(`/interns/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
  },

  async remove(id: string): Promise<void> {
    return requestJson<void>(`/interns/${id}`, {
      method: 'DELETE',
    });
  },

  async join(joinCode: string, school?: string): Promise<InternRecord> {
    return requestJson<InternRecord>('/interns/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ joinCode, school }),
    });
  },
};