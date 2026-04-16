import { requestJson } from '@/lib/api/client';

export type ApiUserRole = 'admin' | 'coordinator' | 'intern' | 'team_lead';
export type ApiUserStatus = 'active' | 'pending' | 'inactive';

export interface ApiUser {
  id: string;
  github_id: string | null;
  github_username: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: ApiUserRole;
  is_onboarded: boolean;
  created_at: string;
  updated_at: string;
  status?: ApiUserStatus;
}

export interface GetUsersFilters {
  role?: ApiUserRole;
  search?: string;
}

export interface OnboardUserRequest {
  githubUsername: string;
  role: Exclude<ApiUserRole, 'team_lead'>;
}

export interface UpdateUserRequest {
  name?: string;
  githubUsername?: string;
  role?: ApiUserRole;
  status?: ApiUserStatus;
}
export async function getUsers(filters?: GetUsersFilters): Promise<ApiUser[]> {
  const query = new URLSearchParams();

  if (filters?.role) {
    query.set('role', filters.role);
  }

  if (filters?.search) {
    query.set('search', filters.search);
  }

  const querySuffix = query.toString() ? `?${query.toString()}` : '';
  return requestJson<ApiUser[]>(`/users${querySuffix}`);
}

export async function onboardUser(payload: OnboardUserRequest): Promise<ApiUser> {
  return requestJson<ApiUser>('/users/onboard', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function updateUser(
  userId: string,
  payload: UpdateUserRequest,
): Promise<ApiUser> {
  return requestJson<ApiUser>(`/users/${userId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}
