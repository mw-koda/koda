import { auth } from '@/lib/auth';
import { getPublicApiBaseUrl } from '@/lib/public-config';

const API_BASE_URL = getPublicApiBaseUrl();

export interface Issue {
  id: string;
  github_issue_id: string;
  repo_id: string;
  title: string;
  state: 'open' | 'closed' | 'in_progress';
  created_at: string | null;
  updated_at: string | null;
  closed_at: string | null;
  labels: Record<string, unknown>[];
  assignee_name?: string | null;
  assignee_username?: string | null;
  assignee_avatar?: string | null;
}

export interface IssueFilter {
  repo_id?: string;
  state?: 'open' | 'closed' | 'in_progress';
  intern_id?: string;
  period_start?: string;
  period_end?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedIssues {
  data: Issue[];
  total: number | null;
  page: number;
  limit: number;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `API error: ${response.status}`);
  }
  return response.json();
}

export const issuesApi = {
  async getRecent(limit: number = 10): Promise<Issue[]> {
    const response = await fetch(`${API_BASE_URL}/issues/recent?limit=${limit}`, {
      method: 'GET',
      headers: auth.headers(),
    });
    return handleResponse(response);
  },

  async findAll(filters: IssueFilter = {}): Promise<PaginatedIssues> {
    // 1. We will comment out the parameter building for now
    /*
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) params.append(key, String(value));
    });
    */

    // 2. Remove the `?${params}` from the URL so it makes a clean request
    const response = await fetch(`${API_BASE_URL}/issues`, { 
      method: 'GET',
      headers: auth.headers(),
    });
    
    return handleResponse(response);
  },

  async findByInternId(internId: string, filters: IssueFilter = {}): Promise<Issue[]> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) params.append(key, String(value));
    });

    const response = await fetch(`${API_BASE_URL}/issues/intern/${internId}?${params}`, {
      method: 'GET',
      headers: auth.headers(),
    });
    return handleResponse(response);
  },

  async findOne(id: string): Promise<Issue> {
    const response = await fetch(`${API_BASE_URL}/issues/${id}`, {
      method: 'GET',
      headers: auth.headers(),
    });
    return handleResponse(response);
  },
};