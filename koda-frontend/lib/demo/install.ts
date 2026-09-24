/**
 * Demo fetch shim (side-effect module).
 *
 * Imported for its side effect by components/layout/layout-wrapper.tsx, so it
 * runs at client-bundle evaluation time, before any component effect fetches.
 * In demo mode it patches window.fetch once: requests whose URL starts with
 * DEMO_API_BASE are answered by the mock backend (router.ts); everything else
 * (Next RSC fetches, assets) goes to the original fetch untouched.
 *
 * Extras: '?demoReset=1' reseeds the db and strips the param; window.kodaDemo
 * exposes { reset(), db(), personas, loginAs(key) } for console use.
 */

import { personaUserId, tokenForPersona } from './auth-token';
import {
  DEMO_API_BASE,
  DEMO_DB_STORAGE_KEY,
  DEMO_MODE,
  DEMO_PERSONAS,
  DEMO_RESET_PARAM,
  DEMO_SESSION_LEAK_KEYS,
  type DemoPersona,
} from './config';
import { getDb, resetDb } from './db';
import type { DemoResult } from './http';
import { dispatch, type DispatchInput } from './router';
import type { DemoDb } from './types';

interface KodaDemoConsole {
  /** Reseed the demo data (and reload the page unless reload === false). */
  reset: (reload?: boolean) => void;
  /** The live mock database. */
  db: () => DemoDb;
  personas: Array<DemoPersona & { userId: string | null; token: string | null }>;
  /** Log in as a persona through /auth/callback (full navigation). */
  loginAs: (personaKey: string) => void;
}

declare global {
  interface Window {
    __kodaDemoInstalled?: boolean;
    __kodaOrigFetch?: typeof fetch;
    __kodaDemoDispatch?: (input: DispatchInput) => Promise<DemoResult>;
    kodaDemo?: KodaDemoConsole;
  }
}

function isDemoUrl(url: string): boolean {
  return (
    url === DEMO_API_BASE ||
    url.startsWith(`${DEMO_API_BASE}/`) ||
    url.startsWith(`${DEMO_API_BASE}?`)
  );
}

function inputUrl(input: RequestInfo | URL): string | null {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.href;
  if (input && typeof (input as Request).url === 'string') return (input as Request).url;
  return null;
}

function isRequest(input: RequestInfo | URL): input is Request {
  return typeof Request !== 'undefined' && input instanceof Request;
}

function headersToRecord(headers: HeadersInit | undefined, target: Record<string, string>): void {
  if (!headers) return;

  if (typeof Headers !== 'undefined' && headers instanceof Headers) {
    headers.forEach((value, key) => {
      target[key.toLowerCase()] = value;
    });
    return;
  }

  if (Array.isArray(headers)) {
    for (const [key, value] of headers) {
      target[String(key).toLowerCase()] = String(value);
    }
    return;
  }

  for (const [key, value] of Object.entries(headers as Record<string, string>)) {
    if (value !== undefined && value !== null) {
      target[key.toLowerCase()] = String(value);
    }
  }
}

async function readBody(input: RequestInfo | URL, init: RequestInit | undefined, method: string): Promise<string | null> {
  if (method === 'GET' || method === 'HEAD') return null;

  const body = init?.body;
  if (typeof body === 'string') return body;
  if (body !== undefined && body !== null) {
    try {
      return await new Response(body).text();
    } catch {
      return null;
    }
  }

  if (isRequest(input)) {
    try {
      return await input.clone().text();
    } catch {
      return null;
    }
  }

  return null;
}

function abortError(): Error {
  try {
    return new DOMException('The operation was aborted.', 'AbortError');
  } catch {
    const error = new Error('The operation was aborted.');
    error.name = 'AbortError';
    return error;
  }
}

