/**
 * Demo handlers: BATCHES + TEAMS (+ dashboard) (spec: specs/batches-teams.md).
 *
 * Mirrors koda-backend src/batches/batches.service.ts, src/teams/teams.service.ts
 * and src/dashboard/dashboard.service.ts on the shared demo tables. Every
 * derived value (enrolledCount, status, dashboard metrics, relative times) is
 * computed at request time.
 *
 * Routes (first segment 'batches' | 'teams' | 'dashboard'):
 * - GET    /batches                    ?search= (ci substring over name/description).
 *                                      BatchSummary[] newest createdAt first.
 * - POST   /batches                    201 BatchDetail (title-cased name, joinCode kept or
 *                                      generated, enrolledCount 0).
 * - GET    /batches/:id                BatchDetail (assignedInterns by assigned_at asc).
 * - PATCH  /batches/:id                BatchDetail (unused by the UI).
 * - POST   /batches/:id/interns        201 BatchDetail (unused by the UI).
 * - GET    /teams                      ?batchId= TeamDetail[] newest createdAt first.
 * - POST   /teams                      201 TeamDetail (lead added as 'team_lead').
 * - GET    /teams/:id/dashboard        TeamDashboardData (interns via interns.team_id).
 * - POST   /teams/:id/members          201 TeamDetail.
 * - DELETE /teams/:id/members/:userId  200 TeamDetail (full JSON body, never 204).
 * - GET    /teams/:id                  TeamDetail.
 * - GET    /dashboard/stats, /dashboard/activity  (no UI consumer; minimal mirrors).
 *
 * DEMO DEVIATIONS (all to keep the recorded screens working, never 401/403):
 * - Role checks are permissive: every role gets 200. GET /teams for a team_lead
 *   returns teams they created OR lead (the seed's teams are all admin-created).
 * - POST /teams validates the team lead BEFORE inserting (no orphan team on error).
 * - POST /teams/:id/members does not reject interns without an intern record or
 *   enrolled in another batch (the team-management page blanks itself on any
 *   error). For role 'intern' it keeps interns.team_id in sync and MOVES the
 *   intern: their 'intern' memberships in other teams are removed, so
 *   team_members and interns.team_id always agree. DELETE clears / recomputes
 *   interns.team_id when the intern leaves.
 * - Body validation mirrors the DTO messages but does not reject unknown
 *   properties (forbidNonWhitelisted); they are ignored.
 */

import { DemoHttpError, bodyObject, created, ok, queryString, uuidParam, type DemoRoute } from '../http';
import { ids, isUuid, newId } from '../ids';
import {
  batchById,
  internById,
  internByUserId,
  internTeamMembership,
  issueById,
  repoForIssue,
  teamById,
  teamMembers,
  userById,
} from '../lookups';
import { nowIso, relativeTimeShort } from '../time';
import type {
  BatchRow,
  DemoDb,
  GitHubLabel,
  IssueRow,
  IssueState,
  Role,
  TeamMemberRow,
  TeamRow,
  UserRow,
} from '../types';

// ---------------------------------------------------------------------------
// Response DTOs (lib/api/batches.ts, lib/api/teams.ts)
// ---------------------------------------------------------------------------

export type BatchStatus = 'active' | 'completed';

export interface BatchSummaryDto {
  id: string;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string;
  maxInterns: number;
  enrolledCount: number;
  availableSlots: number;
  isFull: boolean;
  status: BatchStatus;
  joinCode: string;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface AssignedInternDto {
  /** interns.id */
  id: string;
  assignedAt: string | null;
  userId: string | null;
  teamId: string | null;
  name: string | null;
  email: string | null;
  githubUsername: string | null;
}

export interface BatchDetailDto extends BatchSummaryDto {
  assignedInterns: AssignedInternDto[];
}

export interface TeamMemberDto {
  /** team_members.id (React key only) */
  id: string;
  /** users.id */
  userId: string;
  /** role within the team */
  role: Role;
  githubUsername: string | null;
  name: string | null;
  email: string | null;
  /** users.role */
  userRole: Role | null;
}

export interface TeamCreatorDto {
  id: string;
  githubUsername: string | null;
  name: string | null;
  email: string | null;
  role: Role | null;
}

export interface TeamDetailDto {
  id: string;
  name: string;
  batchId: string | null;
  createdBy: TeamCreatorDto | null;
  createdAt: string | null;
  members: TeamMemberDto[];
  memberCount: number;
}

export interface TeamDashboardMetricsDto {
  openIssues: number;
  inProgressIssues: number;
  closedIssues: number;
  highPriorityIssues: number;
}

export interface TeamDashboardRecentIssueDto {
  id: string;
  title: string;
  repo: string;
  user: string;
  status: IssueState;
}

export interface TeamDashboardLogDto {
  type: string;
  message: string;
  time: string;
  timestamp: string;
}

export interface TeamDashboardDto {
  team: TeamDetailDto;
  metrics: TeamDashboardMetricsDto;
  recentIssues: TeamDashboardRecentIssueDto[];
  logs: TeamDashboardLogDto[];
}

type ActivityType = 'report_submitted' | 'issue_opened' | 'issue_closed' | 'evaluation_added';

interface DashboardActivityDto {
  type: ActivityType;
  description: string;
  date: string;
  internId: string | null;
  teamId: string | null;
}

// ---------------------------------------------------------------------------
// Errors + DTO validation (class-validator messages, bottom decorator first)
// ---------------------------------------------------------------------------

const ROLE_VALUES: Role[] = ['admin', 'coordinator', 'team_lead', 'intern'];

/** class-validator IsUUID() ('all'): any version nibble. */
const LOOSE_UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** class-validator IsUUID('4'). */
const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Rough IsDateString (ISO 8601 date or date-time). */
const ISO_DATE_REGEX =
  /^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?(?:Z|[+-]\d{2}(?::?\d{2})?)?)?$/i;

