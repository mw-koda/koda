/**
 * Demo handlers: ATTENDANCE (spec: specs/attendance.md).
 *
 * Mirrors koda-backend/src/attendance/attendance.controller.ts + attendance.service.ts.
 * AttendanceLog = { id, internId, timeIn, timeOut, renderedHours, createdAt, isOpen }
 * mapped from attendance rows (isOpen = time_out === null).
 *
 * - GET  /attendance/live        ?batchId= (uuid, required -> 400 'Validation failed (uuid
 *                                is expected)') &date= ('YYYY-MM-DD' UTC day, default today
 *                                UTC; bad format -> 400 'date must be formatted as
 *                                YYYY-MM-DD.'; unparsable -> 400 'date must be a valid
 *                                calendar date.'). { batchId, date, rows: [{ internId,
 *                                userId, internName, team, clockIn, clockOut, status }] }:
 *                                one row per batch_interns intern, sorted by internName;
 *                                clockIn/clockOut from the LATEST session whose time_in is in
 *                                [date 00:00Z, +1d); status 'present' iff such a session.
 * - POST /attendance/time-in     no body; intern from the current user (404 'Intern profile
 *                                not found for this user.'); open session -> 400 'You are
 *                                already timed in.'; 201 AttendanceLog (isOpen true).
 * - POST /attendance/time-out    no body; no open session -> 400 'You cannot time out
 *                                without timing in.'; closes it with rendered_hours =
 *                                round2(hours); 201 AttendanceLog (isOpen false).
 * - GET  /attendance/:internId   ?from &to (optional; invalid -> 400 'from must be a valid
 *                                date/time.' / 'to must be a valid date/time.'). { internId,
 *                                from, to, totalHours, logs (time_in DESC) }; unknown intern
 *                                -> totalHours 0, logs [].
 *
 * Demo deviations (all permissive, never 401/403):
 * - Role guards and the backend's "interns may only view their own attendance" 403 are
 *   dropped: every caller gets the data.
 * - A missing/unknown token on time-in/out answers 404 'Intern profile not found for this
 *   user.' instead of the JwtAuthGuard 401.
 * - totalHours is de-noised with round2(): the backend's raw float sum of 2-decimal values
 *   can come out as e.g. 123.99999999999999, which InternProfileView renders as '123h 60m'.
 *   The exact sum of 2-decimal values is itself 2-decimal, so the value is unchanged.
 *
 * Order: literal routes ('/attendance/live') before '/attendance/:internId'.
 */

import { created, DemoHttpError, ok, uuidParam, type DemoRequest, type DemoRoute } from '../http';
import { isUuid, newId } from '../ids';
import { internByUserId, internTeamMembership, internsInBatch, teamById, userById } from '../lookups';
import { DAY_MS, HOUR_MS, round2 } from '../time';
import type { AttendanceRow, DemoDb, InternRow } from '../types';

type LiveAttendanceStatus = 'pending' | 'present';

interface AttendanceLogDto {
  id: string;
  internId: string;
  timeIn: string;
  timeOut: string | null;
  renderedHours: number | null;
  createdAt: string;
  isOpen: boolean;
}

interface LiveAttendanceRowDto {
  internId: string;
  userId: string;
  internName: string;
  team: string;
  clockIn: string | null;
  clockOut: string | null;
  status: LiveAttendanceStatus;
}

const INTERN_NOT_FOUND = 'Intern profile not found for this user.';

function badRequest(message: string): DemoHttpError {
  return new DemoHttpError(400, message, 'Bad Request');
}

/** Epoch ms of an ISO timestamp (unparsable sorts last in DESC order). */
function timeMs(value: string | null | undefined): number {
  const ms = value ? Date.parse(value) : Number.NaN;
  return Number.isFinite(ms) ? ms : Number.NEGATIVE_INFINITY;
}

/** New array ordered by time_in DESC (stable), like `.order('time_in', { ascending: false })`. */
function byTimeInDesc(rows: AttendanceRow[]): AttendanceRow[] {
  return [...rows].sort((a, b) => timeMs(b.time_in) - timeMs(a.time_in));
}

/** AttendanceService.mapRow */
function mapRow(row: AttendanceRow): AttendanceLogDto {
  return {
    id: row.id,
    internId: row.intern_id,
    timeIn: row.time_in,
    timeOut: row.time_out,
    renderedHours: row.rendered_hours,
    createdAt: row.created_at,
    isOpen: row.time_out === null,
  };
}

/**
 * AttendanceService.getDayRange: a 'YYYY-MM-DD' UTC day, or today's UTC day when the
 * value is missing/empty (Nest passes '' through and `if (date)` treats it as absent).
 */
function dayRange(date: string | null): { startMs: number; endMs: number; dateLabel: string } {
  let base: Date;

  if (date) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw badRequest('date must be formatted as YYYY-MM-DD.');
    }

    base = new Date(`${date}T00:00:00.000Z`);
    if (Number.isNaN(base.getTime())) {
      throw badRequest('date must be a valid calendar date.');
    }
  } else {
    const now = new Date();
    base = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  }

  const startMs = Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate());
  return {
    startMs,
    endMs: startMs + DAY_MS,
    dateLabel: new Date(startMs).toISOString().slice(0, 10),
  };
}

/** AttendanceService.getInternIdByUserId (a missing user also resolves to the 404). */
function currentIntern(req: DemoRequest): InternRow {
  const intern = req.currentUser ? internByUserId(req.db, req.currentUser.id) : null;
  if (!intern) {
    throw new DemoHttpError(404, INTERN_NOT_FOUND, 'Not Found');
  }
  return intern;
}

