/**
 * Row types of the demo mock database.
 *
 * Each row type mirrors a Supabase table used by koda-backend
 * (koda-backend/supabase/migrations), with the same snake_case column names.
 * Demo-only extras are marked. API response shapes (camelCase DTOs, joins) are
 * built by the domain handlers from these rows; never store DTOs here.
 *
 * Timestamp conventions (see lib/demo/time.ts):
 * - created_at / updated_at / submitted_at / assigned_at / time_in / time_out:
 *   ISO strings with 'Z', never in the future.
 * - reports.period_start / period_end: 'YYYY-MM-DDT00:00:00' (no tz).
 * - batches.start_date / end_date: 'YYYY-MM-DD'.
 */

export type Role = 'admin' | 'coordinator' | 'team_lead' | 'intern';

/** UI-only user status. The real backend has no column; the demo stores it. */
export type UserStatus = 'active' | 'pending' | 'inactive';

export type IssueState = 'open' | 'in_progress' | 'closed';

export type ReportStatus = 'draft' | 'submitted' | 'reviewed' | 'pending';

/** users */
export interface UserRow {
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
  /** DEMO-ONLY: stored so an 'inactive' edit survives (UI reads user.status). */
  status?: UserStatus;
}

/** interns (one per user at most; interns.id !== users.id) */
export interface InternRow {
  id: string;
  user_id: string;
  /** Kept in sync with the team_members row (role 'intern') in demo mode. */
  team_id: string | null;
  created_at: string;
  school: string | null;
  /** DEMO-ONLY: title shown on /interns/dashboard, e.g. 'Full-Stack Intern'. */
  role?: string;
}

/** batches */
export interface BatchRow {
  id: string;
  name: string;
  description: string | null;
  /** 'YYYY-MM-DD' */
  start_date: string;
  /** 'YYYY-MM-DD' */
  end_date: string;
  max_interns: number;
  /** Uppercase A-Z0-9, unique. */
  join_code: string;
  created_at: string;
  updated_at: string;
}

/** batch_interns (unique per intern_id: one batch per intern) */
export interface BatchInternRow {
  id: string;
  batch_id: string;
  intern_id: string;
  assigned_at: string;
}

/** teams */
export interface TeamRow {
  id: string;
  name: string;
  created_by: string | null;
  created_at: string;
  batch_id: string | null;
}

/** team_members (user-based membership; role 'intern' drives /auth/me team) */
export interface TeamMemberRow {
  id: string;
  team_id: string;
  user_id: string;
  role: Role;
}

/** repositories (id stays a UUID; issues.repo_id holds full_name in demo) */
export interface RepositoryRow {
  id: string;
  team_id: string | null;
  github_repo_id: string;
  name: string;
  owner: string;
  /** GitHub API url, e.g. https://api.github.com/repos/metawatt/leads-api */
  url: string;
  /** e.g. 'metawatt/leads-api' */
  full_name: string;
  /** e.g. https://github.com/metawatt/leads-api */
  html_url: string;
  created_at: string;
}

/** GitHub label object stored in issues.labels (UI only reads name). */
export interface GitHubLabel {
  id: number;
  node_id: string;
  url: string;
  name: string;
  color: string;
  default: boolean;
  description: string | null;
}

/** issues */
export interface IssueRow {
  id: string;
  /**
   * DEMO DEVIATION: the repository full_name (e.g. 'metawatt/leads-api')
   * instead of the repositories.id UUID, because the UI prints it verbatim.
   * Resolve with repoForIssue() in lookups.ts.
   */
  repo_id: string;
  /** Plain issue number string, e.g. '145'. */
  github_issue_id: string;
  title: string;
  state: IssueState;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  labels: GitHubLabel[];
  raw_payload: Record<string, unknown>;
}

/** issue_assignments (0 or 1 per issue in the seed) */
export interface IssueAssignmentRow {
  id: string;
  issue_id: string;
  /** interns.id (NOT users.id) */
  intern_id: string;
  manual: boolean;
  assigned_at: string;
}

/** reports (type is decided by the title prefix: EOD / Weekly / Monthly Report) */
export interface ReportRow {
  id: string;
  /** interns.id */
  intern_id: string;
  title: string;
  content: string;
  /** 'YYYY-MM-DDT00:00:00' */
  period_start: string;
  /** 'YYYY-MM-DDT00:00:00' */
  period_end: string;
  submitted_at: string;
  status: ReportStatus;
}

/** attendance (at most one open session per intern: time_out === null) */
export interface AttendanceRow {
  id: string;
  /** interns.id */
  intern_id: string;
  time_in: string;
  time_out: string | null;
  /** round2(hours between time_in and time_out); null while open */
  rendered_hours: number | null;
  created_at: string;
}

export interface DemoTables {
  users: UserRow[];
  interns: InternRow[];
  batches: BatchRow[];
  batch_interns: BatchInternRow[];
  teams: TeamRow[];
  team_members: TeamMemberRow[];
  repositories: RepositoryRow[];
  issues: IssueRow[];
  issue_assignments: IssueAssignmentRow[];
  reports: ReportRow[];
  attendance: AttendanceRow[];
}

export type DemoTableName = keyof DemoTables;

export const DEMO_TABLE_NAMES: DemoTableName[] = [
  'users',
  'interns',
  'batches',
  'batch_interns',
  'teams',
  'team_members',
  'repositories',
  'issues',
  'issue_assignments',
  'reports',
  'attendance',
];

/** The whole mock database. Tables are flat arrays on the object. */
export interface DemoDb extends DemoTables {
  version: number;
  /** UTC date key (YYYY-MM-DD) the seed was generated for. */
  seededFor: string;
  /** ISO timestamp of seed generation. */
  seededAt: string;
}