const JOIN_CODE_REGEX = /^[A-Z0-9]{6,}$/;
const JOIN_CODE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/** teams.service.ts isHighPriority pattern. */
const HIGH_PRIORITY_REGEX = /(\bhigh\b|\bp0\b|\bp1\b|\bcritical\b|\bsev1\b|priority[:\s_-]*high)/i;

function badRequestError(message: string | string[]): DemoHttpError {
  return new DemoHttpError(400, message, 'Bad Request');
}

function notFoundError(message: string): DemoHttpError {
  return new DemoHttpError(404, message, 'Not Found');
}

function conflictError(message: string): DemoHttpError {
  return new DemoHttpError(409, message, 'Conflict');
}

function throwIfInvalid(messages: string[]): void {
  if (messages.length > 0) {
    throw badRequestError(messages);
  }
}

function isPresent(value: unknown): boolean {
  return value !== undefined && value !== null;
}

function isDateString(value: unknown): boolean {
  return typeof value === 'string' && ISO_DATE_REGEX.test(value) && !Number.isNaN(new Date(value).getTime());
}

/** enableImplicitConversion / @Type(() => Number) for numeric DTO fields. */
function toNumberLike(value: unknown): unknown {
  if (typeof value === 'string' && value.trim() !== '') {
    return Number(value);
  }
  return value;
}

/** @IsInt() @Min(min) messages (Min first, like Nest's output order). */
function intMessages(field: string, value: unknown, min: number): string[] {
  const messages: string[] = [];
  const isNumber = typeof value === 'number' && !Number.isNaN(value);
  if (!(isNumber && (value as number) >= min)) {
    messages.push(`${field} must not be less than ${min}`);
  }
  if (!(isNumber && Number.isInteger(value))) {
    messages.push(`${field} must be an integer number`);
  }
  return messages;
}

function maxLengthMessages(field: string, value: unknown, max: number): string[] {
  const messages: string[] = [];
  if (!(typeof value === 'string' && value.length <= max)) {
    messages.push(`${field} must be shorter than or equal to ${max} characters`);
  }
  if (typeof value !== 'string') {
    messages.push(`${field} must be a string`);
  }
  return messages;
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function toTime(value: string | null | undefined): number {
  if (!value) return 0;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

/** created_at DESC (stable). */
function byCreatedDesc<T extends { created_at: string | null }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => toTime(b.created_at) - toTime(a.created_at));
}

/** First admin user, used as the actor when a request carries no known user. */
function fallbackActor(db: DemoDb): UserRow | null {
  return userById(db, ids.user('michaelt')) ?? db.users.find((user) => user.role === 'admin') ?? null;
}

function requireBatch(db: DemoDb, id: string): BatchRow {
  const batch = batchById(db, id);
  if (!batch) {
    throw notFoundError('Batch not found.');
  }
  return batch;
}

function requireTeam(db: DemoDb, id: string): TeamRow {
  const team = teamById(db, id);
  if (!team) {
    throw notFoundError('Team not found.');
  }
  return team;
}

function requireUser(db: DemoDb, id: string): UserRow {
  const user = userById(db, id);
  if (!user) {
    throw notFoundError('User not found.');
  }
  return user;
}

// ---------------------------------------------------------------------------
// Batches
// ---------------------------------------------------------------------------

function enrolledCount(db: DemoDb, batchId: string): number {
  return db.batch_interns.filter((row) => row.batch_id === batchId).length;
}

/** batches.service.ts computeStatus: 'completed' iff now > new Date(endDate). */
function computeStatus(endDate: string): BatchStatus {
  return new Date() > new Date(endDate) ? 'completed' : 'active';
}

