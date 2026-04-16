import { auth } from '@/lib/auth';
import { getPublicApiBaseUrl } from '@/lib/public-config';

export type ApiError = Error & {
  status: number;
};

function buildUrl(path: string): string {
  return `${getPublicApiBaseUrl()}${path}`;
}

async function parseError(response: Response): Promise<ApiError> {
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

  const error = new Error(message) as ApiError;
  error.status = response.status;
  return error;
}

async function parseSuccess<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }

  try {
    return (await response.json()) as T;
  } catch {
    return undefined as T;
  }
}

export async function requestJson<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(buildUrl(path), {
    ...options,
    headers: {
      ...auth.headers(),
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  return parseSuccess<T>(response);
}
