const FALLBACK_DEV_API_URL = 'http://localhost:3000';

export function getPublicApiBaseUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (baseUrl) {
    return baseUrl;
  }

  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return FALLBACK_DEV_API_URL;
}