export function mapBatchSummary(batch: BatchRow, count: number): BatchSummaryDto {
  return {
    id: batch.id,
    name: batch.name,
    description: batch.description,
    startDate: batch.start_date,
    endDate: batch.end_date,
    maxInterns: batch.max_interns,
    enrolledCount: count,
    availableSlots: Math.max(batch.max_interns - count, 0),
    isFull: count >= batch.max_interns,
    status: computeStatus(batch.end_date),
    joinCode: batch.join_code,
    createdAt: batch.created_at ?? null,
    updatedAt: batch.updated_at ?? null,
  };
}

function assignedInterns(db: DemoDb, batchId: string): AssignedInternDto[] {
  return db.batch_interns
    .filter((row) => row.batch_id === batchId)
    .sort((a, b) => toTime(a.assigned_at) - toTime(b.assigned_at))
    .map((row) => {
      const intern = internById(db, row.intern_id);
      const user = intern ? userById(db, intern.user_id) : null;
      return {
        id: row.intern_id,
        assignedAt: row.assigned_at ?? null,
        userId: intern?.user_id ?? null,
        teamId: intern?.team_id ?? null,
        name: user?.name ?? null,
        email: user?.email ?? null,
        githubUsername: user?.github_username ?? null,
      };
    });
}

export function buildBatchDetail(db: DemoDb, batch: BatchRow): BatchDetailDto {
  const interns = assignedInterns(db, batch.id);
  return {
    ...mapBatchSummary(batch, enrolledCount(db, batch.id)),
    assignedInterns: interns,
  };
}

function titleCaseWords(value: string): string {
  return value
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function normalizeDate(value: unknown): string {
  if (!value || (typeof value !== 'string' && !(value instanceof Date))) {
    throw badRequestError('startDate and endDate are required.');
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw badRequestError('One or more dates are invalid.');
  }
  return parsed.toISOString().slice(0, 10);
}

function normalizePositiveInteger(value: unknown, fieldName: string): number {
  if (value === undefined || value === null) {
    throw badRequestError(`${fieldName} is required.`);
  }
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    throw badRequestError(`${fieldName} must be a positive integer.`);
  }
  return value;
}

function assertDateRange(startDate: string, endDate: string): void {
  if (new Date(startDate) > new Date(endDate)) {
    throw badRequestError('startDate must be on or before endDate.');
  }
}

interface BatchPayloadInput {
  name?: unknown;
  description?: unknown;
  startDate?: unknown;
  endDate?: unknown;
  maxInterns?: unknown;
}

/** batches.service.ts buildBatchPayload (without join_code). */
function buildBatchPayload(input: BatchPayloadInput): Pick<
  BatchRow,
  'name' | 'description' | 'start_date' | 'end_date' | 'max_interns'
> {
  const rawName = typeof input.name === 'string' ? input.name.trim() : '';
  if (!rawName) {
    throw badRequestError('Batch name is required.');
  }

  const description = typeof input.description === 'string' ? input.description.trim() : '';

  return {
    name: titleCaseWords(rawName),
    description: description || null,
    start_date: normalizeDate(input.startDate),
    end_date: normalizeDate(input.endDate),
    max_interns: normalizePositiveInteger(input.maxInterns, 'maxInterns'),
  };
}

function joinCodeTaken(db: DemoDb, code: string, exceptBatchId?: string): boolean {
  const normalized = code.toUpperCase();
  return db.batches.some((batch) => batch.id !== exceptBatchId && batch.join_code.toUpperCase() === normalized);
}

function generateJoinCode(db: DemoDb): string {
  for (let attempt = 0; attempt < 50; attempt++) {
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += JOIN_CODE_CHARS.charAt(Math.floor(Math.random() * JOIN_CODE_CHARS.length));
    }
    if (!joinCodeTaken(db, code)) {
      return code;
    }
  }
  return `K${Date.now().toString(36).toUpperCase().slice(-7)}`;
}

function uniqueId(existing: Array<{ id: string }>): string {
  let id = newId();
  while (existing.some((row) => row.id === id)) {
    id = newId();
  }
  return id;
}

/** CreateBatchDto validation. */
function validateCreateBatch(body: Record<string, any>): void {
  const errors: string[] = [];

  if (body.name === undefined || body.name === null || body.name === '') {
    errors.push('name should not be empty');
  }
  if (typeof body.name !== 'string') {
    errors.push('name must be a string');
  }
  if (isPresent(body.description) && typeof body.description !== 'string') {
    errors.push('description must be a string');
  }
  if (!isDateString(body.startDate)) {
    errors.push('startDate must be a valid ISO 8601 date string');
  }
  if (!isDateString(body.endDate)) {
    errors.push('endDate must be a valid ISO 8601 date string');
  }
  errors.push(...intMessages('maxInterns', body.maxInterns, 1));
  if (isPresent(body.joinCode)) {
    if (typeof body.joinCode !== 'string' || !JOIN_CODE_REGEX.test(body.joinCode)) {
      errors.push('joinCode must be uppercase alphanumeric with at least 6 characters');
    }
    if (typeof body.joinCode !== 'string') {
      errors.push('joinCode must be a string');
    }
  }

  throwIfInvalid(errors);
}

