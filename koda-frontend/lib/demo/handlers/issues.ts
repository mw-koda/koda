/**
 * Demo handlers: ISSUES + REPOSITORIES + ASSIGNMENTS (spec: specs/issues.md).
 *
 * Endpoints this domain implements (first segment 'issues' | 'repositories').
 * IssueDto = the issues row (id, repo_id, github_issue_id, title, state,
 * created_at, updated_at, closed_at, labels, raw_payload) + assignee_name,
 * assignee_username, assignee_avatar resolved at response time from the
 * issue's FIRST assignment -> interns -> users (backend mapIssue; each value is
 * `|| null`, so empty strings become null).
 *
 * These are raw fetch() calls in the UI (handleResponse, not requestJson):
 * errors do not log out, but we still never answer 401/403.
 *
 * - GET    /issues/recent            ?limit= (default 10; UI sends 4). Global
 *                                    (NOT scoped to the caller), updated_at DESC.
 *                                    IssueDto[].
 * - GET    /issues/intern/:internId  ?state &period_start &period_end (page/limit/
 *                                    repo_id accepted, ignored). The UI sends
 *                                    '/issues/intern/<id>?' (empty query).
 *                                    Issues linked via issue_assignments.intern_id.
 *                                    DEMO: no 403 for an intern reading another
 *                                    intern's issues; ordered updated_at DESC
 *                                    (backend: insertion order); a users.id is
 *                                    accepted as a fallback when no interns row
 *                                    has that id. Unknown intern -> []. IssueDto[].
 * - GET    /issues                   ?repo_id &state &intern_id &period_start
 *                                    &period_end &page (1) &limit (20).
 *                                    Intern caller: intern_id forced to their own
 *                                    interns.id (none -> { data: [], total: 0 }).
 *                                    No intern_id: created_at DESC; with it:
 *                                    assigned_at DESC. total = count of rows that
 *                                    match ALL filters, before paging (the INTENDED
 *                                    semantics; the real backend's intern branch
 *                                    counts every assignment). repo_id matches the
 *                                    stored repo_id (full_name in demo) or the
 *                                    repositories.id UUID.
 *                                    { data, total, page, limit }.
 * - GET    /issues/:id               IssueDto; unknown -> 404 'Issue not found'
 *                                    (backend: empty 200 body). Unused by the UI.
 * - GET    /issues/:issueId/assignments
 *                                    [{ ...assignment, interns: { id, user_id,
 *                                    team_id, created_at, school, users: { name,
 *                                    github_username } } }]. Unused by the UI.
 * - POST   /issues/:issueId/assignments { intern_id } -> upsert on (issue_id,
 *                                    intern_id) with manual=true, assigned_at=now.
 *                                    201 assignment row. Unused by the UI.
 * - DELETE /issues/:issueId/assignments/:assignmentId -> { removed: true }.
 * - GET    /repositories             created_at DESC, raw rows. Unused by the UI.
 * - GET    /repositories/:id         by id (or full_name, e.g. metawatt%2Fleads-api);
 *                                    404 'Repository not found'.
 *
 * Query validation mirrors IssueFilterDto (400, message string[] in class
 * declaration order): invalid state / period_* / page / limit. Unknown query
 * params are ignored (the real ValidationPipe would 400 them, but the UI never
 * sends any, and failing loudly on a stray param would only hurt a recording).
 *
 * Route order: literal '/issues/recent' and '/issues/intern/:internId' before
 * '/issues/:id' and '/issues/:issueId/assignments'.
 */

import {
  bodyObject,
  created,
  DemoHttpError,
  notFound,
  ok,
  queryInt,
  queryString,
  type DemoRequest,
  type DemoRoute,
} from '../http';
import { newId } from '../ids';
import {
  assignmentsForIntern,
  assignmentsForIssue,
  internById,
  internByUserId,
  issueAssignee,
  issueById,
  repoByFullName,
  repoById,
  repoForIssue,
  userById,
} from '../lookups';
import { nowIso } from '../time';
import type {
  DemoDb,
  GitHubLabel,
  InternRow,
  IssueAssignmentRow,
  IssueRow,
  IssueState,
  RepositoryRow,
} from '../types';

// ---------------------------------------------------------------------------
// DTOs
// ---------------------------------------------------------------------------

/** Backend Issue (issues.service.ts mapIssue): the row + first-assignee fields. */
export interface IssueDto {
  id: string;
  repo_id: string;
  github_issue_id: string;
  title: string;
  state: IssueState;
  created_at: string | null;
  updated_at: string | null;
  closed_at: string | null;
  labels: GitHubLabel[];
  raw_payload: Record<string, unknown> | null;
  assignee_name: string | null;
  assignee_username: string | null;
  assignee_avatar: string | null;
}

