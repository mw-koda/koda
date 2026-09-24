/**
 * Demo handlers: REPORTS (spec: specs/reports.md).
 *
 * Mirrors koda-backend/src/reports (controller + service + DTOs). A report row is
 * { id, intern_id, title, content, period_start, period_end, submitted_at, status }
 * (the 8 columns of the reports table). The type is only the title prefix
 * ('EOD Report' / 'Weekly Report' / 'Monthly Report').
 *
 * - GET   /reports                    All reports (every intern, EOD included),
 *                                     submitted_at DESC (nulls first, like Postgres).
 * - GET   /reports/intern/:internId   That intern's reports in DB (insertion) order.
 *                                     Optional ?periodStart (period_start >= v) and
 *                                     ?periodEnd (period_end <= v). [] for an unknown
 *                                     intern. Never 403.
 * - GET   /reports/:id                The row, or 404 'Report not found'.
 * - POST  /reports                    CreateReportDto { intern_id, title, content,
 *                                     period_start, period_end, submitted_at? } with the
 *                                     ValidationPipe messages as a string[] (unknown
 *                                     properties are ignored). Then, in backend order:
 *                                     (1) EOD rule: title starts with 'eod report'
 *                                         (trim, ci) and start/end share a date key, and
 *                                         an 'EOD Report%' row of the intern already has a
 *                                         period_start on that day -> 400 'You already
 *                                         submitted an EOD report for this date.'
 *                                     (2) exact same (intern, period_start, period_end)
 *                                         -> 400 'Report already exists for this period'.
 *                                     (3) insert: periods stored as 'YYYY-MM-DDT00:00:00',
 *                                         status 'submitted', submitted_at = now (ISO Z)
 *                                         unless the body gave one. 201 with the row.
 * - PATCH /reports/:id/status         { status } IsIn draft|submitted|reviewed; 404
 *                                     'Report not found'; transitions {draft:[submitted],
 *                                     pending:[reviewed], submitted:[reviewed],
 *                                     reviewed:[]} else 400 `Invalid transition from X to
 *                                     Y`. Only status changes. 200 with the row.
 *
 * Demo deviations: role/ownership guards are permissive (no 403). Postgres errors
 * the real API would surface as 500 (bad uuid / timestamp syntax, FK violation)
 * come back as 400 with the same Postgres message.
 * Route order: '/reports/intern/:internId' before '/reports/:id'.
 */

import {
  badRequest,
  bodyObject,
  created,
  DemoHttpError,
  ok,
  queryString,
  type DemoRequest,
  type DemoRoute,
} from '../http';
import { newId } from '../ids';
import { internById } from '../lookups';
import { localTimestamp, nowIso } from '../time';
import type { DemoDb, ReportRow, ReportStatus } from '../types';

/** The report as the API returns it (select('*') of the reports table). */
export interface ReportRecordDto {
  id: string;
  intern_id: string;
  title: string | null;
  content: string | null;
  period_start: string | null;
  period_end: string | null;
  submitted_at: string | null;
  status: string;
}

/** UpdateReportStatusDto @IsIn values. */
const ALLOWED_STATUS_VALUES = ['draft', 'submitted', 'reviewed'] as const;

/** reports.service.ts updateStatus transition table. */
const STATUS_TRANSITIONS: Record<string, readonly string[]> = {
  draft: ['submitted'],
  pending: ['reviewed'],
  submitted: ['reviewed'],
  reviewed: [],
};

/** validator.js isUUID(str, 'all') (class-validator @IsUUID() default). */
const ANY_UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** validator.js isISO8601 (non-strict), used by class-validator @IsISO8601(). */
const ISO8601_REGEX =
  /^([\+-]?\d{4}(?!\d{2}\b))((-?)((0[1-9]|1[0-2])(\3([12]\d|0[1-9]|3[01]))?|W([0-4]\d|5[0-3])(-?[1-7])?|(00[1-9]|0[1-9]\d|[12]\d{2}|3([0-5]\d|6[1-6])))([T\s]((([01]\d|2[0-3])((:?)[0-5]\d)?|24:?00)([\.,]\d+(?!:))?)?(\17[0-5]\d([\.,]\d+)?)?([zZ]|([\+-])([01]\d|2[0-3]):?([0-5]\d)?)?)?)?$/;