/** UpdateBatchDto validation (all optional). */
function validateUpdateBatch(body: Record<string, any>): void {
  const errors: string[] = [];

  if (isPresent(body.name)) {
    if (body.name === '') errors.push('name should not be empty');
    if (typeof body.name !== 'string') errors.push('name must be a string');
  }
  if (isPresent(body.description) && typeof body.description !== 'string') {
    errors.push('description must be a string');
  }
  if (isPresent(body.startDate) && !isDateString(body.startDate)) {
    errors.push('startDate must be a valid ISO 8601 date string');
  }
  if (isPresent(body.endDate) && !isDateString(body.endDate)) {
    errors.push('endDate must be a valid ISO 8601 date string');
  }
  if (isPresent(body.maxInterns)) {
    errors.push(...intMessages('maxInterns', body.maxInterns, 1));
  }

  throwIfInvalid(errors);
}

const batchRoutes: DemoRoute[] = [
  {
    method: 'GET',
    pattern: '/batches',
    handle: (req) => {
      const search = queryString(req.query, 'search')?.toLowerCase();
      let rows = req.db.batches;

      if (search) {
        rows = rows.filter(
          (batch) =>
            batch.name.toLowerCase().includes(search) ||
            (batch.description ?? '').toLowerCase().includes(search)
        );
      }

      return ok(byCreatedDesc(rows).map((batch) => mapBatchSummary(batch, enrolledCount(req.db, batch.id))));
    },
  },
  {
    method: 'POST',
    pattern: '/batches',
    handle: (req) => {
      const db = req.db;
      const body = bodyObject(req);
      const input: Record<string, any> = { ...body, maxInterns: toNumberLike(body.maxInterns) };
      validateCreateBatch(input);

      const payload = buildBatchPayload(input);
      const joinCode =
        (typeof input.joinCode === 'string' ? input.joinCode.trim() : '') || generateJoinCode(db);
      assertDateRange(payload.start_date, payload.end_date);

      if (joinCodeTaken(db, joinCode)) {
        throw badRequestError('duplicate key value violates unique constraint "batches_join_code_key"');
      }

      const timestamp = nowIso();
      const batch: BatchRow = {
        id: uniqueId(db.batches),
        ...payload,
        join_code: joinCode,
        created_at: timestamp,
        updated_at: timestamp,
      };
      db.batches.push(batch);

      return created(buildBatchDetail(db, batch));
    },
  },
  {
    method: 'POST',
    pattern: '/batches/:id/interns',
    handle: (req) => {
      const db = req.db;
      const batchId = uuidParam(req, 'id');
      const body = bodyObject(req);
      const rawIds: unknown = body.internIds;

      const errors: string[] = [];
      if (!Array.isArray(rawIds) || rawIds.some((value) => !(typeof value === 'string' && LOOSE_UUID_REGEX.test(value)))) {
        errors.push('each value in internIds must be a UUID');
      }
      if (!Array.isArray(rawIds) || rawIds.length === 0) {
        errors.push('internIds should not be empty');
      }
      if (!Array.isArray(rawIds)) {
        errors.push('internIds must be an array');
      }
      throwIfInvalid(errors);

      const internIds = Array.from(new Set(rawIds as string[]));
      if (internIds.length === 0) {
        throw badRequestError('At least one intern ID is required.');
      }

      const batch = requireBatch(db, batchId);
      if (enrolledCount(db, batchId) + internIds.length > batch.max_interns) {
        throw badRequestError('Batch capacity would be exceeded.');
      }

      const missing = internIds.filter((internId) => !internById(db, internId));
      if (missing.length > 0) {
        throw badRequestError(`The following interns were not found: ${missing.join(', ')}`);
      }

      const existing = db.batch_interns.filter((row) => internIds.includes(row.intern_id));
      if (existing.length > 0) {
        const elsewhere = existing.filter((row) => row.batch_id !== batchId).map((row) => row.intern_id);
        if (elsewhere.length > 0) {
          throw conflictError(`These interns are already assigned to a batch: ${elsewhere.join(', ')}`);
        }
        throw conflictError('One or more interns are already assigned to this batch.');
      }

      const assignedAt = nowIso();
      for (const internId of internIds) {
        db.batch_interns.push({
          id: uniqueId(db.batch_interns),
          batch_id: batchId,
          intern_id: internId,
          assigned_at: assignedAt,
        });
      }

      return created(buildBatchDetail(db, batch));
    },
  },
  {
    method: 'GET',
    pattern: '/batches/:id',
    handle: (req) => {
      const batch = requireBatch(req.db, uuidParam(req, 'id'));
      return ok(buildBatchDetail(req.db, batch));
    },
  },
  {
    method: 'PATCH',
    pattern: '/batches/:id',
    handle: (req) => {
      const db = req.db;
      const batchId = uuidParam(req, 'id');
      const body = bodyObject(req);
      const input: Record<string, any> = { ...body, maxInterns: toNumberLike(body.maxInterns) };
      validateUpdateBatch(input);

      const batch = requireBatch(db, batchId);
      const payload = buildBatchPayload({
        name: input.name ?? batch.name,
        description: input.description === undefined ? batch.description ?? undefined : input.description,
        startDate: input.startDate ?? batch.start_date,
        endDate: input.endDate ?? batch.end_date,
        maxInterns: input.maxInterns ?? batch.max_interns,
      });
      assertDateRange(payload.start_date, payload.end_date);

      if (payload.max_interns < enrolledCount(db, batchId)) {
        throw badRequestError('Max interns cannot be lower than the current enrolled count.');
      }

      Object.assign(batch, payload, { updated_at: nowIso() });
      return ok(buildBatchDetail(db, batch));
    },
  },
];

