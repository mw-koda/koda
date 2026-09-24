import { DEMO_API_BASE, DEMO_MODE } from '@/lib/demo/config';

const FALLBACK_DEV_API_URL = 'http://localhost:3000';

export function getPublicApiBaseUrl(): string {
  // Demo mode: every API call goes to a sentinel origin served by lib/demo/install.ts.
  if (DEMO_MODE) {
    return DEMO_API_BASE;
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (baseUrl) {
    return baseUrl.replace(/\/+$/, '');
  }

  if (typeof window !== 'undefined') {
    if (
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'
    ) {
      return FALLBACK_DEV_API_URL;
    }

    return window.location.origin;
  }

  return FALLBACK_DEV_API_URL;
}
