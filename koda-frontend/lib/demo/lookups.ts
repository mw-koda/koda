/**
 * Shared read helpers over the demo database, used by every domain handler.
 *
 * All helpers are pure reads (no mutation) and take the DemoDb explicitly.
 * Id reminders: interns.id !== users.id. Keyed by intern id: reports,
 * attendance, issue_assignments, batch_interns. Keyed by user id: team_members,
 * teams.created_by, interns.user_id.
 */

import { ids, isUuid } from './ids';
import type {
  BatchRow,
  DemoDb,
  InternRow,
  IssueAssignmentRow,
  IssueRow,
  RepositoryRow,
  Role,
  TeamMemberRow,
  TeamRow,
  UserRow,
  UserStatus,
} from './types';

/** USER_SELECT_FIELDS projection (koda-backend/src/auth/users/user-select.ts) + demo status. */
export interface UserDto {
  id: string;
  github_id: string | null;
  github_username: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: Role;
  is_onboarded: boolean;
  school_name: string | null;
  created_at: string;
  updated_at: string;
  /** DEMO-ONLY, present only when stored on the row. */
  status?: UserStatus;
}

/** Nested `user` object inside /interns responses. */
export interface InternUserEmbed {
  id: string;
  github_username: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
}

export function userById(db: DemoDb, id: string | null | undefined): UserRow | null {
  if (!id) return null;
  return db.users.find((user) => user.id === id) ?? null;
}

/** Exact-case match like the backend (`eq('github_username', ...)`). */
export function userByUsername(db: DemoDb, username: string | null | undefined): UserRow | null {
  if (!username) return null;
  return db.users.find((user) => user.github_username === username) ?? null;
}

export function internById(db: DemoDb, id: string | null | undefined): InternRow | null {
  if (!id) return null;
  return db.interns.find((intern) => intern.id === id) ?? null;
}

export function internByUserId(db: DemoDb, userId: string | null | undefined): InternRow | null {
  if (!userId) return null;
  return db.interns.find((intern) => intern.user_id === userId) ?? null;
}

export function batchById(db: DemoDb, id: string | null | undefined): BatchRow | null {
  if (!id) return null;
  return db.batches.find((batch) => batch.id === id) ?? null;
}

export function batchByJoinCode(db: DemoDb, code: string | null | undefined): BatchRow | null {
  if (!code) return null;
  const normalized = code.trim().toUpperCase();
  return db.batches.find((batch) => batch.join_code.toUpperCase() === normalized) ?? null;
}

/**
 * Backend resolveBatchId: a UUID is looked up as a batch id, anything else as
 * a case-insensitive join code. Returns the batch id, or null if none matches.
 */
export function resolveBatchId(db: DemoDb, idOrJoinCode: string | null | undefined): string | null {
  if (!idOrJoinCode) return null;
  const value = idOrJoinCode.trim();
  if (!value) return null;

  if (isUuid(value)) {
    return batchById(db, value)?.id ?? null;
  }

  return batchByJoinCode(db, value)?.id ?? null;
}

export function teamById(db: DemoDb, id: string | null | undefined): TeamRow | null {
  if (!id) return null;
  return db.teams.find((team) => team.id === id) ?? null;
}