// ---------------------------------------------------------------------------
// Teams
// ---------------------------------------------------------------------------

function memberDto(db: DemoDb, member: TeamMemberRow): TeamMemberDto {
  const user = userById(db, member.user_id);
  return {
    id: member.id,
    userId: member.user_id,
    role: member.role,
    githubUsername: user?.github_username ?? null,
    name: user?.name ?? null,
    email: user?.email ?? null,
    userRole: user?.role ?? null,
  };
}

/** teams.service.ts findOne mapping. Members keep team_members insertion order. */
export function buildTeamDetail(db: DemoDb, team: TeamRow): TeamDetailDto {
  const creator = userById(db, team.created_by);
  const members = teamMembers(db, team.id).map((member) => memberDto(db, member));

  return {
    id: team.id,
    name: team.name,
    batchId: team.batch_id ?? null,
    createdBy: creator
      ? {
          id: creator.id,
          githubUsername: creator.github_username ?? null,
          name: creator.name ?? null,
          email: creator.email ?? null,
          role: creator.role ?? null,
        }
      : null,
    createdAt: team.created_at ?? null,
    members,
    memberCount: members.length,
  };
}

function leadsTeam(db: DemoDb, userId: string, teamId: string): boolean {
  return db.team_members.some(
    (member) => member.team_id === teamId && member.user_id === userId && member.role === 'team_lead'
  );
}

/**
 * GET /teams scoping: admins (and, permissively, every non-team-lead role)
 * see all teams; a team_lead sees teams they created or lead.
 */
function visibleTeams(db: DemoDb, actor: UserRow | null, batchId: string | undefined): TeamRow[] {
  let rows = db.teams;

  if (batchId) {
    rows = rows.filter((team) => team.batch_id === batchId);
  }

  if (actor?.role === 'team_lead') {
    rows = rows.filter((team) => team.created_by === actor.id || leadsTeam(db, actor.id, team.id));
  }

  return byCreatedDesc(rows);
}

/** Remove every team_members row matching the predicate (in place). */
function removeMembers(db: DemoDb, predicate: (member: TeamMemberRow) => boolean): TeamMemberRow[] {
  const removed: TeamMemberRow[] = [];
  for (let i = db.team_members.length - 1; i >= 0; i--) {
    if (predicate(db.team_members[i])) {
      removed.unshift(db.team_members[i]);
      db.team_members.splice(i, 1);
    }
  }
  return removed;
}

// --- team dashboard (teams.service.ts getDashboard) ---

interface DashboardIssue {
  id: string;
  title: string;
  repo: string;
  user: string;
  status: IssueState;
  createdAt: string | null;
  updatedAt: string | null;
  closedAt: string | null;
  assignedAt: string | null;
  labels: GitHubLabel[];
  rawPayload: Record<string, unknown> | null;
}

function repoFullName(db: DemoDb, issue: IssueRow): string {
  const repo = repoForIssue(db, issue);
  const fullName = repo?.full_name ?? (issue.repo_id && !isUuid(issue.repo_id) ? issue.repo_id : '');
  return fullName.trim() || 'Unknown repository';
}