export interface PaginatedIssuesDto {
  data: IssueDto[];
  total: number;
  page: number;
  limit: number;
}

/** GET /issues/:issueId/assignments row ('*, interns(*, users(name, github_username))'). */
export interface IssueAssignmentWithRelationsDto extends IssueAssignmentRow {
  interns: {
    id: string;
    user_id: string;
    team_id: string | null;
    created_at: string;
    school: string | null;
    users: { name: string | null; github_username: string } | null;
  } | null;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const DEFAULT_RECENT_LIMIT = 10;

/** IssueState enum in backend declaration order (OPEN, CLOSED, IN_PROGRESS). */
const ISSUE_STATES: readonly IssueState[] = ['open', 'closed', 'in_progress'];
const STATE_MESSAGE = `state must be one of the following values: ${ISSUE_STATES.join(', ')}`;

function isIssueState(value: unknown): value is IssueState {
  return typeof value === 'string' && (ISSUE_STATES as readonly string[]).includes(value);
}

/** mapIssue: assignee_* from the FIRST assignment's intern -> user (`|| null`). */
export function toIssueDto(db: DemoDb, issue: IssueRow): IssueDto {
  const assignee = issueAssignee(db, issue.id);
  const user = assignee?.user ?? null;

  return {
    id: issue.id,
    repo_id: issue.repo_id,
    github_issue_id: issue.github_issue_id,
    title: issue.title ?? '',
    // Tracking pages call issue.state.replace(...) unguarded: never null.
    state: isIssueState(issue.state) ? issue.state : 'open',
    created_at: issue.created_at ?? null,
    updated_at: issue.updated_at ?? null,
    closed_at: issue.closed_at ?? null,
    labels: Array.isArray(issue.labels) ? issue.labels : [],
    raw_payload: issue.raw_payload ?? null,
    assignee_name: user?.name || null,
    assignee_username: user?.github_username || null,
    assignee_avatar: user?.avatar_url || null,
  };
}

// ---------------------------------------------------------------------------
// IssueFilterDto parsing / validation
// ---------------------------------------------------------------------------

interface IssueFilter {
  repo_id?: string;
  state?: IssueState;
  intern_id?: string;
  period_start?: string;
  period_end?: string;
  page?: number;
  limit?: number;
}

const ISO_DATE_REGEX =
  /^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}(?::?\d{2})?)?)?$/i;
const NAIVE_DATE_TIME_REGEX = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/;

/**
 * Epoch ms of a timestamp string. Zone-less date-times are read as UTC (like
 * the backend's Postgres `timestamp` columns); date-only strings are UTC
 * midnight. NaN when unparsable.
 */
function instant(value: string | null | undefined): number {
  if (!value) return Number.NaN;
  const trimmed = value.trim();
  const normalized = NAIVE_DATE_TIME_REGEX.test(trimmed) ? `${trimmed.replace(' ', 'T')}Z` : trimmed;
  return Date.parse(normalized);
}

function isIsoDateString(value: string): boolean {
  return ISO_DATE_REGEX.test(value) && !Number.isNaN(instant(value));
}

/** IssueFilterDto + ValidationPipe({ transform }) -> filter, or 400 with every message. */
function parseIssueFilter(query: URLSearchParams): IssueFilter {
  const filter: IssueFilter = {};
  const errors: string[] = [];

  const repoId = queryString(query, 'repo_id');
  if (repoId !== undefined) filter.repo_id = repoId;

  const state = queryString(query, 'state');
  if (state !== undefined) {
    if (isIssueState(state)) filter.state = state;
    else errors.push(STATE_MESSAGE);
  }

  const internId = queryString(query, 'intern_id');
  if (internId !== undefined) filter.intern_id = internId;

  for (const name of ['period_start', 'period_end'] as const) {
    const value = queryString(query, name);
    if (value === undefined) continue;
    if (isIsoDateString(value)) filter[name] = value;
    else errors.push(`${name} must be a valid ISO 8601 date string`);
  }

  for (const name of ['page', 'limit'] as const) {
    const value = queryString(query, name);
    if (value === undefined) continue;
    const parsed = Number(value);
    if (Number.isFinite(parsed)) filter[name] = Math.max(1, Math.floor(parsed));
    else errors.push(`${name} must be a number conforming to the specified constraints`);
  }

  if (errors.length) {
    throw new DemoHttpError(400, errors, 'Bad Request');
  }

  return filter;
}

// ---------------------------------------------------------------------------
// Query helpers
// ---------------------------------------------------------------------------