/** AttendanceService.getOpenSession: the intern's open row (latest time_in), or null. */
function openSession(db: DemoDb, internId: string): AttendanceRow | null {
  const open = db.attendance.filter((row) => row.intern_id === internId && row.time_out === null);
  return byTimeInDesc(open)[0] ?? null;
}

/** Team name for the live page: role-'intern' membership, else interns.team_id, else 'Unassigned'. */
function liveTeamName(db: DemoDb, intern: InternRow): string {
  const teamId = internTeamMembership(db, intern.user_id)?.team_id ?? intern.team_id;
  if (!teamId) {
    return 'Unassigned';
  }
  return teamById(db, teamId)?.name ?? 'Unassigned';
}

export const routes: DemoRoute[] = [
  // GET /attendance/live ----------------------------------------------------
  {
    method: 'GET',
    pattern: '/attendance/live',
    handle: (req) => {
      // @Query('batchId', ParseUUIDPipe) runs before the service's date parsing.
      const batchId = req.query.get('batchId');
      if (!isUuid(batchId)) {
        throw badRequest('Validation failed (uuid is expected)');
      }

      const { startMs, endMs, dateLabel } = dayRange(req.query.get('date'));
      const db = req.db;

      const seen = new Set<string>();
      const interns = internsInBatch(db, batchId).filter((intern) => {
        if (seen.has(intern.id)) return false;
        seen.add(intern.id);
        return true;
      });

      if (interns.length === 0) {
        return ok({ batchId, date: dateLabel, rows: [] as LiveAttendanceRowDto[] });
      }

      // Sessions that STARTED inside the UTC day, newest first; the first per intern wins.
      const latestByInternId = new Map<string, AttendanceRow>();
      const dayRows = byTimeInDesc(
        db.attendance.filter((row) => {
          if (!seen.has(row.intern_id)) return false;
          const ms = timeMs(row.time_in);
          return ms >= startMs && ms < endMs;
        })
      );
      for (const row of dayRows) {
        if (!latestByInternId.has(row.intern_id)) {
          latestByInternId.set(row.intern_id, row);
        }
      }

      const rows: LiveAttendanceRowDto[] = interns
        .map((intern) => {
          const user = userById(db, intern.user_id);
          const attendance = latestByInternId.get(intern.id);

          return {
            internId: intern.id,
            userId: intern.user_id,
            internName: user?.name?.trim() || user?.github_username?.trim() || 'Unknown Intern',
            team: liveTeamName(db, intern),
            clockIn: attendance?.time_in ?? null,
            clockOut: attendance?.time_out ?? null,
            status: (attendance?.time_in ? 'present' : 'pending') as LiveAttendanceStatus,
          };
        })
        .sort((a, b) => a.internName.localeCompare(b.internName));

      return ok({ batchId, date: dateLabel, rows });
    },
  },

  // POST /attendance/time-in ------------------------------------------------
  {
    method: 'POST',
    pattern: '/attendance/time-in',
    handle: (req) => {
      const intern = currentIntern(req);
      const db = req.db;

      if (openSession(db, intern.id)) {
        throw badRequest('You are already timed in.');
      }

      const now = new Date().toISOString();
      const row: AttendanceRow = {
        id: newId(),
        intern_id: intern.id,
        time_in: now,
        time_out: null,
        rendered_hours: null,
        created_at: now,
      };
      db.attendance.push(row);

      return created(mapRow(row));
    },
  },

  // POST /attendance/time-out -----------------------------------------------
  {
    method: 'POST',
    pattern: '/attendance/time-out',
    handle: (req) => {
      const intern = currentIntern(req);
      const session = openSession(req.db, intern.id);

      if (!session) {
        throw badRequest('You cannot time out without timing in.');
      }

      // computeRenderedHours
      const timeOut = new Date();
      const diffMs = timeOut.getTime() - new Date(session.time_in).getTime();
      if (diffMs < 0) {
        throw badRequest('timeOut cannot be before timeIn.');
      }

      session.time_out = timeOut.toISOString();
      session.rendered_hours = Math.round((diffMs / HOUR_MS) * 100) / 100;

      return created(mapRow(session));
    },
  },

  // GET /attendance/:internId -----------------------------------------------
  {
    method: 'GET',
    pattern: '/attendance/:internId',
    handle: (req) => {
      const internId = uuidParam(req, 'internId');

      // Raw @Query values ('' stays '' and is echoed back, but filters nothing).
      const from = req.query.get('from') ?? undefined;
      const to = req.query.get('to') ?? undefined;

      if (from && Number.isNaN(new Date(from).getTime())) {
        throw badRequest('from must be a valid date/time.');
      }
      if (to && Number.isNaN(new Date(to).getTime())) {
        throw badRequest('to must be a valid date/time.');
      }

      const fromMs = from ? new Date(from).getTime() : null;
      const toMs = to ? new Date(to).getTime() : null;

      const logs = byTimeInDesc(
        req.db.attendance.filter((row) => {
          if (row.intern_id !== internId) return false;
          const ms = timeMs(row.time_in);
          if (fromMs !== null && ms < fromMs) return false;
          if (toMs !== null && ms > toMs) return false;
          return true;
        })
      ).map(mapRow);

      const totalHours = round2(logs.reduce((sum, log) => sum + (log.renderedHours ?? 0), 0));

      return ok({
        internId,
        from: from ?? null,
        to: to ?? null,
        totalHours,
        logs,
      });
    },
  },
];
