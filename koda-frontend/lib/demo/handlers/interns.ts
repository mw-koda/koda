/**
 * Demo handlers: INTERNS (spec: specs/interns.md; join semantics also in auth-users.md).
 *
 * Mirrors koda-backend src/interns/interns.controller.ts + interns.service.ts on
 * the shared demo tables. Everything is computed at request time from the store,
 * so joins, team changes, new reports and assignments show up on the next call.
 *
 * Routes (first segment 'interns'), in match order:
 * - GET    /interns             ?teamId= (interns.team_id) &batchId= (batch UUID OR a
 *                               case-insensitive join code; unknown -> []). For an
 *                               intern caller, batchId is forced to their own batch
 *                               ([] if they have none). Postgres natural order
 *                               (db.interns order). InternListRow[] = { id, user_id,
 *                               team_id, created_at, school, role?, user, reports[],
 *                               issue_assignments[] }; both arrays are always present.
 * - POST   /interns/join        { joinCode, school? } -> 201 findOne shape.
 *                               400 'Invalid join code'; 409 when already enrolled in
 *                               that same batch.
 * - POST   /interns             { user_id, team_id, name? } -> 201 bare row (unused by UI).
 * - GET    /interns/:id/profile { intern, reports: (report & { issues })[] } (unused by UI).
 * - GET    /interns/:id         findOne shape { id, user_id, team_id, created_at,
 *                               school, role?, user }; 404 'Intern not found'.
 * - PATCH  /interns/:id         { team_id?, name? } -> bare row; 404 'Intern not found or
 *                               not updated' (unused by UI).
 * - DELETE /interns/:id         200 { message: 'Deleted successfully' }, cascades (unused by UI).
 *
 * DEMO DEVIATIONS (never 401/403, keep the recorded screens consistent):
 * - Ownership checks are permissive: an intern can read any intern record/profile
 *   (the real backend 403s, which logs the user out). Role guards are open to all.
 * - `role` (demo-only title, e.g. 'Full-Stack Intern') is included on every row so
 *   /interns/dashboard reads '<role> - <team>'; `school` is included on list rows.
 * - A UUID batchId / joinCode must name an existing batch (backend accepts any UUID
 *   and fails later); an unknown one gives [] / 400 'Invalid join code'.
 * - POST /interns/join: a missing joinCode gives 400 'Invalid join code' (backend 500),
 *   re-joining the SAME batch gives 409 (backend no-ops), and a new interns row takes
 *   team_id from an existing 'intern' team_members row so interns.team_id and
 *   team_members stay in sync. A stored demo-only users.status is cleared, because
 *   is_onboarded=true is what the real UI reads as 'active'.
 * - POST/PATCH keep team_members in sync with interns.team_id; `name` is accepted
 *   and ignored (the real table has no such column and Supabase would 500).
 *   Database errors (FK / unique) are 400/409 with the Postgres wording, not 500.
 *   Unknown body properties are ignored (no forbidNonWhitelisted), like the other
 *   demo handlers.
 * - A non-UUID :id gives 404 'Intern not found' (backend: raw 500 from Postgres).
 */

import {
  DemoHttpError,
  badRequest,
  bodyObject,
  conflict,
  created,
  notFound,
  ok,
  queryString,
  type DemoRequest,
  type DemoRoute,
} from '../http';
import { ids, isUuid, newId } from '../ids';
import {
  batchById,
  internById,
  internByUserId,
  internTeamMembership,
  internUserEmbed,
  issueAssignee,
  issueById,
  resolveBatchId,
  teamById,
  userById,
  userContext,
  type InternUserEmbed,
} from '../lookups';
import { nowIso } from '../time';
import type { DemoDb, InternRow, IssueRow, ReportRow, UserRow } from '../types';

// ---------------------------------------------------------------------------
// Response shapes
// ---------------------------------------------------------------------------

/** interns.* (select() / select('*')), plus the demo-only title when stored. */
interface InternBaseDto {
  id: string;
  user_id: string;
  team_id: string | null;
  created_at: string | null;
  school: string | null;
  /** DEMO-ONLY title (interns/dashboard heading). */
  role?: string;
}

/** findOne: `*, user:users!interns_user_id_fkey(id, github_username, name, email, avatar_url)` */
interface InternDetailDto extends InternBaseDto {
  user: InternUserEmbed | null;
}

/** reports(id, title, period_start, period_end, submitted_at, status) */
interface InternReportSummaryDto {
  id: string;
  title: string | null;
  period_start: string | null;
  period_end: string | null;
  submitted_at: string | null;
  status: string | null;
}

/** findAll row (interns.service.ts InternListRow). */
interface InternListRowDto extends InternDetailDto {
  reports: InternReportSummaryDto[];
  issue_assignments: Array<{ id: string }>;
}