/** Newest first by the given timestamp; unparsable values sort last. Stable. */
function byNewest<T>(key: (row: T) => string | null | undefined): (a: T, b: T) => number {
  return (a, b) => {
    const ta = instant(key(a));
    const tb = instant(key(b));
    const va = Number.isNaN(ta) ? Number.NEGATIVE_INFINITY : ta;
    const vb = Number.isNaN(tb) ? Number.NEGATIVE_INFINITY : tb;
    if (va === vb) return 0;
    return vb > va ? 1 : -1;
  };
}

/**
 * interns.id lookup. DEMO fallback: a users.id also resolves to that user's
 * intern row (the real backend would just return nothing).
 */
function resolveIntern(db: DemoDb, id: string | null | undefined): InternRow | null {
  if (!id) return null;
  return internById(db, id) ?? internByUserId(db, id);
}

/** The intern's issues via issue_assignments, newest assignment first, one row per issue. */
function issuesForIntern(db: DemoDb, internId: string): IssueRow[] {
  const seen = new Set<string>();
  const result: IssueRow[] = [];

  const assignments = [...assignmentsForIntern(db, internId)].sort(byNewest((row) => row.assigned_at));
  for (const assignment of assignments) {
    if (seen.has(assignment.issue_id)) continue;
    const issue = issueById(db, assignment.issue_id);
    if (!issue) continue;
    seen.add(issue.id);
    result.push(issue);
  }

  return result;
}

/** repo_id filter: the stored value (full_name in demo) or the repositories.id / full_name. */
function matchesRepo(db: DemoDb, issue: IssueRow, repoId: string): boolean {
  if (issue.repo_id === repoId) return true;
  const repo = repoForIssue(db, issue);
  return !!repo && (repo.id === repoId || repo.full_name === repoId);
}

function applyFilters(db: DemoDb, issues: IssueRow[], filter: IssueFilter, withRepo: boolean): IssueRow[] {
  const start = filter.period_start ? instant(filter.period_start) : null;
  const end = filter.period_end ? instant(filter.period_end) : null;

  return issues.filter((issue) => {
    if (withRepo && filter.repo_id && !matchesRepo(db, issue, filter.repo_id)) return false;
    if (filter.state && issue.state !== filter.state) return false;

    if (start !== null || end !== null) {
      const createdAt = instant(issue.created_at);
      if (Number.isNaN(createdAt)) return false;
      if (start !== null && createdAt < start) return false;
      if (end !== null && createdAt > end) return false;
    }

    return true;
  });
}

function repositoryDto(repo: RepositoryRow): RepositoryRow {
  return {
    id: repo.id,
    team_id: repo.team_id,
    github_repo_id: repo.github_repo_id,
    name: repo.name,
    owner: repo.owner,
    url: repo.url,
    full_name: repo.full_name,
    html_url: repo.html_url,
    created_at: repo.created_at,
  };
}

