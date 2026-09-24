/**
 * Date helpers for the demo backend.
 *
 * Conventions (mirror the real backend + UI):
 * - Day logic uses UTC date keys: utcDateKey(d) === d.toISOString().slice(0, 10).
 * - Report periods are stored as localTimestamp(key) = 'YYYY-MM-DDT00:00:00'
 *   (Postgres `timestamp` without tz; the browser parses it as local time).
 * - Other timestamps are ISO strings with 'Z'.
 * - Batch dates are plain 'YYYY-MM-DD'.
 * The title builders copy components/report-form-modal.tsx exactly.
 */

export const MINUTE_MS = 60_000;
export const HOUR_MS = 3_600_000;
export const DAY_MS = 86_400_000;

type DateInput = Date | string | number;

function toDate(value: DateInput): Date {
  if (value instanceof Date) {
    return value;
  }

  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T00:00:00.000Z`);
  }

  return new Date(value);
}

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

export function nowIso(): string {
  return new Date().toISOString();
}

/** UTC 'YYYY-MM-DD' of a date (default: now). A date key passes through. */
export function utcDateKey(value: DateInput = new Date()): string {
  return toDate(value).toISOString().slice(0, 10);
}

/** New Date shifted by n whole days (UTC arithmetic). */
export function addDays(value: DateInput, days: number): Date {
  return new Date(toDate(value).getTime() + days * DAY_MS);
}

/** UTC midnight of the given day. */
export function startOfUtcDay(value: DateInput = new Date()): Date {
  return new Date(`${utcDateKey(value)}T00:00:00.000Z`);
}

/** UTC date key n days from `from` (negative = past), i.e. D(n). */
export function dayKey(offsetDays: number, from: DateInput = new Date()): string {
  return utcDateKey(addDays(from, offsetDays));
}

/** Add n days to a 'YYYY-MM-DD' key. */
export function addDaysToKey(key: string, days: number): string {
  return utcDateKey(addDays(key, days));
}

/** ISO string for `from` minus days/hours/minutes. */
export function daysAgoIso(
  days: number,
  hours = 0,
  minutes = 0,
  from: DateInput = new Date()
): string {
  const base = toDate(from).getTime();
  return new Date(base - days * DAY_MS - hours * HOUR_MS - minutes * MINUTE_MS).toISOString();
}

/** ISO string at a UTC wall-clock time on a date key, e.g. isoAt('2026-09-21', 0, 45). */
export function isoAt(key: string, hours: number, minutes = 0, seconds = 0): string {
  const base = new Date(`${key}T00:00:00.000Z`).getTime();
  return new Date(base + hours * HOUR_MS + minutes * MINUTE_MS + seconds * 1000).toISOString();
}

/** Returns iso if it is not after `now`, otherwise now minus marginMinutes. */
export function clampPast(iso: string, now: DateInput = new Date(), marginMinutes = 1): string {
  const limit = toDate(now).getTime();
  const value = new Date(iso).getTime();
  return value <= limit ? iso : new Date(limit - marginMinutes * MINUTE_MS).toISOString();
}

/** Saturday or Sunday in UTC. */
export function isWeekend(value: DateInput): boolean {
  const day = toDate(value).getUTCDay();
  return day === 0 || day === 6;
}

/**
 * The n most recent weekdays BEFORE today's UTC date (today excluded), as UTC
 * date keys ordered oldest -> newest.
 */
export function pastWeekdays(n: number, from: DateInput = new Date()): string[] {
  const keys: string[] = [];
  let cursor = addDays(startOfUtcDay(from), -1);

  while (keys.length < n) {
    if (!isWeekend(cursor)) {
      keys.push(utcDateKey(cursor));
    }
    cursor = addDays(cursor, -1);
  }

  return keys.reverse();
}

/** UTC date key of the Monday of the week containing the date (Sunday -> previous Monday). */
export function mondayOf(value: DateInput): string {
  const day = startOfUtcDay(value);
  const dayNumber = day.getUTCDay() || 7;
  return utcDateKey(addDays(day, -(dayNumber - 1)));
}

/** 'YYYY-MM-DDT00:00:00' (no tz) for a date key or ISO string. */
export function localTimestamp(value: string): string {
  const key = toDateKey(value) ?? value.slice(0, 10);
  return `${key}T00:00:00`;
}

/**
 * First 'YYYY-MM-DD' substring of a value, else its UTC date key. Same logic as
 * toDateKey in components/InternProfileView.tsx (used for EOD <-> attendance).
 */
export function toDateKey(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const match = value.match(/\d{4}-\d{2}-\d{2}/);
  if (match) {
    return match[0];
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString().slice(0, 10);
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Hours between two ISO timestamps, rounded to 2 decimals (attendance.rendered_hours). */
export function hoursBetween(startIso: string, endIso: string): number {
  return round2((new Date(endIso).getTime() - new Date(startIso).getTime()) / HOUR_MS);
}

/**
 * Relative time exactly like the backend team dashboard
 * (teams.service.ts formatRelativeTime): 'just now' | 'Nm ago' | 'Nh ago' | 'Nd ago'.
 */
export function relativeTimeShort(iso: string, now: DateInput = new Date()): string {
  const target = new Date(iso).getTime();
  if (Number.isNaN(target)) {
    return 'unknown';
  }

  const diffMs = Math.max(0, toDate(now).getTime() - target);
  const minutes = Math.floor(diffMs / MINUTE_MS);
  const hours = Math.floor(diffMs / HOUR_MS);
  const days = Math.floor(diffMs / DAY_MS);

  if (minutes < 1) {
    return 'just now';
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  if (hours < 24) {
    return `${hours}h ago`;
  }

  return `${days}d ago`;
}

// --- Report form mirrors (components/report-form-modal.tsx) ---

const WEEK_LABEL_FORMAT = { month: 'short', day: 'numeric', year: 'numeric' } as const;

/**
 * Mirror of getWeekPeriod: normalizes any date key to its Monday and returns
 * the Monday..Friday keys, or null for an invalid value.
 */
export function weekPeriod(weekStartKey: string): { periodStart: string; periodEnd: string } | null {
  const weekStart = new Date(`${weekStartKey}T00:00:00.000Z`);

  if (Number.isNaN(weekStart.getTime())) {
    return null;
  }

  const dayNumber = weekStart.getUTCDay() || 7;
  weekStart.setUTCDate(weekStart.getUTCDate() - (dayNumber - 1));

  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekStart.getUTCDate() + 4);

  return {
    periodStart: weekStart.toISOString().split('T')[0],
    periodEnd: weekEnd.toISOString().split('T')[0],
  };
}

function formatWeekDay(key: string): string {
  return new Date(`${key}T00:00:00.000Z`).toLocaleDateString('default', WEEK_LABEL_FORMAT);
}

/** 'EOD Report - 9/23/2026' (local toLocaleDateString of that calendar day, like the form). */
export function eodTitle(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  return `EOD Report - ${new Date(year, month - 1, day).toLocaleDateString()}`;
}

/** 'Weekly Report - Sep 14, 2026 - Sep 18, 2026' */
export function weeklyTitle(mondayKey: string, fridayKey: string): string {
  return `Weekly Report - ${formatWeekDay(mondayKey)} - ${formatWeekDay(fridayKey)}`;
}

/** 'Monthly Report - August 2026'. monthIndex is 0-based (0 = January). */
export function monthlyTitle(year: number, monthIndex: number): string {
  const label = new Date(year, monthIndex, 1).toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  });
  return `Monthly Report - ${label}`;
}

/** Calendar month period as UTC date keys (first..last day). monthIndex is 0-based. */
export function monthPeriod(year: number, monthIndex: number): { periodStart: string; periodEnd: string } {
  const start = new Date(Date.UTC(year, monthIndex, 1));
  const end = new Date(Date.UTC(year, monthIndex + 1, 0));
  return { periodStart: utcDateKey(start), periodEnd: utcDateKey(end) };
}

/**
 * Exact mirror of the form's getMonthPeriod (local-midnight toISOString), which
 * shifts a day back in UTC+ zones (Sept -> '2026-08-31'..'2026-09-29' in UTC+8).
 * Use it only to reason about what the live form will POST.
 */
export function formMonthPeriod(year: number, monthIndex: number): { periodStart: string; periodEnd: string } {
  return {
    periodStart: new Date(year, monthIndex, 1).toISOString().split('T')[0],
    periodEnd: new Date(year, monthIndex + 1, 0).toISOString().split('T')[0],
  };
}

/** 'HH:MM' wall clock of an ISO timestamp in a fixed UTC offset (default PHT, +8). */
export function clockAt(iso: string, offsetHours = 8): string {
  const shifted = new Date(new Date(iso).getTime() + offsetHours * HOUR_MS);
  return `${pad2(shifted.getUTCHours())}:${pad2(shifted.getUTCMinutes())}`;
}