function latencyFor(url: string): number {
  const path = url.slice(DEMO_API_BASE.length).split('?')[0].replace(/\/+$/, '');
  if (path === '/auth/me') {
    return Math.floor(Math.random() * 31);
  }
  return 120 + Math.floor(Math.random() * 161);
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function handleDemoRequest(url: string, input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const signal = init?.signal ?? (isRequest(input) ? input.signal : undefined);
  if (signal?.aborted) throw abortError();

  const method = (init?.method ?? (isRequest(input) ? input.method : 'GET')).toUpperCase();
  const headers: Record<string, string> = {};
  if (isRequest(input)) headersToRecord(input.headers, headers);
  headersToRecord(init?.headers, headers);
  const bodyText = await readBody(input, init, method);

  await wait(latencyFor(url));
  if (signal?.aborted) throw abortError();

  const run = window.__kodaDemoDispatch ?? dispatch;
  let result: DemoResult;
  try {
    result = await run({ method, url, headers, bodyText });
  } catch (error) {
    console.error('[demo] dispatch failed', method, url, error);
    result = {
      status: 500,
      body: {
        statusCode: 500,
        timestamp: new Date().toISOString(),
        path: url.slice(DEMO_API_BASE.length),
        message: 'Demo backend error',
        error: 'Internal Server Error',
      },
    };
  }

  const noBody = result.status === 204 || result.status === 205 || result.status === 304;
  return new Response(noBody ? null : JSON.stringify(result.body ?? null), {
    status: result.status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function clearSessionLeakKeys(): void {
  for (const key of DEMO_SESSION_LEAK_KEYS) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Ignore.
    }
  }
}

function stripResetParam(): void {
  try {
    const current = new URL(window.location.href);
    if (!current.searchParams.has(DEMO_RESET_PARAM)) return;
    current.searchParams.delete(DEMO_RESET_PARAM);
    window.history.replaceState(window.history.state, '', `${current.pathname}${current.search}${current.hash}`);
  } catch {
    // Ignore.
  }
}

function handleResetParam(): void {
  let requested = false;
  try {
    requested = new URLSearchParams(window.location.search).get(DEMO_RESET_PARAM) === '1';
  } catch {
    requested = false;
  }
  if (!requested) return;

  resetDb();
  clearSessionLeakKeys();
  console.info('[demo] demo data reset');
  stripResetParam();
  // Next's router may restore its initial URL during hydration; strip again.
  for (const delay of [50, 300, 1000, 2500, 5000]) {
    setTimeout(stripResetParam, delay);
  }
}

function installConsoleApi(): void {
  window.kodaDemo = {
    reset(reload = true) {
      resetDb();
      clearSessionLeakKeys();
      if (reload) window.location.reload();
    },
    db: () => getDb(),
    personas: DEMO_PERSONAS.map((persona) => ({
      ...persona,
      userId: personaUserId(persona.key),
      token: tokenForPersona(persona.key),
    })),
    loginAs(personaKey: string) {
      const token = tokenForPersona(personaKey);
      if (!token) {
        console.warn('[demo] unknown persona', personaKey, DEMO_PERSONAS.map((p) => p.key));
        return;
      }
      clearSessionLeakKeys();
      window.location.href = `/auth/callback?token=${encodeURIComponent(token)}`;
    },
  };
}

function installDemo(): void {
  // Re-evaluation (Fast Refresh) swaps in the newest dispatcher without re-patching fetch.
  window.__kodaDemoDispatch = dispatch;
  installConsoleApi();
  handleResetParam();

  if (window.__kodaDemoInstalled) return;
  window.__kodaDemoInstalled = true;

  const originalFetch = window.__kodaOrigFetch ?? window.fetch.bind(window);
  window.__kodaOrigFetch = originalFetch;

  window.fetch = function demoFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = inputUrl(input);
    if (!url || !isDemoUrl(url)) {
      return originalFetch(input, init);
    }
    return handleDemoRequest(url, input, init);
  };

  console.info(
    `[demo] KODA demo mode: ${DEMO_API_BASE} is served from localStorage '${DEMO_DB_STORAGE_KEY}'. ` +
      'Use kodaDemo.reset(), kodaDemo.loginAs(key) or ?demoReset=1.'
  );
}

if (typeof window !== 'undefined' && DEMO_MODE) {
  installDemo();
}
