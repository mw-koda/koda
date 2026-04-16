'use client';

import { requestJson } from '@/lib/api/client';

export interface BatchSummary {
  id: string;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string;
  maxInterns: number;
  enrolledCount: number;
  availableSlots: number;
  isFull: boolean;
  status: 'active' | 'completed';
  joinCode: string;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface BatchDetail extends BatchSummary {
  assignedInterns: Array<{
    id: string;
    assignedAt: string | null;
    userId: string | null;
    teamId: string | null;
    name: string | null;
    email: string | null;
    githubUsername: string | null;
  }>;
}

export interface CreateBatchPayload {
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  maxInterns: number;
  joinCode?: string;
}

export interface UpdateBatchPayload {
  name?: string;
  description?: string | null;
  startDate?: string;
  endDate?: string;
  maxInterns?: number;
}

export interface AssignInternsPayload {
  internIds: string[];
}

export const batchesApi = {
  async create(payload: CreateBatchPayload): Promise<BatchDetail> {
    return requestJson<BatchDetail>('/batches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },

  async findAll(search?: string): Promise<BatchSummary[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);

    return requestJson<BatchSummary[]>(`/batches?${params}`);
  },

  async findOne(id: string): Promise<BatchDetail> {
    return requestJson<BatchDetail>(`/batches/${id}`);
  },

  async update(id: string, payload: UpdateBatchPayload): Promise<BatchDetail> {
    return requestJson<BatchDetail>(`/batches/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },

  async assignInterns(id: string, payload: AssignInternsPayload): Promise<BatchDetail> {
    return requestJson<BatchDetail>(`/batches/${id}/interns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },
};