/** issue_assignments for the interns, assigned_at DESC (nulls first), deduped by issue (first row wins). */
function teamIssues(db: DemoDb, internIds: Set<string>): DashboardIssue[] {
  const assignedAtSortKey = (value: string | null | undefined): number =>
    value ? toTime(value) : Number.POSITIVE_INFINITY;

  const rows = db.issue_assignments
    .filter((assignment) => internIds.has(assignment.intern_id))
    .sort((a, b) => assignedAtSortKey(b.assigned_at) - assignedAtSortKey(a.assigned_at));

  const unique = new Map<string, DashboardIssue>();

  for (const assignment of rows) {
    if (unique.has(assignment.issue_id)) continue;

    // issues!inner + interns!inner: both rows must exist.
    const issue = issueById(db, assignment.issue_id);
    const intern = internById(db, assignment.intern_id);
    if (!issue || !intern) continue;

    const user = userById(db, intern.user_id);
    const userName = user?.name?.trim() || user?.github_username?.trim() || 'Unassigned';

    unique.set(assignment.issue_id, {
      id: issue.id,
      title: (issue.title ?? '').trim() || 'Untitled issue',
      repo: repoFullName(db, issue),
      user: userName,
      status: issue.state,
      createdAt: issue.created_at ?? null,
      updatedAt: issue.updated_at ?? null,
      closedAt: issue.closed_at ?? null,
      assignedAt: assignment.assigned_at ?? null,
      labels: Array.isArray(issue.labels) ? issue.labels : [],
      rawPayload: issue.raw_payload ?? null,
    });
  }

  const activityTime = (issue: DashboardIssue): number =>
    toTime(issue.updatedAt || issue.assignedAt || issue.createdAt || issue.closedAt);

  return Array.from(unique.values()).sort((a, b) => activityTime(b) - activityTime(a));
}

function labelName(label: unknown): string | null {
  if (!label || typeof label !== 'object') return null;
  const name = (label as Record<string, unknown>).name;
  return typeof name === 'string' ? name : null;
}

function isHighPriority(issue: DashboardIssue): boolean {
  const names: string[] = [];
  for (const label of issue.labels) {
    const name = labelName(label);
    if (name) names.push(name);
  }
  const rawLabels = issue.rawPayload?.labels;
  if (Array.isArray(rawLabels)) {
    for (const label of rawLabels) {
      const name = labelName(label);
      if (name) names.push(name);
    }
  }
  return names.some((name) => HIGH_PRIORITY_REGEX.test(name));
}

function computeMetrics(issues: DashboardIssue[]): TeamDashboardMetricsDto {
  const metrics: TeamDashboardMetricsDto = {
    openIssues: 0,
    inProgressIssues: 0,
    closedIssues: 0,
    highPriorityIssues: 0,
  };

  for (const issue of issues) {
    if (issue.status === 'open') metrics.openIssues += 1;
    else if (issue.status === 'in_progress') metrics.inProgressIssues += 1;
    else if (issue.status === 'closed') metrics.closedIssues += 1;

    if (isHighPriority(issue)) metrics.highPriorityIssues += 1;
  }

  return metrics;
}

function activityType(status: IssueState): string {
  if (status === 'closed') return 'ISSUE_CLOSED';
  if (status === 'in_progress') return 'ISSUE_PROGRESS';
  return 'ISSUE_OPEN';
}

function buildLogs(issues: DashboardIssue[]): TeamDashboardLogDto[] {
  const now = new Date();
  const entries: TeamDashboardLogDto[] = [];

  for (const issue of issues) {
    const referenceDate = issue.assignedAt || issue.updatedAt || issue.createdAt || issue.closedAt;
    if (!referenceDate) continue;

    entries.push({
      type: activityType(issue.status),
      message: `${issue.user} handled issue: ${issue.title}`,
      time: relativeTimeShort(referenceDate, now),
      timestamp: referenceDate,
    });
  }

  return entries.sort((a, b) => toTime(b.timestamp) - toTime(a.timestamp)).slice(0, 10);
}

export function buildTeamDashboard(db: DemoDb, team: TeamRow): TeamDashboardDto {
  const detail = buildTeamDetail(db, team);
  const internIds = new Set(db.interns.filter((intern) => intern.team_id === team.id).map((intern) => intern.id));

  if (internIds.size === 0) {
    return {
      team: detail,
      metrics: { openIssues: 0, inProgressIssues: 0, closedIssues: 0, highPriorityIssues: 0 },
      recentIssues: [],
      logs: [],
    };
  }

  const issues = teamIssues(db, internIds);

  return {
    team: detail,
    metrics: computeMetrics(issues),
    recentIssues: issues.slice(0, 5).map((issue) => ({
      id: issue.id,
      title: issue.title,
      repo: issue.repo,
      user: issue.user,
      status: issue.status,
    })),
    logs: buildLogs(issues),
  };
}

