/**
 * Demo request dispatcher.
 *
 * dispatch() parses the request, resolves the current user from the bearer
 * token, picks the domain route table by the FIRST path segment, and runs the
 * first matching route (array order). Errors become Nest-style JSON:
 * unmatched -> 404 (logged with console.warn), thrown -> 500 (console.error),
 * DemoHttpError -> its status. Successful non-GET requests are persisted.
 */

import { userFromToken } from './auth-token';
import { getDb, saveDb } from './db';
import {
  fail,
  isDemoHttpError,
  matchRoute,
  normalizePath,
  splitPath,
  type DemoRequest,
  type DemoResult,
  type DemoRoute,
  type HttpMethod,
  type NestErrorBody,
} from './http';
import { routes as attendanceRoutes } from './handlers/attendance';
import { routes as authUsersRoutes } from './handlers/auth-users';
import { routes as batchesTeamsRoutes } from './handlers/batches-teams';
import { routes as internsRoutes } from './handlers/interns';
import { routes as issuesRoutes } from './handlers/issues';
import { routes as reportsRoutes } from './handlers/reports';

/** First path segment -> domain route table. */
const ROUTE_TABLES: Record<string, DemoRoute[]> = {
  auth: authUsersRoutes,
  users: authUsersRoutes,
  batches: batchesTeamsRoutes,
  teams: batchesTeamsRoutes,
  dashboard: batchesTeamsRoutes,
  interns: internsRoutes,
  issues: issuesRoutes,
  repositories: issuesRoutes,
  'issue-assignments': issuesRoutes,
  reports: reportsRoutes,
  attendance: attendanceRoutes,
};

export interface DispatchInput {
  method: string;
  /** Absolute URL starting with DEMO_API_BASE. */
  url: string;
  /** Header map (any key case). */
  headers: Record<string, string>;
  /** Raw request body text, or null. */
  bodyText: string | null;
}

function parseBody(text: string | null): unknown {
  if (text === null || text === '') {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function lowerCaseHeaders(headers: Record<string, string>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    result[key.toLowerCase()] = value;
  }
  return result;
}

function withErrorPath(result: DemoResult, url: URL): DemoResult {
  const body = result.body as Partial<NestErrorBody> | null;
  if (result.status >= 400 && body && typeof body === 'object' && 'statusCode' in body && !body.path) {
    return { status: result.status, body: { ...body, path: `${url.pathname}${url.search}` } };
  }
  return result;
}

export function routeTableFor(path: string): DemoRoute[] | null {
  const [first] = splitPath(path);
  return first ? ROUTE_TABLES[first] ?? null : null;
}

export async function dispatch(input: DispatchInput): Promise<DemoResult> {
  const method = input.method.toUpperCase() as HttpMethod;
  let url: URL;

  try {
    url = new URL(input.url);
  } catch {
    return fail(400, `Invalid URL: ${input.url}`, 'Bad Request');
  }

  const path = normalizePath(url.pathname);
  const table = routeTableFor(path) ?? [];

  let matched: { route: DemoRoute; params: Record<string, string> } | null = null;
  for (const route of table) {
    if (route.method !== method) continue;
    const params = matchRoute(route.pattern, path);
    if (params) {
      matched = { route, params };
      break;
    }
  }

  if (!matched) {
    console.warn('[demo] unhandled', method, path);
    return withErrorPath(fail(404, `Cannot ${method} ${path}`, 'Not Found'), url);
  }

  const db = getDb();
  const headers = lowerCaseHeaders(input.headers);
  const request: DemoRequest = {
    method,
    url,
    path,
    query: url.searchParams,
    body: parseBody(input.bodyText),
    rawBody: input.bodyText,
    headers,
    currentUser: userFromToken(db, headers.authorization ?? null),
    db,
    params: matched.params,
  };

  let result: DemoResult;
  try {
    result = await matched.route.handle(request);
  } catch (error) {
    if (isDemoHttpError(error)) {
      result = fail(error.status, error.messages, error.error);
    } else {
      console.error('[demo] handler error', method, path, error);
      const message = error instanceof Error ? error.message : 'Internal server error';
      result = fail(500, message, 'Internal Server Error');
    }
  }

  if (method !== 'GET' && result.status < 400) {
    saveDb(db);
  }

  return withErrorPath(result, url);
}
