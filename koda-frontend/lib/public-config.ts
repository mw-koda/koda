const FALLBACK_DEV_API_URL = 'http://localhost:3000';

function normalizeUrl(url: string): string {
  return url.trim().replace(/\/+$/, '');
}

export function getPublicApiBaseUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (baseUrl) {
    return normalizeUrl(baseUrl);
  }

  return FALLBACK_DEV_API_URL;
}