/** CreateTeamDto validation. */
function validateCreateTeam(body: Record<string, any>): void {
  const errors: string[] = [];

  errors.push(...maxLengthMessages('name', body.name, 120));
  if (!(typeof body.batchId === 'string' && LOOSE_UUID_REGEX.test(body.batchId))) {
    errors.push('batchId must be a UUID');
  }
  if (isPresent(body.description)) {
    errors.push(...maxLengthMessages('description', body.description, 500));
  }
  if (isPresent(body.teamLeadId) && !(typeof body.teamLeadId === 'string' && LOOSE_UUID_REGEX.test(body.teamLeadId))) {
    errors.push('teamLeadId must be a UUID');
  }
  if (isPresent(body.maxInterns)) {
    errors.push(...intMessages('maxInterns', body.maxInterns, 1));
  }

  throwIfInvalid(errors);
}

/** AddTeamMemberDto validation. */
function validateAddMember(body: Record<string, any>): void {
  const errors: string[] = [];

  if (!(typeof body.userId === 'string' && LOOSE_UUID_REGEX.test(body.userId))) {
    errors.push('userId must be a UUID');
  }
  if (!ROLE_VALUES.includes(body.role)) {
    errors.push(`role must be one of the following values: ${ROLE_VALUES.join(', ')}`);
  }

  throwIfInvalid(errors);
}

const teamRoutes: DemoRoute[] = [
  {
    method: 'GET',
    pattern: '/teams',
    handle: (req) => {
      const batchId = queryString(req.query, 'batchId');
      if (batchId && !isUuid(batchId)) {
        throw badRequestError('Invalid batchId query parameter.');
      }

      const actor = req.currentUser;
      return ok(visibleTeams(req.db, actor, batchId).map((team) => buildTeamDetail(req.db, team)));
    },
  },
  {
    method: 'POST',
    pattern: '/teams',
    handle: (req) => {
      const db = req.db;
      const body = bodyObject(req);
      const input: Record<string, any> = { ...body, maxInterns: toNumberLike(body.maxInterns) };
      validateCreateTeam(input);

      const teamName = String(input.name).trim();
      if (!teamName) {
        throw badRequestError('Team name is required.');
      }

      const creator = req.currentUser ?? fallbackActor(db);
      requireBatch(db, input.batchId);

      // DEMO: validate the lead before inserting, so a failure leaves no orphan team.
      const teamLeadId: string | undefined =
        typeof input.teamLeadId === 'string' && input.teamLeadId ? input.teamLeadId : undefined;
      if (teamLeadId) {
        const lead = requireUser(db, teamLeadId);
        if (lead.role !== 'team_lead') {
          throw badRequestError('Assigned team lead must have team_lead role.');
        }
      }

      const team: TeamRow = {
        id: uniqueId(db.teams),
        name: teamName,
        created_by: creator?.id ?? null,
        created_at: nowIso(),
        batch_id: input.batchId,
      };
      db.teams.push(team);

      if (teamLeadId) {
        db.team_members.push({
          id: uniqueId(db.team_members),
          team_id: team.id,
          user_id: teamLeadId,
          role: 'team_lead',
        });
      }

      return created(buildTeamDetail(db, team));
    },
  },
  {
    method: 'GET',
    pattern: '/teams/:id/dashboard',
    handle: (req) => {
      const team = requireTeam(req.db, uuidParam(req, 'id'));
      return ok(buildTeamDashboard(req.db, team));
    },
  },
  {
    method: 'POST',
    pattern: '/teams/:id/members',
    handle: (req) => {
      const db = req.db;
      const teamId = uuidParam(req, 'id');
      const body = bodyObject(req);
      validateAddMember(body);

      const team = requireTeam(db, teamId);
      const user = requireUser(db, body.userId);
      const role = body.role as Role;

      if (db.team_members.some((member) => member.team_id === team.id && member.user_id === user.id)) {
        throw conflictError('User is already a member of this team.');
      }

      if (role === 'intern') {
        // DEMO: one team per intern, so team_members and interns.team_id stay in sync.
        removeMembers(
          db,
          (member) => member.user_id === user.id && member.role === 'intern' && member.team_id !== team.id
        );
      }

      db.team_members.push({
        id: uniqueId(db.team_members),
        team_id: team.id,
        user_id: user.id,
        role,
      });

      if (role === 'intern') {
        const intern = internByUserId(db, user.id);
        if (intern) {
          intern.team_id = team.id;
        }
      }

      return created(buildTeamDetail(db, team));
    },
  },
  {
    method: 'DELETE',
    pattern: '/teams/:id/members/:userId',
    handle: (req) => {
      const db = req.db;
      const teamId = uuidParam(req, 'id');
      const userId = uuidParam(req, 'userId');
      const team = requireTeam(db, teamId);

      const removed = removeMembers(db, (member) => member.team_id === team.id && member.user_id === userId);
      if (removed.length === 0) {
        throw notFoundError('Team member not found.');
      }

      // DEMO: keep interns.team_id in sync with the remaining 'intern' membership.
      const intern = internByUserId(db, userId);
      if (intern && intern.team_id === team.id) {
        intern.team_id = internTeamMembership(db, userId)?.team_id ?? null;
      }

      return ok(buildTeamDetail(db, team));
    },
  },
  {
    method: 'GET',
    pattern: '/teams/:id',
    handle: (req) => {
      const team = requireTeam(req.db, uuidParam(req, 'id'));
      return ok(buildTeamDetail(req.db, team));
    },
  },
];

