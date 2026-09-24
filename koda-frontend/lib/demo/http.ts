/**
 * Handler contract for demo domain route tables (lib/demo/handlers/*.ts).
 *
 * Each domain file exports `routes: DemoRoute[]`. The router (router.ts) picks
 * the table by the first path segment and tries routes IN ARRAY ORDER, so put
 * literal segments before params: '/issues/recent' before '/issues/:id',
 * '/attendance/live' before '/attendance/:internId'.
 *
 * Rules for handlers:
 * - Return ok()/created()/noContent()/fail(); or throw DemoHttpError. Any other
 *   throw becomes a 500 JSON (and is logged).
 * - NEVER return 401/403 (the UI logs out on them). Only GET /auth/me may 401.
 *   Role/ownership checks are permissive: answer 200 with properly scoped data.
 *   `currentUser` may be null (missing/unknown token): treat it as unscoped.
 * - Always return full JSON bodies; arrays must never be undefined.
 * - Mutate req.db in place. The router calls saveDb() after any non-GET
 *   request that returns status < 400.
 */

import type { DemoDb, UserRow } from './types';
import { isUuid } from './ids';

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export interface DemoRequest {
  method: HttpMethod;
  /** Full parsed URL (origin is DEMO_API_BASE). */
  url: URL;
  /** Raw (not URI-decoded) pathname without trailing slash, e.g. '/teams/<id>/members'. */
  path: string;
  /** url.searchParams ('/batches?' has an empty query). */
  query: URLSearchParams;
  /** Parsed JSON body, or null (no body / not JSON). */
  body: any;
  /** Raw body text, or null. */
  rawBody: string | null;
  /** Request headers with lowercased keys. */
  headers: Record<string, string>;
  /** User resolved from 'authorization: Bearer demo.<userId>', or null. */
  currentUser: UserRow | null;
  db: DemoDb;
  /** ':param' values from the matched pattern (URI-decoded). */
  params: Record<string, string>;
}

export interface DemoResult {
  status: number;
  /** JSON-serializable body; ignored for 204. */
  body: unknown;
}

export type DemoHandler = (req: DemoRequest) => DemoResult | Promise<DemoResult>;

export interface DemoRoute {
  method: HttpMethod;
  /** Path pattern with ':param' segments, e.g. '/teams/:id/members/:userId'. */
  pattern: string;
  handle: DemoHandler;
}

/** Nest AllExceptionsFilter error envelope. */
export interface NestErrorBody {
  statusCode: number;
  timestamp: string;
  path: string;
  message: string | string[];
  error?: string;
}

const STATUS_ERRORS: Record<number, string> = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  409: 'Conflict',
  422: 'Unprocessable Entity',
  500: 'Internal Server Error',
};

export function ok<T>(body: T, status = 200): DemoResult {
  return { status, body };
}

/** 201 Created (Nest default for @Post). */
export function created<T>(body: T): DemoResult {
  return { status: 201, body };
}

export function noContent(): DemoResult {
  return { status: 204, body: null };
}

/**
 * Nest-style error: { statusCode, timestamp, path, message, error }.
 * `path` is filled in by the router with the request path + query.
 */
export function fail(status: number, message: string | string[], error?: string): DemoResult {
  const body: NestErrorBody = {
    statusCode: status,
    timestamp: new Date().toISOString(),
    path: '',
    message,
    error: error ?? STATUS_ERRORS[status] ?? 'Error',
  };
  return { status, body };
}

export function badRequest(message: string | string[]): DemoResult {
  return fail(400, message, 'Bad Request');
}

export function notFound(message: string | string[]): DemoResult {
  return fail(404, message, 'Not Found');
}

export function conflict(message: string | string[]): DemoResult {
  return fail(409, message, 'Conflict');
}

/** Throw from anywhere inside a handler; the router converts it with fail(). */
export class DemoHttpError extends Error {
  status: number;
  messages: string | string[];
  error?: string;

  constructor(status: number, message: string | string[], error?: string) {
    super(Array.isArray(message) ? message.join(', ') : message);
    this.name = 'DemoHttpError';
    this.status = status;
    this.messages = message;
    this.error = error;
  }
}

export function isDemoHttpError(value: unknown): value is DemoHttpError {
  return value instanceof DemoHttpError;
}

/** Split a pathname into non-empty segments. */
export function splitPath(path: string): string[] {
  return path.split('/').filter(Boolean);
}

/** Normalize a pathname: leading '/', no trailing '/', collapse '//' (root stays '/'). */
export function normalizePath(pathname: string): string {
  const segments = splitPath(pathname);
  return segments.length ? `/${segments.join('/')}` : '/';
}

/**
 * Match a pattern like '/teams/:id/members/:userId' against a path. Segment
 * counts must be equal; ':name' segments capture (URI-decoded). Returns the
 * params object, or null when it does not match.
 */
export function matchRoute(pattern: string, path: string): Record<string, string> | null {
  const patternSegments = splitPath(pattern);
  const pathSegments = splitPath(path);

  if (patternSegments.length !== pathSegments.length) {
    return null;
  }

  const params: Record<string, string> = {};

  for (let i = 0; i < patternSegments.length; i++) {
    const expected = patternSegments[i];
    const actual = pathSegments[i];

    if (expected.startsWith(':')) {
      try {
        params[expected.slice(1)] = decodeURIComponent(actual);
      } catch {
        params[expected.slice(1)] = actual;
      }
      continue;
    }

    if (expected !== actual) {
      return null;
    }
  }

  return params;
}

/** Trimmed query string value; empty/missing => undefined. */
export function queryString(query: URLSearchParams, name: string): string | undefined {
  const value = query.get(name);
  if (value === null) return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

/** Integer query value (>= min) or the fallback when missing/invalid. */
export function queryInt(query: URLSearchParams, name: string, fallback: number, min = 1): number {
  const raw = queryString(query, name);
  if (raw === undefined) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed >= min ? parsed : fallback;
}

/**
 * ParseUUIDPipe equivalent: returns the param when it is a UUID, otherwise
 * throws DemoHttpError(400, 'Validation failed (uuid is expected)').
 */
export function uuidParam(req: DemoRequest, name: string): string {
  const value = req.params[name];
  if (!isUuid(value)) {
    throw new DemoHttpError(400, 'Validation failed (uuid is expected)', 'Bad Request');
  }
  return value;
}

/** Body as a plain object ({} when missing or not an object). */
export function bodyObject(req: DemoRequest): Record<string, any> {
  const body = req.body;
  return body && typeof body === 'object' && !Array.isArray(body) ? (body as Record<string, any>) : {};
}