function assignmentWithRelations(db: DemoDb, assignment: IssueAssignmentRow): IssueAssignmentWithRelationsDto {
  const intern = internById(db, assignment.intern_id);
  const user = intern ? userById(db, intern.user_id) : null;

  return {
    id: assignment.id,
    issue_id: assignment.issue_id,
    intern_id: assignment.intern_id,
    manual: assignment.manual,
    assigned_at: assignment.assigned_at,
    interns: intern
      ? {
          id: intern.id,
          user_id: intern.user_id,
          team_id: intern.team_id,
          created_at: intern.created_at,
          school: intern.school,
          users: user ? { name: user.name, github_username: user.github_username } : null,
        }
      : null,
  };
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

/** GET /issues/recent — global, updated_at DESC, limit (default 10). */
function findRecent(req: DemoRequest) {
  const limit = queryInt(req.query, 'limit', DEFAULT_RECENT_LIMIT);
  const issues = [...req.db.issues]
    .sort(byNewest((issue) => issue.created_at))
    .sort(byNewest((issue) => issue.updated_at))
    .slice(0, limit);

  return ok(issues.map((issue) => toIssueDto(req.db, issue)));
}

/** GET /issues — paginated, intern callers scoped to their own issues. */
function findAll(req: DemoRequest) {
  const { db } = req;
  const filter = parseIssueFilter(req.query);
  const page = filter.page ?? DEFAULT_PAGE;
  const limit = filter.limit ?? DEFAULT_LIMIT;

  let internId = filter.intern_id;
  const user = req.currentUser;

  if (user?.role === 'intern') {
    const ownIntern = internByUserId(db, user.id);
    if (!ownIntern) {
      const empty: PaginatedIssuesDto = { data: [], total: 0, page, limit };
      return ok(empty);
    }
    internId = ownIntern.id;
  }

  let source: IssueRow[];
  if (internId) {
    const intern = resolveIntern(db, internId);
    source = intern ? issuesForIntern(db, intern.id) : [];
  } else {
    source = [...db.issues].sort(byNewest((issue) => issue.created_at));
  }

  const matching = applyFilters(db, source, filter, true);
  const offset = (page - 1) * limit;
  const body: PaginatedIssuesDto = {
    data: matching.slice(offset, offset + limit).map((issue) => toIssueDto(db, issue)),
    total: matching.length,
    page,
    limit,
  };

  return ok(body);
}

/** GET /issues/intern/:internId — every issue assigned to that intern (no paging). */
function findByInternId(req: DemoRequest) {
  const { db } = req;
  const filter = parseIssueFilter(req.query);
  const intern = resolveIntern(db, req.params.internId);

  if (!intern) {
    return ok([] as IssueDto[]);
  }

  const issues = applyFilters(db, issuesForIntern(db, intern.id), filter, false)
    .sort(byNewest((issue) => issue.created_at))
    .sort(byNewest((issue) => issue.updated_at));

  return ok(issues.map((issue) => toIssueDto(db, issue)));
}

/** GET /issues/:id */
function findOne(req: DemoRequest) {
  const issue = issueById(req.db, req.params.id);
  if (!issue) {
    return notFound('Issue not found');
  }
  return ok(toIssueDto(req.db, issue));
}

/** GET /issues/:issueId/assignments */
function findAssignments(req: DemoRequest) {
  const rows = assignmentsForIssue(req.db, req.params.issueId).map((row) => assignmentWithRelations(req.db, row));
  return ok(rows);
}

/** POST /issues/:issueId/assignments { intern_id } — manual upsert on (issue_id, intern_id). */
function manualAssign(req: DemoRequest) {
  const { db } = req;
  const body = bodyObject(req);
  const rawInternId = typeof body.intern_id === 'string' ? body.intern_id.trim() : '';

  if (!rawInternId) {
    throw new DemoHttpError(400, ['intern_id must be a string', 'intern_id should not be empty'], 'Bad Request');
  }

  const issue = issueById(db, req.params.issueId);
  if (!issue) {
    return notFound('Issue not found');
  }

  const intern = resolveIntern(db, rawInternId);
  if (!intern) {
    return notFound('Intern not found');
  }

  const assignedAt = nowIso();
  const existing = db.issue_assignments.find((row) => row.issue_id === issue.id && row.intern_id === intern.id);

  if (existing) {
    existing.manual = true;
    existing.assigned_at = assignedAt;
    return created({ ...existing });
  }

  const row: IssueAssignmentRow = {
    id: newId(),
    issue_id: issue.id,
    intern_id: intern.id,
    manual: true,
    assigned_at: assignedAt,
  };
  db.issue_assignments.push(row);

  return created({ ...row });
}

/** DELETE /issues/:issueId/assignments/:assignmentId — by assignment id (issueId ignored). */
function removeAssignment(req: DemoRequest) {
  const rows = req.db.issue_assignments;
  const index = rows.findIndex((row) => row.id === req.params.assignmentId);
  if (index >= 0) {
    rows.splice(index, 1);
  }
  return ok({ removed: true });
}

/** GET /repositories — created_at DESC. */
function findRepositories(req: DemoRequest) {
  const repos = [...req.db.repositories].sort(byNewest((repo) => repo.created_at)).map(repositoryDto);
  return ok(repos);
}

/** GET /repositories/:id — by id, or by full_name (URL-encoded slash). */
function findRepository(req: DemoRequest) {
  const repo = repoById(req.db, req.params.id) ?? repoByFullName(req.db, req.params.id);
  if (!repo) {
    return notFound('Repository not found');
  }
  return ok(repositoryDto(repo));
}

export const routes: DemoRoute[] = [
  { method: 'GET', pattern: '/issues/recent', handle: findRecent },
  { method: 'GET', pattern: '/issues/intern/:internId', handle: findByInternId },
  { method: 'GET', pattern: '/issues', handle: findAll },
  { method: 'GET', pattern: '/issues/:issueId/assignments', handle: findAssignments },
  { method: 'POST', pattern: '/issues/:issueId/assignments', handle: manualAssign },
  { method: 'DELETE', pattern: '/issues/:issueId/assignments/:assignmentId', handle: removeAssignment },
  { method: 'GET', pattern: '/issues/:id', handle: findOne },
  { method: 'GET', pattern: '/repositories', handle: findRepositories },
  { method: 'GET', pattern: '/repositories/:id', handle: findRepository },
];
