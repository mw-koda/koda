/**
 * Demo handlers: AUTH + USERS (spec: specs/auth-users.md).
 *
 * Endpoints this domain owns (first path segment 'auth' or 'users'):
 * - GET   /auth/me              { user: MeUser } (JwtStrategy.validate flattening
 *                               plus the staff demo deviation, see buildMeUser).
 *                               401 only here: 'No auth token' (no bearer token),
 *                               'jwt malformed' (not a demo token), 'User not found'.
 * - GET   /users                ?role= (exact; invalid -> 400 IsEnum message)
 *                               &search= (trimmed, ci substring over
 *                               github_username/name/email); created_at DESC;
 *                               bare UserDto[] (includes the demo-only stored status).
 * - POST  /users/onboard        { githubUsername, role? = 'intern' } -> exact-case
 *                               lookup; existing: role, is_onboarded=true,
 *                               name ?? username; else insert { github_username,
 *                               name: username, role, is_onboarded: true,
 *                               github_id/email/avatar_url/school_name null }.
 *                               201 UserDto (carries the real id; the admin UI
 *                               PATCHes it right after).
 * - PATCH /users/:id            { name?, githubUsername?, role?, status? } (strings
 *                               trimmed; uuid param -> 400 'Validation failed (uuid
 *                               is expected)'). status -> is_onboarded = status ===
 *                               'active'; 'inactive' is also stored in users.status
 *                               (demo-only) so it survives a reload. updated_at is
 *                               not touched (no trigger on the real table). 200 UserDto.
 * NOT here: POST /interns/join lives in handlers/interns.ts (router sends every
 * '/interns/*' path there).
 *
 * Role guards (admin/team_lead only on /users) are permissive in demo mode:
 * any caller gets 200. Never 401/403 except GET /auth/me.
 */

import {
  bodyObject,
  conflict,
  created,
  DemoHttpError,
  fail,
  notFound,
  ok,
  queryString,
  uuidParam,
  type DemoRoute,
} from '../http';
import { ids, newId } from '../ids';
import {
  batchById,
  defaultBatchId,
  teamById,
  userById,
  userByUsername,
  userContext,
  userRow,
  type UserDto,
} from '../lookups';
import { nowIso } from '../time';
import type { DemoDb, Role, UserRow, UserStatus } from '../types';

export type MeUser = UserDto & {
  intern_id: string | null;
  batch_id: string | null;
  school: string | null;
  team_id: string | null;
  team_name: string | null;
};

const DEFAULT_COORDINATOR_SCHOOL = 'Cebu Institute of Technology University';

/** Role enum values in backend declaration order (class-validator message order). */
const ROLES: readonly Role[] = ['admin', 'coordinator', 'team_lead', 'intern'];
const STATUSES: readonly UserStatus[] = ['active', 'pending', 'inactive'];

const ROLE_MESSAGE = `role must be one of the following values: ${ROLES.join(', ')}`;
const STATUS_MESSAGE = `status must be one of the following values: ${STATUSES.join(', ')}`;

function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value);
}

function isStatus(value: unknown): value is UserStatus {
  return typeof value === 'string' && (STATUSES as readonly string[]).includes(value);
}

/** ValidationPipe failure: 400 with the class-validator message array. */
function validationError(messages: string[]): DemoHttpError {
  return new DemoHttpError(400, messages, 'Bad Request');
}

/** Millisecond timestamp for sorting (unparsable values sort last). */
function timeOf(value: string | null | undefined): number {
  const ms = value ? Date.parse(value) : Number.NaN;
  return Number.isFinite(ms) ? ms : Number.NEGATIVE_INFINITY;
}

/**
 * Demo-only users.status: only 'inactive' is stored, because 'active' and
 * 'pending' are exactly what the UI derives from is_onboarded. That way a later
 * POST /interns/join (is_onboarded=true) or onboard still flips the badge.
 */
function applyStatus(user: UserRow, status: UserStatus): void {
  user.is_onboarded = status === 'active';
  if (status === 'inactive') {
    user.status = 'inactive';
  } else {
    delete user.status;
  }
}

/** Batch of the first team the user leads (team_members role 'team_lead'). */
function ledTeamBatchId(db: DemoDb, userId: string): string | null {
  for (const member of db.team_members) {
    if (member.user_id !== userId || member.role !== 'team_lead') continue;
    const batchId = teamById(db, member.team_id)?.batch_id ?? null;
    if (batchId && batchById(db, batchId)) return batchId;
  }
  return null;
}

/**
 * The /auth/me user: JwtStrategy.validate flattening (intern row, its batch,
 * school, the role-'intern' team membership), computed live from the db so
 * joins, team adds and role edits show up on the next call.
 *
 * DEMO DEVIATION for staff so the coordinator gatekeeper modal never appears
 * (the real backend returns batch_id null for every non-intern):
 * - coordinator: batch_id = B1 (default batch), school_name = column or CIT-U.
 * - team_lead: batch_id = batch of the first team they lead (else B1).
 * Admins keep the real shape (all joins null).
 */
export function buildMeUser(db: DemoDb, user: UserRow): MeUser {
  const context = userContext(db, user);
  const me: MeUser = {
    ...userRow(user),
    intern_id: context.internId,
    batch_id: context.batchId,
    school: context.school,
    team_id: context.teamId,
    team_name: context.teamName,
  };

  if (user.role === 'coordinator') {
    me.batch_id = me.batch_id ?? defaultBatchId(db);
    me.school_name = me.school_name ?? DEFAULT_COORDINATOR_SCHOOL;
  } else if (user.role === 'team_lead') {
    me.batch_id = me.batch_id ?? ledTeamBatchId(db, user.id) ?? defaultBatchId(db);
  }

  return me;
}

