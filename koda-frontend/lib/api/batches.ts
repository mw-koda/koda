'use client';

import { auth } from '@/lib/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

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

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `API error: ${response.status}`);
  }
  return response.json();
}

export const batchesApi = {
  async create(payload: CreateBatchPayload): Promise<BatchDetail> {
    const response = await fetch(`${API_BASE_URL}/batches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...auth.headers(),
      },
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },

  async findAll(search?: string): Promise<BatchSummary[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);

    const response = await fetch(`${API_BASE_URL}/batches?${params}`, {
      method: 'GET',
      headers: auth.headers(),
    });
    return handleResponse(response);
  },

  async findOne(id: string): Promise<BatchDetail> {
    const response = await fetch(`${API_BASE_URL}/batches/${id}`, {
      method: 'GET',
      headers: auth.headers(),
    });
    return handleResponse(response);
  },

  async update(id: string, payload: UpdateBatchPayload): Promise<BatchDetail> {
    const response = await fetch(`${API_BASE_URL}/batches/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...auth.headers(),
      },
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },

  async assignInterns(id: string, payload: AssignInternsPayload): Promise<BatchDetail> {
    const response = await fetch(`${API_BASE_URL}/batches/${id}/interns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...auth.headers(),
      },
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },
};