// --- helpers -----------------------------------------------------------------

function toRecord(row: ReportRow): ReportRecordDto {
  return {
    id: row.id,
    intern_id: row.intern_id,
    title: row.title ?? null,
    content: row.content ?? null,
    period_start: row.period_start ?? null,
    period_end: row.period_end ?? null,
    submitted_at: row.submitted_at ?? null,
    status: row.status,
  };
}

/** Postgres uuid comparison is case-insensitive; stored ids are lowercase. */
function sameId(a: string | null | undefined, b: string | null | undefined): boolean {
  return !!a && !!b && a.toLowerCase() === b.toLowerCase();
}

/** The backend would hit Postgres 22P02 (a 500); the demo answers 400 with the same text. */
function assertUuidSyntax(value: string): void {
  if (!ANY_UUID_REGEX.test(value)) {
    throw new DemoHttpError(400, `invalid input syntax for type uuid: "${value}"`, 'Bad Request');
  }
}

function findReport(db: DemoDb, id: string): ReportRow {
  assertUuidSyntax(id);
  const report = db.reports.find((row) => sameId(row.id, id));
  if (!report) {
    throw new DemoHttpError(404, 'Report not found', 'Not Found');
  }
  return report;
}

/** Epoch ms of a stored timestamp, or null (null / unparseable). */
function timeValue(value: string | null | undefined): number | null {
  if (!value) return null;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? null : parsed;
}

/** ORDER BY submitted_at DESC (Postgres puts NULLs first for DESC). Stable for ties. */
function sortBySubmittedDesc(rows: ReportRow[]): ReportRow[] {
  return rows
    .map((row, index) => ({ row, index, time: timeValue(row.submitted_at) }))
    .sort((a, b) => {
      if (a.time === null || b.time === null) {
        if (a.time === b.time) return a.index - b.index;
        return a.time === null ? -1 : 1;
      }
      return b.time - a.time || a.index - b.index;
    })
    .map((entry) => entry.row);
}