// ---------------------------------------------------------------------------
// Dashboard (dashboard.service.ts; no UI consumer)
// ---------------------------------------------------------------------------

function dashboardTeamId(query: URLSearchParams): string | undefined {
  const teamId = queryString(query, 'teamId');
  if (teamId && !UUID_V4_REGEX.test(teamId)) {
    throw badRequestError(['teamId must be a UUID']);
  }
  return teamId;
}

function internIdsForTeam(db: DemoDb, teamId: string): string[] {
  return db.interns.filter((intern) => intern.team_id === teamId).map((intern) => intern.id);
}

function issueActivities(issue: IssueRow, internId: string | null, teamId: string | null): DashboardActivityDto[] {
  const label = (issue.title ?? '').trim() || issue.id;
  const activities: DashboardActivityDto[] = [];

  if (issue.created_at) {
    activities.push({ type: 'issue_opened', description: `Issue opened: ${label}`, date: issue.created_at, internId, teamId });
  }
  if (issue.state === 'closed' && issue.closed_at) {
    activities.push({ type: 'issue_closed', description: `Issue closed: ${label}`, date: issue.closed_at, internId, teamId });
  }

  return activities;
}

const dashboardRoutes: DemoRoute[] = [
  {
    method: 'GET',
    pattern: '/dashboard/stats',
    handle: (req) => {
      const db = req.db;
      const teamId = dashboardTeamId(req.query);
      const internIds = teamId ? new Set(internIdsForTeam(db, teamId)) : null;

      const totalInterns = internIds ? internIds.size : db.interns.length;
      const pendingReports =
        internIds && internIds.size === 0
          ? 0
          : db.reports.filter(
              (report) => report.status === 'submitted' && (!internIds || internIds.has(report.intern_id))
            ).length;

      let openIssues: number;
      if (!internIds) {
        openIssues = db.issues.filter((issue) => issue.state === 'open').length;
      } else {
        const openIds = new Set<string>();
        for (const assignment of db.issue_assignments) {
          if (!internIds.has(assignment.intern_id)) continue;
          if (issueById(db, assignment.issue_id)?.state === 'open') openIds.add(assignment.issue_id);
        }
        openIssues = openIds.size;
      }

      // The performance feature was removed, so there are no scores to average.
      return ok({ totalInterns, pendingReports, openIssues, averageScore: 0 });
    },
  },
  {
    method: 'GET',
    pattern: '/dashboard/activity',
    handle: (req) => {
      const db = req.db;
      const teamId = dashboardTeamId(req.query) ?? null;
      const internIds = teamId ? new Set(internIdsForTeam(db, teamId)) : null;

      if (internIds && internIds.size === 0) {
        return ok([]);
      }

      const reportActivities: DashboardActivityDto[] = db.reports
        .filter((report) => report.status === 'submitted' && (!internIds || internIds.has(report.intern_id)))
        .filter((report) => Boolean(report.submitted_at))
        .sort((a, b) => toTime(b.submitted_at) - toTime(a.submitted_at))
        .slice(0, 40)
        .map((report) => ({
          type: 'report_submitted' as const,
          description: `Report ${report.id} submitted`,
          date: report.submitted_at,
          internId: report.intern_id,
          teamId,
        }));

      const issueRows: DashboardActivityDto[] = [];
      if (!internIds) {
        for (const issue of byCreatedDesc(db.issues).slice(0, 40)) {
          issueRows.push(...issueActivities(issue, null, null));
        }
      } else {
        const seen = new Set<string>();
        const assignments = db.issue_assignments
          .filter((assignment) => internIds.has(assignment.intern_id))
          .sort((a, b) => toTime(b.assigned_at) - toTime(a.assigned_at))
          .slice(0, 80);
        for (const assignment of assignments) {
          if (seen.has(assignment.issue_id)) continue;
          const issue = issueById(db, assignment.issue_id);
          if (!issue) continue;
          seen.add(assignment.issue_id);
          issueRows.push(...issueActivities(issue, assignment.intern_id, teamId));
        }
      }

      const feed = [...reportActivities, ...issueRows]
        .sort((a, b) => toTime(b.date) - toTime(a.date))
        .slice(0, 20);

      return ok(feed);
    },
  },
];

// Literal routes come before ':param' routes within each table (segment counts
// must match exactly, so '/teams/:id/dashboard' never shadows '/teams/:id').
export const routes: DemoRoute[] = [...batchRoutes, ...teamRoutes, ...dashboardRoutes];