/** Teams of a batch, newest created_at first (GET /teams ordering). */
export function teamsForBatch(db: DemoDb, batchId: string): TeamRow[] {
  return db.teams
    .filter((team) => team.batch_id === batchId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function teamMembers(db: DemoDb, teamId: string): TeamMemberRow[] {
  return db.team_members.filter((member) => member.team_id === teamId);
}

/** The user's FIRST team_members row with role 'intern' (drives /auth/me team_id/team_name). */
export function internTeamMembership(db: DemoDb, userId: string): TeamMemberRow | null {
  return db.team_members.find((member) => member.user_id === userId && member.role === 'intern') ?? null;
}

/** Batch id of an intern via batch_interns (one batch per intern). */
export function batchIdForIntern(db: DemoDb, internId: string): string | null {
  return db.batch_interns.find((row) => row.intern_id === internId)?.batch_id ?? null;
}

/** Interns enrolled in a batch (batch_interns order). */
export function internsInBatch(db: DemoDb, batchId: string): InternRow[] {
  return db.batch_interns
    .filter((row) => row.batch_id === batchId)
    .map((row) => internById(db, row.intern_id))
    .filter((intern): intern is InternRow => intern !== null);
}

export function repoById(db: DemoDb, id: string | null | undefined): RepositoryRow | null {
  if (!id) return null;
  return db.repositories.find((repo) => repo.id === id) ?? null;
}

export function repoByFullName(db: DemoDb, fullName: string | null | undefined): RepositoryRow | null {
  if (!fullName) return null;
  return db.repositories.find((repo) => repo.full_name === fullName) ?? null;
}

/** Repository of an issue. issues.repo_id holds full_name in demo, but a UUID also works. */
export function repoForIssue(db: DemoDb, issue: IssueRow): RepositoryRow | null {
  return repoByFullName(db, issue.repo_id) ?? repoById(db, issue.repo_id);
}

export function issueById(db: DemoDb, id: string | null | undefined): IssueRow | null {
  if (!id) return null;
  return db.issues.find((issue) => issue.id === id) ?? null;
}

export function assignmentsForIssue(db: DemoDb, issueId: string): IssueAssignmentRow[] {
  return db.issue_assignments.filter((row) => row.issue_id === issueId);
}

export function assignmentsForIntern(db: DemoDb, internId: string): IssueAssignmentRow[] {
  return db.issue_assignments.filter((row) => row.intern_id === internId);
}

/** The issue's FIRST assignment with its intern and user (backend assignee_* source), or null. */
export function issueAssignee(
  db: DemoDb,
  issueId: string
): { assignment: IssueAssignmentRow; intern: InternRow; user: UserRow } | null {
  for (const assignment of assignmentsForIssue(db, issueId)) {
    const intern = internById(db, assignment.intern_id);
    const user = intern ? userById(db, intern.user_id) : null;
    if (intern && user) {
      return { assignment, intern, user };
    }
  }
  return null;
}

/** The USER_SELECT_FIELDS projection of a user row (+ status when stored). */
export function userRow(user: UserRow): UserDto {
  const dto: UserDto = {
    id: user.id,
    github_id: user.github_id,
    github_username: user.github_username,
    name: user.name,
    email: user.email,
    avatar_url: user.avatar_url,
    role: user.role,
    is_onboarded: user.is_onboarded,
    school_name: user.school_name,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };

  if (user.status) {
    dto.status = user.status;
  }

  return dto;
}

/** The `user` object embedded in /interns rows and batch assignedInterns. */
export function internUserEmbed(user: UserRow | null): InternUserEmbed | null {
  if (!user) return null;
  return {
    id: user.id,
    github_username: user.github_username,
    name: user.name,
    email: user.email,
    avatar_url: user.avatar_url,
  };
}

/** Display name like most of the UI: name, falling back to github_username. */
export function displayName(user: UserRow | null | undefined): string {
  if (!user) return 'Unknown';
  return user.name?.trim() || user.github_username;
}

/**
 * The flattened joins JwtStrategy adds to a user (no demo deviations):
 * intern row, its batch, school, and the role-'intern' team membership.
 */
export function userContext(
  db: DemoDb,
  user: UserRow
): {
  intern: InternRow | null;
  internId: string | null;
  batchId: string | null;
  school: string | null;
  teamId: string | null;
  teamName: string | null;
} {
  const intern = internByUserId(db, user.id);
  const membership = internTeamMembership(db, user.id);
  const team = membership ? teamById(db, membership.team_id) : null;

  return {
    intern,
    internId: intern?.id ?? null,
    batchId: intern ? batchIdForIntern(db, intern.id) : null,
    school: intern?.school ?? null,
    teamId: membership?.team_id ?? null,
    teamName: team?.name ?? null,
  };
}

/** Batch the demo treats as "current" for staff users: B1 if present, else the newest active batch. */
export function defaultBatchId(db: DemoDb): string | null {
  const b1 = batchById(db, ids.batch('B1'));
  if (b1) return b1.id;

  const today = new Date().toISOString().slice(0, 10);
  const active = [...db.batches]
    .filter((batch) => batch.end_date >= today)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  return active[0]?.id ?? db.batches[0]?.id ?? null;
}