/** issues.service.ts mapIssue: issues.* + flattened first assignee. */
type MappedIssueDto = IssueRow & {
  assignee_name: string | null;
  assignee_username: string | null;
  assignee_avatar: string | null;
};

type ProfileReportDto = ReportRow & { issues: MappedIssueDto[] };

// ---------------------------------------------------------------------------
// Projections
// ---------------------------------------------------------------------------

function internBase(intern: InternRow): InternBaseDto {
  const dto: InternBaseDto = {
    id: intern.id,
    user_id: intern.user_id,
    team_id: intern.team_id ?? null,
    created_at: intern.created_at ?? null,
    school: intern.school ?? null,
  };

  if (intern.role) {
    dto.role = intern.role;
  }

  return dto;
}

function internDetail(db: DemoDb, intern: InternRow): InternDetailDto {
  return {
    ...internBase(intern),
    user: internUserEmbed(userById(db, intern.user_id)),
  };
}

function reportSummary(report: ReportRow): InternReportSummaryDto {
  return {
    id: report.id,
    title: report.title ?? null,
    period_start: report.period_start ?? null,
    period_end: report.period_end ?? null,
    submitted_at: report.submitted_at ?? null,
    status: report.status ?? null,
  };
}

/** issues.service.ts mapIssue (assignee = the issue's FIRST assignment). */
function mapIssue(db: DemoDb, issue: IssueRow): MappedIssueDto {
  const user = issueAssignee(db, issue.id)?.user ?? null;
  return {
    ...issue,
    labels: Array.isArray(issue.labels) ? issue.labels : [],
    assignee_name: user?.name || null,
    assignee_username: user?.github_username || null,
    assignee_avatar: user?.avatar_url || null,
  };
}

/**
 * issues.service.ts findByInternId: issues assigned to the intern (assignment
 * order), filtered by created_at within [period_start, period_end] using the
 * backend's plain string comparison.
 */
