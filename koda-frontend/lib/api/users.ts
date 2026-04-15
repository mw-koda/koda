import { auth } from '@/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

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

function buildUrl(path: string): string {
  return `${API_URL}${path}`;
}

function buildAuthHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return {
    ...auth.headers(),
    ...extra,
  };
}

async function parseJson<T>(response: Response): Promise<T> {
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
    // Ignore JSON parse errors and use fallback message.
  }

  throw new Error(message);
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
  const response = await fetch(buildUrl(`/users${querySuffix}`), {
    headers: buildAuthHeaders(),
  });

  return parseJson<ApiUser[]>(response);
}

export async function onboardUser(payload: OnboardUserRequest): Promise<ApiUser> {
  const response = await fetch(buildUrl('/users/onboard'), {
    method: 'POST',
    headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });

  return parseJson<ApiUser>(response);
}

export async function updateUser(
  userId: string,
  payload: UpdateUserRequest,
): Promise<ApiUser> {
  const response = await fetch(buildUrl(`/users/${userId}`), {
    method: 'PATCH',
    headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });

  return parseJson<ApiUser>(response);
}