/** Bearer token from an Authorization header value, or null. */
function bearerToken(header: string | undefined): string | null {
  if (!header) return null;
  const match = header.match(/^\s*Bearer\s+(\S+)\s*$/i);
  return match ? match[1] : null;
}

export const routes: DemoRoute[] = [
  // GET /auth/me ------------------------------------------------------------
  {
    method: 'GET',
    pattern: '/auth/me',
    handle: (req) => {
      if (req.currentUser) {
        return ok({ user: buildMeUser(req.db, req.currentUser) });
      }

      // passport-jwt / JwtStrategy messages. The UI treats every 401 the same.
      const token = bearerToken(req.headers.authorization);
      if (!token) {
        return fail(401, 'No auth token', 'Unauthorized');
      }
      if (!token.startsWith('demo.')) {
        return fail(401, 'jwt malformed', 'Unauthorized');
      }
      return fail(401, 'User not found', 'Unauthorized');
    },
  },

  // GET /users ---------------------------------------------------------------
  {
    method: 'GET',
    pattern: '/users',
    handle: (req) => {
      // Empty ?role= / ?search= count as missing (lenient; the UI never sends them).
      const role = queryString(req.query, 'role');
      if (role !== undefined && !isRole(role)) {
        throw validationError([ROLE_MESSAGE]);
      }

      const search = queryString(req.query, 'search')?.toLowerCase();

      const users = [...req.db.users]
        .sort((a, b) => timeOf(b.created_at) - timeOf(a.created_at))
        .filter((user) => {
          if (role && user.role !== role) {
            return false;
          }
          if (!search) {
            return true;
          }
          return [user.github_username, user.name, user.email].some(
            (value) => value?.toLowerCase().includes(search) ?? false
          );
        });

      return ok(users.map(userRow));
    },
  },

  // POST /users/onboard ------------------------------------------------------
  {
    method: 'POST',
    pattern: '/users/onboard',
    handle: (req) => {
      const body = bodyObject(req);
      const rawUsername: unknown = body.githubUsername;
      const githubUsername = typeof rawUsername === 'string' ? rawUsername.trim() : rawUsername;
      const errors: string[] = [];

      if (githubUsername === undefined || githubUsername === null || githubUsername === '') {
        errors.push('githubUsername should not be empty');
      }
      if (typeof githubUsername !== 'string') {
        errors.push('githubUsername must be a string');
      }
      if (body.role !== undefined && body.role !== null && !isRole(body.role)) {
        errors.push(ROLE_MESSAGE);
      }
      if (errors.length || typeof githubUsername !== 'string') {
        throw validationError(errors);
      }

      const role: Role = isRole(body.role) ? body.role : 'intern';
      const db = req.db;

      const existing = userByUsername(db, githubUsername);
      if (existing) {
        existing.role = role;
        existing.name = existing.name ?? githubUsername;
        applyStatus(existing, 'active');
        return created(userRow(existing));
      }

      const stableId = ids.user(githubUsername);
      const timestamp = nowIso();
      const user: UserRow = {
        id: userById(db, stableId) ? newId() : stableId,
        github_id: null,
        github_username: githubUsername,
        name: githubUsername,
        email: null,
        avatar_url: null,
        role,
        is_onboarded: true,
        school_name: null,
        created_at: timestamp,
        updated_at: timestamp,
      };
      db.users.push(user);

      return created(userRow(user));
    },
  },

  // PATCH /users/:id ---------------------------------------------------------
  {
    method: 'PATCH',
    pattern: '/users/:id',
    handle: (req) => {
      const id = uuidParam(req, 'id');
      const body = bodyObject(req);
      const errors: string[] = [];

      // null counts as "not provided" (IsOptional), so a name is never nulled out.
      const provided = (key: string) => body[key] !== undefined && body[key] !== null;
      const trimmed = (key: string): string | undefined =>
        typeof body[key] === 'string' ? (body[key] as string).trim() : undefined;

      if (provided('name') && typeof body.name !== 'string') {
        errors.push('name must be a string');
      }
      if (provided('githubUsername')) {
        if (typeof body.githubUsername !== 'string') {
          errors.push('githubUsername must be a string');
        } else if (!body.githubUsername.trim()) {
          // Demo guard: the real DTO allows '', which would orphan the account.
          errors.push('githubUsername should not be empty');
        }
      }
      if (provided('role') && !isRole(body.role)) {
        errors.push(ROLE_MESSAGE);
      }
      if (provided('status') && !isStatus(body.status)) {
        errors.push(STATUS_MESSAGE);
      }
      if (errors.length) {
        throw validationError(errors);
      }

      const db = req.db;
      const user = userById(db, id);
      if (!user) {
        // Real backend: .single() fails -> 500 'Failed to update user'.
        return notFound('Failed to update user');
      }

      const name = trimmed('name');
      const githubUsername = trimmed('githubUsername');

      if (githubUsername !== undefined && githubUsername !== user.github_username) {
        const taken = db.users.find((other) => other.id !== user.id && other.github_username === githubUsername);
        if (taken) {
          return conflict(`GitHub username @${githubUsername} is already used by another user.`);
        }
      }

      if (name !== undefined) {
        user.name = name;
      }
      if (githubUsername !== undefined) {
        user.github_username = githubUsername;
      }
      if (isRole(body.role)) {
        user.role = body.role;
      }
      if (isStatus(body.status)) {
        applyStatus(user, body.status);
      }

      return ok(userRow(user));
    },
  },
];