function issuesForIntern(
  db: DemoDb,
  internId: string,
  filter: { period_start?: string | null; period_end?: string | null } = {}
): MappedIssueDto[] {
  const { period_start: periodStart, period_end: periodEnd } = filter;
  const issues: MappedIssueDto[] = [];

  for (const assignment of db.issue_assignments) {
    if (assignment.intern_id !== internId) continue;
    const issue = issueById(db, assignment.issue_id);
    if (!issue) continue;
    if (periodStart && !(issue.created_at && issue.created_at >= periodStart)) continue;
    if (periodEnd && !(issue.created_at && issue.created_at <= periodEnd)) continue;
    issues.push(mapIssue(db, issue));
  }

  return issues;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Find the intern for a path id (a non-UUID can never match: 404 like a miss). */
function internForParam(req: DemoRequest, message: string): InternRow {
  const id = req.params.id;
  const intern = isUuid(id) ? internById(req.db, id) : null;
  if (!intern) {
    throw new DemoHttpError(404, message, 'Not Found');
  }
  return intern;
}

function validationError(messages: string[]): DemoHttpError {
  return new DemoHttpError(400, messages, 'Bad Request');
}

function foreignKeyError(column: 'user_id' | 'team_id'): DemoHttpError {
  return new DemoHttpError(
    400,
    `insert or update on table "interns" violates foreign key constraint "interns_${column}_fkey"`,
    'Bad Request'
  );
}

/** Stable seed-style id when it is still free in the table, else a random v4. */
function stableOrNewId(stableId: string, taken: (id: string) => boolean): string {
  return taken(stableId) ? newId() : stableId;
}

/** Remove matching rows IN PLACE (the db arrays are shared with the cache). */
function removeWhere<T>(rows: T[], predicate: (row: T) => boolean): void {
  for (let i = rows.length - 1; i >= 0; i--) {
    if (predicate(rows[i])) rows.splice(i, 1);
  }
}

const SEED_TEAM_KEYS = ['database', 'ghl', 'scraping', 'agentic-rag', 'pilot'] as const;

/**
 * DEMO: keep team_members in step with interns.team_id (one team per intern).
 * Removes the user's other 'intern' memberships and adds one for teamId.
 */
function syncInternMembership(db: DemoDb, userId: string, teamId: string | null): void {
  removeWhere(
    db.team_members,
    (member) => member.user_id === userId && member.role === 'intern' && member.team_id !== teamId
  );

  if (!teamId) return;

  const exists = db.team_members.some(
    (member) => member.user_id === userId && member.team_id === teamId && member.role === 'intern'
  );
  if (exists) return;

  // Seeded teams get the seed's stable team_member id when it is free.
  const user = userById(db, userId);
  const teamKey = SEED_TEAM_KEYS.find((key) => ids.team(key) === teamId);
  const stableId = user && teamKey ? ids.teamMember(teamKey, user.github_username) : newId();

  db.team_members.push({
    id: stableOrNewId(stableId, (id) => db.team_members.some((member) => member.id === id)),
    team_id: teamId,
    user_id: userId,
    role: 'intern',
  });
}

/** Batch the caller is scoped to when they are an intern (JwtStrategy batch_id). */
function internCallerBatch(db: DemoDb, user: UserRow | null): { scoped: boolean; batchId: string | null } {
  if (!user || user.role !== 'intern') {
    return { scoped: false, batchId: null };
  }
  return { scoped: true, batchId: userContext(db, user).batchId };
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

export const routes: DemoRoute[] = [
  // GET /interns ---------------------------------------------------------------
  {
    method: 'GET',
    pattern: '/interns',
    handle: (req) => {
      const db = req.db;
      const teamId = queryString(req.query, 'teamId');
      let batchIdentifier = queryString(req.query, 'batchId');

      // Controller: an intern always sees only their own batch ([] without one).
      const caller = internCallerBatch(db, req.currentUser);
      if (caller.scoped) {
        if (!caller.batchId) {
          return ok([]);
        }
        batchIdentifier = caller.batchId;
      }

      let interns = db.interns.filter((intern) => !teamId || intern.team_id === teamId);

      if (batchIdentifier) {
        const batchId = resolveBatchId(db, batchIdentifier);
        if (!batchId) {
          return ok([]);
        }
        const enrolled = new Set(
          db.batch_interns.filter((row) => row.batch_id === batchId).map((row) => row.intern_id)
        );
        interns = interns.filter((intern) => enrolled.has(intern.id));
      }

      // Group nested rows in one pass each.
      const reportsByIntern = new Map<string, InternReportSummaryDto[]>();
      for (const report of db.reports) {
        const list = reportsByIntern.get(report.intern_id);
        if (list) list.push(reportSummary(report));
        else reportsByIntern.set(report.intern_id, [reportSummary(report)]);
      }

      const issueIds = new Set(db.issues.map((issue) => issue.id));
      const assignmentsByIntern = new Map<string, Array<{ id: string }>>();
      for (const assignment of db.issue_assignments) {
        // Only assignments whose issue exists, so the count matches GET /issues/intern/:id.
        if (!issueIds.has(assignment.issue_id)) continue;
        const list = assignmentsByIntern.get(assignment.intern_id);
        if (list) list.push({ id: assignment.id });
        else assignmentsByIntern.set(assignment.intern_id, [{ id: assignment.id }]);
      }

      const rows: InternListRowDto[] = interns.map((intern) => ({
        ...internDetail(db, intern),
        reports: reportsByIntern.get(intern.id) ?? [],
        issue_assignments: assignmentsByIntern.get(intern.id) ?? [],
      }));

      return ok(rows);
    },
  },

  // POST /interns/join ------------------------------------------------------------
  {
    method: 'POST',
    pattern: '/interns/join',
    handle: (req) => {
      const db = req.db;
      const user = req.currentUser;
      if (!user) {
        // Real backend: 401 from the guard. Demo mode never 401s outside /auth/me.
        return notFound('User not found');
      }

      const body = bodyObject(req);
      const joinCode = typeof body.joinCode === 'string' ? body.joinCode.trim() : '';
      const rawSchool = typeof body.school === 'string' ? body.school.trim() : '';
      const school = rawSchool || undefined;

      // 1. Resolve the batch (UUID or case-insensitive join code).
      const batchId = joinCode ? resolveBatchId(db, joinCode) : null;
      const batch = batchById(db, batchId);
      if (!batchId || !batch) {
        return badRequest('Invalid join code');
      }

      const existing = internByUserId(db, user.id);
      const enrollment = existing
        ? db.batch_interns.find((row) => row.intern_id === existing.id) ?? null
        : null;

      if (enrollment && enrollment.batch_id === batchId) {
        return conflict(`You are already enrolled in ${batch.name}.`);
      }

      const timestamp = nowIso();
      let intern: InternRow;

      // 2-3. Create the intern row, or update its school.
      if (existing) {
        intern = existing;
        if (school) {
          intern.school = school;
        }
      } else {
        intern = {
          id: stableOrNewId(ids.intern(user.github_username), (id) => internById(db, id) !== null),
          user_id: user.id,
          // DEMO: pick up an existing 'intern' membership so both sources agree.
          team_id: internTeamMembership(db, user.id)?.team_id ?? null,
          created_at: timestamp,
          school: school ?? null,
          role: 'Intern',
        };
        db.interns.push(intern);
      }

      // 4. Upsert batch_interns on intern_id (moves the intern to this batch).
      if (enrollment) {
        enrollment.batch_id = batchId;
        enrollment.assigned_at = timestamp;
      } else {
        db.batch_interns.push({
          id: stableOrNewId(ids.batchIntern(user.github_username), (id) =>
            db.batch_interns.some((row) => row.id === id)
          ),
          batch_id: batchId,
          intern_id: intern.id,
          assigned_at: timestamp,
        });
      }

      // 5. users: is_onboarded = true, school_name = school (undefined leaves it as is).
      user.is_onboarded = true;
      if (school !== undefined) {
        user.school_name = school;
      }
      if (user.status) {
        delete user.status;
      }

      return created(internDetail(db, intern));
    },
  },

  // POST /interns -----------------------------------------------------------------
  {
    method: 'POST',
    pattern: '/interns',
    handle: (req) => {
      const db = req.db;
      const body = bodyObject(req);
      const errors: string[] = [];

      if (!isUuid(body.user_id)) errors.push('user_id must be a UUID');
      if (!isUuid(body.team_id)) errors.push('team_id must be a UUID');
      if (body.name !== undefined && body.name !== null && typeof body.name !== 'string') {
        errors.push('name must be a string');
      }
      if (errors.length) {
        throw validationError(errors);
      }

      const userId: string = body.user_id;
      const teamId: string = body.team_id;
      const user = userById(db, userId);
      if (!user) throw foreignKeyError('user_id');
      if (!teamById(db, teamId)) throw foreignKeyError('team_id');
      if (internByUserId(db, userId)) {
        return conflict('duplicate key value violates unique constraint "interns_user_id_key"');
      }

      const intern: InternRow = {
        id: stableOrNewId(ids.intern(user.github_username), (id) => internById(db, id) !== null),
        user_id: userId,
        team_id: teamId,
        created_at: nowIso(),
        // The DTO has no school; the real insert leaves it null.
        school: null,
        role: 'Intern',
      };
      db.interns.push(intern);
      syncInternMembership(db, userId, teamId);

      return created(internBase(intern));
    },
  },

  // GET /interns/:id/profile ---------------------------------------------------------
  {
    method: 'GET',
    pattern: '/interns/:id/profile',
    handle: (req) => {
      const db = req.db;
      const intern = internForParam(req, 'Intern not found');

      const reports: ProfileReportDto[] = db.reports
        .filter((report) => report.intern_id === intern.id)
        .sort((a, b) => (b.period_start ?? '').localeCompare(a.period_start ?? ''))
        .map((report) => ({
          ...report,
          issues: issuesForIntern(db, intern.id, {
            period_start: report.period_start,
            period_end: report.period_end,
          }),
        }));

      return ok({ intern: internDetail(db, intern), reports });
    },
  },

  // GET /interns/:id -------------------------------------------------------------------
  {
    method: 'GET',
    pattern: '/interns/:id',
    handle: (req) => ok(internDetail(req.db, internForParam(req, 'Intern not found'))),
  },

  // PATCH /interns/:id -------------------------------------------------------------------
  {
    method: 'PATCH',
    pattern: '/interns/:id',
    handle: (req) => {
      const db = req.db;
      const body = bodyObject(req);
      const errors: string[] = [];
      const hasTeamId = body.team_id !== undefined;

      // IsOptional: null/undefined skip IsUUID (null still clears the column).
      if (hasTeamId && body.team_id !== null && !isUuid(body.team_id)) {
        errors.push('team_id must be a UUID');
      }
      if (body.name !== undefined && body.name !== null && typeof body.name !== 'string') {
        errors.push('name must be a string');
      }
      if (errors.length) {
        throw validationError(errors);
      }

      const intern = internForParam(req, 'Intern not found or not updated');

      if (hasTeamId) {
        const teamId: string | null = body.team_id;
        if (teamId && !teamById(db, teamId)) {
          throw foreignKeyError('team_id');
        }
        intern.team_id = teamId;
        syncInternMembership(db, intern.user_id, teamId);
      }

      return ok(internBase(intern));
    },
  },

  // DELETE /interns/:id -------------------------------------------------------------------
  {
    method: 'DELETE',
    pattern: '/interns/:id',
    handle: (req) => {
      const db = req.db;
      const id = req.params.id;

      // No 404 for a missing id (backend). ON DELETE CASCADE children; team_members
      // is keyed by user and is left alone, like the real schema.
      if (db.interns.some((intern) => intern.id === id)) {
        removeWhere(db.interns, (intern) => intern.id === id);
        removeWhere(db.reports, (row) => row.intern_id === id);
        removeWhere(db.attendance, (row) => row.intern_id === id);
        removeWhere(db.issue_assignments, (row) => row.intern_id === id);
        removeWhere(db.batch_interns, (row) => row.intern_id === id);
      }

      return ok({ message: 'Deleted successfully' });
    },
  },
];