/** True for a real calendar day 'YYYY-MM-DD'. */
function isCalendarDate(key: string): boolean {
  const parsed = new Date(`${key}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === key;
}

/**
 * reports.service getDateKey: the first 'YYYY-MM-DD' substring, else the UTC date
 * of the parsed value; null when it cannot be parsed or is not a real date.
 */
function dateKeyOf(value: string): string | null {
  const match = value.match(/\d{4}-\d{2}-\d{2}/);
  if (match) {
    return isCalendarDate(match[0]) ? match[0] : null;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
}

/**
 * Timestamp (without tz) comparable form 'YYYY-MM-DDTHH:mm:ss' of a filter value;
 * Postgres ignores any zone suffix when casting to `timestamp`. Null if invalid.
 */
function comparableTimestamp(value: string): string | null {
  const match = value.match(/^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (match) {
    if (!isCalendarDate(match[1])) return null;
    const hours = match[2] ?? '00';
    const minutes = match[3] ?? '00';
    const seconds = match[4] ?? '00';
    return `${match[1]}T${hours}:${minutes}:${seconds}`;
  }
  const key = dateKeyOf(value);
  return key ? `${key}T00:00:00` : null;
}

/** class-transformer enableImplicitConversion for `string` DTO fields. */
function implicitString(value: unknown): unknown {
  return typeof value === 'number' || typeof value === 'boolean' ? String(value) : value;
}

function isIso8601(value: unknown): value is string {
  return typeof value === 'string' && ISO8601_REGEX.test(value);
}

/** Convert an optional client submitted_at to ISO 'Z' (a zone-less value is a UTC wall clock). */
function normalizeSubmittedAt(value: string): string {
  const hasTime = /[T\s]\d{2}/.test(value);
  const hasZone = /([zZ]|[+-]\d{2}(:?\d{2})?)$/.test(value);
  const parsed = new Date(hasTime && !hasZone ? `${value.replace(' ', 'T')}Z` : value);
  return Number.isNaN(parsed.getTime()) ? nowIso() : parsed.toISOString();
}

interface CreateReportInput {
  intern_id: string;
  title: string;
  content: string;
  period_start: string;
  period_end: string;
  submitted_at?: string;
}

/** CreateReportDto validation (messages in class-validator order). */
function validateCreateReport(req: DemoRequest): CreateReportInput {
  const body = bodyObject(req);
  // Unknown properties are ignored (no forbidNonWhitelisted), like the other demo handlers.
  const messages: string[] = [];

  const internId = implicitString(body.intern_id);
  const title = implicitString(body.title);
  const content = implicitString(body.content);
  const periodStart = implicitString(body.period_start);
  const periodEnd = implicitString(body.period_end);
  const submittedAt = implicitString(body.submitted_at);

  // @IsUUID()
  if (typeof internId !== 'string' || !ANY_UUID_REGEX.test(internId)) {
    messages.push('intern_id must be a UUID');
  }

  // @IsString() @IsNotEmpty() -> constraints registered bottom-up.
  for (const [name, value] of [
    ['title', title],
    ['content', content],
  ] as const) {
    if (value === undefined || value === null || value === '') {
      messages.push(`${name} should not be empty`);
    }
    if (typeof value !== 'string') {
      messages.push(`${name} must be a string`);
    }
  }

  // @IsISO8601()
  if (!isIso8601(periodStart)) {
    messages.push('period_start must be a valid ISO 8601 date string');
  }
  if (!isIso8601(periodEnd)) {
    messages.push('period_end must be a valid ISO 8601 date string');
  }

  // @IsOptional() @IsISO8601()
  if (submittedAt !== undefined && submittedAt !== null && !isIso8601(submittedAt)) {
    messages.push('submitted_at must be a valid ISO 8601 date string');
  }

  if (messages.length) {
    throw new DemoHttpError(400, messages, 'Bad Request');
  }

  return {
    intern_id: internId as string,
    title: title as string,
    content: content as string,
    period_start: periodStart as string,
    period_end: periodEnd as string,
    submitted_at: typeof submittedAt === 'string' ? submittedAt : undefined,
  };
}

function isEodTitle(title: string | null | undefined): boolean {
  return String(title ?? '').trim().toLowerCase().startsWith('eod report');
}

/** reports.service ensureUniqueEodForDay. */
function ensureUniqueEodForDay(db: DemoDb, dto: CreateReportInput): void {
  if (!isEodTitle(dto.title)) {
    return;
  }

  const startKey = dateKeyOf(dto.period_start);
  const endKey = dateKeyOf(dto.period_end);
  if (!startKey || !endKey) {
    throw new DemoHttpError(400, 'Invalid EOD date.', 'Bad Request');
  }
  if (startKey !== endKey) {
    return;
  }

  // .ilike('title', 'EOD Report%') + period_start within [day, day + 1).
  const duplicate = db.reports.some(
    (row) =>
      sameId(row.intern_id, dto.intern_id) &&
      String(row.title ?? '').toLowerCase().startsWith('eod report') &&
      !!row.period_start &&
      dateKeyOf(row.period_start) === startKey
  );

  if (duplicate) {
    throw new DemoHttpError(400, 'You already submitted an EOD report for this date.', 'Bad Request');
  }
}

/** The stored `timestamp` value of a period field ('YYYY-MM-DDT00:00:00'). */
function periodTimestamp(value: string): string {
  const key = dateKeyOf(value);
  if (!key) {
    throw new DemoHttpError(400, `invalid input syntax for type timestamp: "${value}"`, 'Bad Request');
  }
  return localTimestamp(key);
}

function storedPeriod(value: string | null | undefined): string | null {
  if (!value) return null;
  const key = dateKeyOf(value);
  return key ? localTimestamp(key) : value;
}

// --- routes -------------------------------------------------------------------

export const routes: DemoRoute[] = [
  // GET /reports ------------------------------------------------------------------
  {
    method: 'GET',
    pattern: '/reports',
    handle: ({ db }) => ok(sortBySubmittedDesc(db.reports).map(toRecord)),
  },

  // GET /reports/intern/:internId (before /reports/:id) -----------------------------
  {
    method: 'GET',
    pattern: '/reports/intern/:internId',
    handle: ({ db, params, query }) => {
      const internId = params.internId;
      assertUuidSyntax(internId);

      let rows = db.reports.filter((row) => sameId(row.intern_id, internId));

      const periodStart = queryString(query, 'periodStart');
      if (periodStart) {
        const bound = comparableTimestamp(periodStart);
        if (!bound) {
          return badRequest(`invalid input syntax for type timestamp: "${periodStart}"`);
        }
        rows = rows.filter((row) => {
          const value = row.period_start ? comparableTimestamp(row.period_start) : null;
          return value !== null && value >= bound;
        });
      }

      const periodEnd = queryString(query, 'periodEnd');
      if (periodEnd) {
        const bound = comparableTimestamp(periodEnd);
        if (!bound) {
          return badRequest(`invalid input syntax for type timestamp: "${periodEnd}"`);
        }
        rows = rows.filter((row) => {
          const value = row.period_end ? comparableTimestamp(row.period_end) : null;
          return value !== null && value <= bound;
        });
      }

      return ok(rows.map(toRecord));
    },
  },

  // GET /reports/:id (unused by the UI) --------------------------------------------
  {
    method: 'GET',
    pattern: '/reports/:id',
    handle: ({ db, params }) => ok(toRecord(findReport(db, params.id))),
  },

  // POST /reports -------------------------------------------------------------------
  {
    method: 'POST',
    pattern: '/reports',
    handle: (req) => {
      const { db } = req;
      const dto = validateCreateReport(req);

      // (1) One EOD per intern per day.
      ensureUniqueEodForDay(db, dto);

      // (2) One report per exact period (Postgres casts the strings to timestamp).
      const periodStart = periodTimestamp(dto.period_start);
      const periodEnd = periodTimestamp(dto.period_end);
      const exists = db.reports.some(
        (row) =>
          sameId(row.intern_id, dto.intern_id) &&
          storedPeriod(row.period_start) === periodStart &&
          storedPeriod(row.period_end) === periodEnd
      );
      if (exists) {
        return badRequest('Report already exists for this period');
      }

      // (3) Insert. reports.intern_id references interns.id.
      const internId = dto.intern_id.toLowerCase();
      if (!internById(db, internId)) {
        return badRequest(
          'insert or update on table "reports" violates foreign key constraint "reports_intern_id_fkey"'
        );
      }

      const status: ReportStatus = 'submitted';
      const row: ReportRow = {
        id: newId(),
        intern_id: internId,
        title: dto.title,
        content: dto.content,
        period_start: periodStart,
        period_end: periodEnd,
        submitted_at: dto.submitted_at ? normalizeSubmittedAt(dto.submitted_at) : nowIso(),
        status,
      };

      db.reports.push(row);
      return created(toRecord(row));
    },
  },

  // PATCH /reports/:id/status ---------------------------------------------------------
  {
    method: 'PATCH',
    pattern: '/reports/:id/status',
    handle: (req) => {
      const { db, params } = req;

      // UpdateReportStatusDto runs (ValidationPipe) before the service lookup.
      const body = bodyObject(req);
      const messages: string[] = [];
      const status = implicitString(body.status);
      if (typeof status !== 'string' || !(ALLOWED_STATUS_VALUES as readonly string[]).includes(status)) {
        messages.push(`status must be one of the following values: ${ALLOWED_STATUS_VALUES.join(', ')}`);
      }
      if (messages.length) {
        return badRequest(messages);
      }

      const report = findReport(db, params.id);
      const current = report.status;
      const allowed = Object.prototype.hasOwnProperty.call(STATUS_TRANSITIONS, current)
        ? STATUS_TRANSITIONS[current]
        : undefined;

      if (!allowed || !allowed.includes(status as string)) {
        return badRequest(`Invalid transition from ${current} to ${status}`);
      }

      report.status = status as ReportStatus;
      return ok(toRecord(report));
    },
  },
];

