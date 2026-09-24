/**
 * Canonical demo seed: createSeed(now) builds the whole DemoDb relative to `now`.
 *
 * Deterministic: ids come from stable keys (ids.ts) and all variety comes from
 * seeded PRNGs (no Math.random). Only timestamps move: they are relative to `now`
 * (dates relative to today, issue activity relative to the current time).
 *
 * Cast (company Metawatt LLC, GitHub org metawatt):
 * - admin Michael Torres; team leads Andrea Villanueva, Kevin Lim, Daniel Reyes,
 *   Mika Santos (leads no team); coordinators Carl Mendoza, Grace Tan (GHL Team
 *   member), Rafael Santos (inactive).
 * - B1 'Batch 2026 Second Semester' (active, join KODA2026): 12 interns; Database
 *   Team (Sarah, Marcus, Emily), GHL Team (James, Aisha, David), Scraping Team
 *   (Lisa, Tom), Agentic Rag (no interns); Miguel, Angela, Joshua, Nicole have no team.
 * - B2 'Batch 2027 Summer Pilot' (upcoming, SUMMER27): empty.
 * - B3 'Batch 2026 First Semester' (completed, SEM1PILOT): 4 interns in Pilot Team.
 * - Pending signups Jennifer Lee, Paolo Reyes (join-flow persona) and kmorales.
 * - 4 repositories, 20 issues, attendance for ~15 past weekdays plus open
 *   sessions today, and EOD / weekly / monthly reports in the exact form templates.
 */

import { DEMO_DB_VERSION } from './config';
import { createRng, hashString, ids, type Rng } from './ids';
import {
  HOUR_MS,
  MINUTE_MS,
  addDaysToKey,
  clampPast,
  clockAt,
  dayKey,
  eodTitle,
  isWeekend,
  isoAt,
  localTimestamp,
  mondayOf,
  monthPeriod,
  monthlyTitle,
  pastWeekdays,
  round2,
  startOfUtcDay,
  utcDateKey,
  weeklyTitle,
} from './time';
import type {
  AttendanceRow,
  BatchInternRow,
  BatchRow,
  DemoDb,
  GitHubLabel,
  InternRow,
  IssueAssignmentRow,
  IssueRow,
  IssueState,
  ReportRow,
  ReportStatus,
  RepositoryRow,
  Role,
  TeamMemberRow,
  TeamRow,
  UserRow,
  UserStatus,
} from './types';

export const DEMO_COMPANY = 'Metawatt LLC';
export const DEMO_GITHUB_ORG = 'metawatt';
export const SCHOOL_CIT = 'Cebu Institute of Technology University';
export const SCHOOL_USC = 'University of San Carlos';
export const SCHOOL_UC = 'University of Cebu';

/** Past weekdays (today excluded) of B1 attendance history. */
export const ATTENDANCE_WINDOW_DAYS = 15;

export type SeedBatchKey = 'B1' | 'B2' | 'B3';
export type SeedTeamKey = 'database' | 'ghl' | 'scraping' | 'agentic-rag' | 'pilot';
type Track = 'database' | 'ghl' | 'scraping' | 'general';

// ---------------------------------------------------------------------------
// Specs
// ---------------------------------------------------------------------------

interface StaffSpec {
  username: string;
  name: string;
  role: Role;
  daysAgo: number;
  school?: string | null;
  onboarded?: boolean;
  status?: UserStatus;
  githubId?: string | null;
  email?: string | null;
  avatar?: boolean;
}

const STAFF_AND_PENDING: StaffSpec[] = [
  { username: 'michaelt', name: 'Michael Torres', role: 'admin', daysAgo: 200 },
  { username: 'avillanueva', name: 'Andrea Villanueva', role: 'team_lead', daysAgo: 150 },
  { username: 'kevinlim', name: 'Kevin Lim', role: 'team_lead', daysAgo: 140 },
  { username: 'dreyes', name: 'Daniel Reyes', role: 'team_lead', daysAgo: 130 },
  { username: 'msantos', name: 'Mika Santos', role: 'team_lead', daysAgo: 125 },
  { username: 'carlm', name: 'Carl Mendoza', role: 'coordinator', daysAgo: 120, school: SCHOOL_CIT },
  { username: 'gracetan', name: 'Grace Tan', role: 'coordinator', daysAgo: 110, school: SCHOOL_USC },
  {
    username: 'rsantos',
    name: 'Rafael Santos',
    role: 'coordinator',
    daysAgo: 100,
    onboarded: false,
    status: 'inactive',
  },
  { username: 'jenniferlee', name: 'Jennifer Lee', role: 'intern', daysAgo: 2, onboarded: false },
  { username: 'paoloreyes', name: 'Paolo Reyes', role: 'intern', daysAgo: 1, onboarded: false },
  {
    username: 'kmorales',
    name: 'kmorales',
    role: 'intern',
    daysAgo: 4,
    onboarded: false,
    githubId: null,
    email: null,
    avatar: false,
  },
];

interface InternSpec {
  username: string;
  name: string;
  batch: SeedBatchKey;
  team: SeedTeamKey | null;
  school: string;
  /** interns.role (demo-only title) */
  title: string;
  userDaysAgo: number;
  assignedDaysAgo: number;
  /** Attended weekdays out of ATTENDANCE_WINDOW_DAYS (B1 only). */
  pastDays: number;
  /** UTC anchor [hours, minutes] of an OPEN session today. */
  openToday?: [number, number];
  track: Track;
  studentId: string;
  section: string;
  avatar?: boolean;
}

const INTERNS: InternSpec[] = [
  { username: 'sarahchen', name: 'Sarah Chen', batch: 'B1', team: 'database', school: SCHOOL_CIT, title: 'Full-Stack Intern', userDaysAgo: 62, assignedDaysAgo: 58, pastDays: 15, track: 'database', studentId: '2022-01184', section: 'BSIT 4-A' },
  { username: 'mrodriguez', name: 'Marcus Rodriguez', batch: 'B1', team: 'database', school: SCHOOL_CIT, title: 'Backend Intern', userDaysAgo: 61, assignedDaysAgo: 58, pastDays: 14, openToday: [0, 50], track: 'database', studentId: '2022-02217', section: 'BSCS 4-B' },
  { username: 'emilyw', name: 'Emily Watson', batch: 'B1', team: 'database', school: SCHOOL_CIT, title: 'Data Intern', userDaysAgo: 60, assignedDaysAgo: 57, pastDays: 13, track: 'database', studentId: '2022-00931', section: 'BSIT 4-B' },
  { username: 'jamesk', name: 'James Kim', batch: 'B1', team: 'ghl', school: SCHOOL_CIT, title: 'Frontend Intern', userDaysAgo: 59, assignedDaysAgo: 57, pastDays: 12, openToday: [0, 44], track: 'ghl', studentId: '2022-03348', section: 'BSCS 4-A' },
  { username: 'aishap', name: 'Aisha Patel', batch: 'B1', team: 'ghl', school: SCHOOL_USC, title: 'Frontend Intern', userDaysAgo: 58, assignedDaysAgo: 56, pastDays: 11, track: 'ghl', studentId: '22-10457', section: 'BSCS 4' },
  { username: 'davidj', name: 'David Johnson', batch: 'B1', team: 'ghl', school: SCHOOL_CIT, title: 'Full-Stack Intern', userDaysAgo: 57, assignedDaysAgo: 56, pastDays: 9, track: 'ghl', studentId: '2022-01562', section: 'BSIT 4-C', avatar: false },
  { username: 'lisan', name: 'Lisa Nguyen', batch: 'B1', team: 'scraping', school: SCHOOL_CIT, title: 'Automation Intern', userDaysAgo: 56, assignedDaysAgo: 55, pastDays: 5, openToday: [1, 7], track: 'scraping', studentId: '2022-02890', section: 'BSCpE 4-A' },
  { username: 'tomand', name: 'Tom Anderson', batch: 'B1', team: 'scraping', school: SCHOOL_USC, title: 'Data Intern', userDaysAgo: 55, assignedDaysAgo: 54, pastDays: 15, track: 'scraping', studentId: '22-11873', section: 'BSIT 4' },
  { username: 'migueldc', name: 'Miguel Dela Cruz', batch: 'B1', team: null, school: SCHOOL_CIT, title: 'Full-Stack Intern', userDaysAgo: 54, assignedDaysAgo: 53, pastDays: 12, openToday: [0, 56], track: 'general', studentId: '2022-04012', section: 'BSIT 4-A' },
  { username: 'angelaramos', name: 'Angela Ramos', batch: 'B1', team: null, school: SCHOOL_USC, title: 'Frontend Intern', userDaysAgo: 53, assignedDaysAgo: 52, pastDays: 12, track: 'general', studentId: '22-12094', section: 'BSCS 4' },
  { username: 'joshuauy', name: 'Joshua Uy', batch: 'B1', team: null, school: SCHOOL_UC, title: 'Data Intern', userDaysAgo: 52, assignedDaysAgo: 51, pastDays: 8, track: 'general', studentId: '22-3-01745', section: 'BSIT 4-B' },
  { username: 'nicolegarcia', name: 'Nicole Garcia', batch: 'B1', team: null, school: SCHOOL_CIT, title: 'Automation Intern', userDaysAgo: 50, assignedDaysAgo: 50, pastDays: 0, track: 'general', studentId: '2022-04421', section: 'BSCpE 4-B' },
  { username: 'biancaf', name: 'Bianca Flores', batch: 'B3', team: 'pilot', school: SCHOOL_CIT, title: 'Full-Stack Intern', userDaysAgo: 245, assignedDaysAgo: 243, pastDays: 0, track: 'database', studentId: '2021-01377', section: 'BSIT 4-A' },
  { username: 'ryanc', name: 'Ryan Castillo', batch: 'B3', team: 'pilot', school: SCHOOL_CIT, title: 'Backend Intern', userDaysAgo: 245, assignedDaysAgo: 243, pastDays: 0, track: 'database', studentId: '2021-02051', section: 'BSCS 4-A' },
  { username: 'kylen', name: 'Kyle Navarro', batch: 'B3', team: 'pilot', school: SCHOOL_USC, title: 'Frontend Intern', userDaysAgo: 245, assignedDaysAgo: 242, pastDays: 0, track: 'ghl', studentId: '21-10988', section: 'BSCS 4' },
  { username: 'maeb', name: 'Mae Bautista', batch: 'B3', team: 'pilot', school: SCHOOL_CIT, title: 'Data Intern', userDaysAgo: 245, assignedDaysAgo: 241, pastDays: 0, track: 'scraping', studentId: '2021-03310', section: 'BSIT 4-B' },
];

interface BatchSpec {
  key: SeedBatchKey;
  name: string;
  description: string;
  startOffset: number;
  endOffset: number;
  maxInterns: number;
  joinCode: string;
  createdDaysAgo: number;
}

const BATCHES: BatchSpec[] = [
  {
    key: 'B1',
    name: 'Batch 2026 Second Semester',
    description: 'Second-semester cohort covering full-stack, data and automation tracks.',
    startOffset: -60,
    endOffset: 60,
    maxInterns: 20,
    joinCode: 'KODA2026',
    createdDaysAgo: 75,
  },
  {
    key: 'B2',
    name: 'Batch 2027 Summer Pilot',
    description: 'Summer pilot cohort for incoming third-year students.',
    startOffset: 21,
    endOffset: 111,
    maxInterns: 10,
    joinCode: 'SUMMER27',
    createdDaysAgo: 5,
  },
  {
    key: 'B3',
    name: 'Batch 2026 First Semester',
    description: 'First-semester pilot cohort that launched the KODA program.',
    startOffset: -240,
    endOffset: -120,
    maxInterns: 4,
    joinCode: 'SEM1PILOT',
    createdDaysAgo: 250,
  },
];

interface TeamSpec {
  key: SeedTeamKey;
  name: string;
  batch: SeedBatchKey;
  lead: string;
  createdDaysAgo: number;
  extraMembers?: Array<{ username: string; role: Role }>;
}

const TEAMS: TeamSpec[] = [
  { key: 'database', name: 'Database Team', batch: 'B1', lead: 'avillanueva', createdDaysAgo: 72 },
  {
    key: 'ghl',
    name: 'GHL Team',
    batch: 'B1',
    lead: 'kevinlim',
    createdDaysAgo: 71,
    extraMembers: [{ username: 'gracetan', role: 'coordinator' }],
  },
  { key: 'scraping', name: 'Scraping Team', batch: 'B1', lead: 'dreyes', createdDaysAgo: 70 },
  { key: 'agentic-rag', name: 'Agentic Rag', batch: 'B1', lead: 'avillanueva', createdDaysAgo: 30 },
  { key: 'pilot', name: 'Pilot Team', batch: 'B3', lead: 'kevinlim', createdDaysAgo: 244 },
];

const REPOS: Array<{ name: string; githubRepoId: string; team: SeedTeamKey; createdDaysAgo: number }> = [
  { name: 'leads-api', githubRepoId: '781203456', team: 'database', createdDaysAgo: 70 },
  { name: 'ghl-dashboard', githubRepoId: '781203457', team: 'ghl', createdDaysAgo: 69 },
  { name: 'lead-scraper', githubRepoId: '781203458', team: 'scraping', createdDaysAgo: 68 },
  { name: 'rag-agent', githubRepoId: '781203459', team: 'agentic-rag', createdDaysAgo: 30 },
];

const LABELS: Record<string, { color: string; isDefault: boolean; description: string }> = {
  bug: { color: 'd73a4a', isDefault: true, description: "Something isn't working" },
  documentation: { color: '0075ca', isDefault: true, description: 'Improvements or additions to documentation' },
  enhancement: { color: 'a2eeef', isDefault: true, description: 'New feature or request' },
  'good first issue': { color: '7057ff', isDefault: true, description: 'Good for newcomers' },
  'priority: high': { color: 'b60205', isDefault: false, description: 'Needs attention this sprint' },
  critical: { color: 'e11d21', isDefault: false, description: 'Blocks a release or a production flow' },
  p1: { color: 'd93f0b', isDefault: false, description: 'Top priority for the current milestone' },
  performance: { color: 'fbca04', isDefault: false, description: 'Speed, memory or query performance' },
  security: { color: 'ee0701', isDefault: false, description: 'Security-sensitive change' },
  backend: { color: '5319e7', isDefault: false, description: 'API and server-side work' },
  frontend: { color: '1d76db', isDefault: false, description: 'Dashboard and UI code' },
  ui: { color: 'c5def5', isDefault: false, description: 'Visual and layout changes' },
  testing: { color: '0e8a16', isDefault: false, description: 'Unit, integration or end-to-end tests' },
  scraper: { color: 'bfd4f2', isDefault: false, description: 'Scraping pipeline' },
  rag: { color: 'd4c5f9', isDefault: false, description: 'Retrieval-augmented generation agent' },
  'data-quality': { color: 'f9d0c4', isDefault: false, description: 'Cleaning, normalization and dedupe' },
};

interface IssueSpec {
  repo: string;
  number: number;
  title: string;
  state: IssueState;
  assignee: string | null;
  labels: string[];
  /** [days, hours] ago */
  created: [number, number];
  /** [days, hours, minutes] ago */
  updated: [number, number, number];
  manual?: boolean;
}

/** Exactly 20 issues: 7 open, 6 in_progress, 7 closed; 2 unassigned. */
const ISSUES: IssueSpec[] = [
  { repo: 'leads-api', number: 152, title: 'Fix memory leak in data processing pipeline', state: 'in_progress', assignee: 'mrodriguez', labels: ['bug', 'priority: high', 'performance'], created: [9, 3], updated: [0, 0, 20] },
  { repo: 'leads-api', number: 156, title: 'Add rate limiting to API endpoints', state: 'in_progress', assignee: 'sarahchen', labels: ['enhancement', 'p1', 'backend'], created: [6, 5], updated: [0, 3, 5] },
  { repo: 'ghl-dashboard', number: 108, title: 'Fix chart rendering on Safari', state: 'open', assignee: 'davidj', labels: ['bug', 'priority: high', 'frontend'], created: [5, 2], updated: [1, 2, 10] },
  { repo: 'lead-scraper', number: 34, title: 'Handle pagination on search results', state: 'in_progress', assignee: 'lisan', labels: ['enhancement', 'priority: high', 'scraper'], created: [8, 1], updated: [3, 1, 25] },
  { repo: 'leads-api', number: 147, title: 'Update API documentation', state: 'open', assignee: 'sarahchen', labels: ['documentation'], created: [12, 4], updated: [4, 2, 40] },
  { repo: 'ghl-dashboard', number: 115, title: 'Add pipeline stage filter to opportunities view', state: 'open', assignee: null, labels: ['enhancement', 'good first issue'], created: [5, 6], updated: [4, 11, 15] },
  { repo: 'rag-agent', number: 12, title: 'Chunk PDFs with overlap for embeddings', state: 'open', assignee: 'sarahchen', labels: ['enhancement', 'rag'], created: [7, 2], updated: [5, 3, 50], manual: true },
  { repo: 'ghl-dashboard', number: 103, title: 'Implement real-time notifications', state: 'in_progress', assignee: 'jamesk', labels: ['enhancement', 'p1', 'frontend'], created: [14, 1], updated: [6, 1, 30] },
  { repo: 'lead-scraper', number: 37, title: 'Rotate proxies on 429 responses', state: 'open', assignee: 'tomand', labels: ['bug', 'critical', 'scraper'], created: [10, 5], updated: [6, 12, 5] },
  { repo: 'ghl-dashboard', number: 101, title: 'Create responsive mobile layout', state: 'open', assignee: 'aishap', labels: ['enhancement', 'ui'], created: [16, 3], updated: [7, 3, 45] },
  { repo: 'rag-agent', number: 15, title: 'Add citation links to agent answers', state: 'in_progress', assignee: 'migueldc', labels: ['enhancement', 'good first issue', 'rag'], created: [11, 2], updated: [8, 2, 20], manual: true },
  { repo: 'ghl-dashboard', number: 112, title: 'Implement data export functionality', state: 'in_progress', assignee: 'davidj', labels: ['enhancement', 'frontend'], created: [18, 4], updated: [9, 6, 15] },
  { repo: 'leads-api', number: 145, title: 'Implement OAuth authentication flow', state: 'closed', assignee: 'sarahchen', labels: ['security', 'critical', 'backend'], created: [24, 2], updated: [10, 4, 35] },
  { repo: 'ghl-dashboard', number: 89, title: 'Add dark mode support to dashboard', state: 'closed', assignee: 'jamesk', labels: ['enhancement', 'ui'], created: [26, 6], updated: [11, 7, 10] },
  { repo: 'lead-scraper', number: 29, title: 'Normalize company names before dedupe', state: 'closed', assignee: 'lisan', labels: ['enhancement', 'data-quality'], created: [22, 1], updated: [12, 3, 55] },
  { repo: 'leads-api', number: 95, title: 'Optimize database query performance', state: 'closed', assignee: 'mrodriguez', labels: ['performance', 'backend'], created: [28, 3], updated: [13, 5, 20] },
  { repo: 'ghl-dashboard', number: 110, title: 'Improve error handling in forms', state: 'closed', assignee: 'aishap', labels: ['bug', 'ui'], created: [20, 2], updated: [14, 2, 45] },
  { repo: 'leads-api', number: 154, title: 'Add unit tests for auth module', state: 'closed', assignee: 'sarahchen', labels: ['testing', 'backend'], created: [19, 5], updated: [15, 6, 5] },
  { repo: 'lead-scraper', number: 41, title: 'Retry failed page fetches with exponential backoff', state: 'closed', assignee: 'tomand', labels: ['enhancement', 'scraper'], created: [23, 4], updated: [17, 1, 30] },
  { repo: 'rag-agent', number: 9, title: 'Cache embedding requests', state: 'open', assignee: null, labels: ['performance', 'rag'], created: [25, 3], updated: [19, 4, 10] },
];

// ---------------------------------------------------------------------------
// Report prose (adapted from lib/mock-data.ts plus new entries)
// ---------------------------------------------------------------------------

type EodEntry = [task: string, success: string, challenge: string, plan: string];

const EOD_BANK: Record<Track, EodEntry[]> = {
  database: [
    ['Implemented the GitHub OAuth callback handler and wired it into the session service.', 'Login round trip now works end to end on staging.', 'State parameter mismatches when the callback opens in a new tab.', 'Add state validation tests and handle expired authorization codes.'],
    ['Hardened OAuth callback error handling and updated the structured logs.', 'Resolved the state mismatch edge cases and added request ids to every auth log line.', 'Waiting on the client ID rotation for final verification.', 'Finish the GitHub OAuth integration and validate staging redirects.'],
    ['Profiled the leads search endpoint and added composite indexes on status and created_at.', 'P95 latency for the leads search dropped from 820ms to 190ms.', 'EXPLAIN output differs between local and staging data volumes.', 'Refactor the remaining N+1 queries in the lead detail loader.'],
    ['Wrote unit tests for the token refresh and logout flows in the auth module.', 'Auth module coverage went from 54% to 81%.', 'Mocking the Supabase client took longer than expected.', 'Cover the role guard and add a coverage threshold to CI.'],
    ['Drafted the rate limiting middleware using a token bucket per API key.', 'Burst traffic from the load test is now throttled cleanly with 429 responses.', 'Still deciding where to keep bucket state across multiple instances.', 'Move bucket state to Redis and document the limits in the API reference.'],
    ['Updated the API documentation for the leads and contacts endpoints.', 'Every endpoint now has request and response examples.', 'A few response fields were undocumented and needed confirmation from Andrea.', 'Publish the docs to the internal portal and collect feedback.'],
    ['Investigated memory growth in the CSV import worker.', 'Reproduced the leak and traced it to unbounded buffering in the stream parser.', 'Need guidance on the acceptable memory ceiling for the worker.', 'Prototype a streaming fix and benchmark it with the 200k-row dataset.'],
    ['Reviewed pull requests for the leads-api release and fixed two failing migrations.', 'The release candidate passed the full regression suite.', 'No major blockers today.', 'Monitor the release and pick up the next rate limiting task.'],
    ['Added cursor pagination and sorting parameters to the leads endpoint.', 'Large result sets now load in pages of 50 without timeouts.', 'Keeping cursors stable when two leads share the same timestamp.', 'Add a tiebreaker on id and update the client examples.'],
    ['Paired on the memory leak fix for the data processing pipeline.', 'Worker memory now stays flat through a full import run.', 'The fix needs a longer soak test before release.', 'Run an overnight soak test and write up the findings.'],
  ],
  ghl: [
    ['Finalized the dark mode color tokens and updated the dashboard layout.', 'Synced tokens with the design system and refreshed the chart styles.', 'No blockers today.', 'Audit chart contrast and prepare handoff notes.'],
    ['Built the responsive navigation drawer for the mobile layout.', 'Header and sidebar now collapse correctly below 768px.', 'Wide tables still overflow on small screens.', 'Try a card-based layout for the pipeline table on mobile.'],
    ['Connected the notification panel to the WebSocket event stream.', 'New opportunity events now appear in under a second.', 'Reconnecting after the laptop sleeps drops the first few events.', 'Add a replay buffer and reconnection backoff.'],
    ['Debugged the chart rendering issue on Safari.', 'Isolated the bug to SVG transforms inside the chart container.', 'Safari 16 and 17 behave differently with the workaround.', 'Test the fix on real devices and document the workaround.'],
    ['Improved inline validation messages on the contact and appointment forms.', 'Invalid fields are now highlighted with specific messages.', 'Some API errors come back without field names.', 'Map API error codes to form fields and add tests.'],
    ['Implemented CSV export for the opportunities table with the active filters applied.', 'Exports of 5,000 rows finish in under two seconds.', 'Date columns export in UTC instead of the workspace timezone.', 'Format dates per workspace timezone and start on JSON export.'],
    ['Set up a GHL workflow webhook to sync appointment updates into the dashboard.', 'Appointment status changes now show up without a manual refresh.', 'Webhook retries create duplicate rows.', 'Add idempotency keys to the webhook handler.'],
    ['Walked through the dashboard with Kevin and collected UI polish items.', 'Closed six small UI tickets from the review.', 'No major blockers today.', 'Start on the pipeline stage filter for the opportunities view.'],
    ['Refactored the contact list to use virtualized rows.', 'Scrolling 10,000 contacts is now smooth on mid-range laptops.', 'Row heights jump when tags wrap onto two lines.', 'Fix the row height calculation and add a loading skeleton.'],
    ['Added empty and error states to the campaign analytics widgets.', 'Widgets no longer show blank cards when the GHL API is slow.', 'Hit rate limits on the GHL API during testing.', 'Cache widget responses for five minutes and retest.'],
  ],
  scraping: [
    ['Implemented pagination handling for the directory search results.', 'The scraper now walks all 40 result pages without skipping entries.', 'Some pages switch to a different layout after page 20.', 'Add a fallback selector for the alternate layout.'],
    ['Added proxy rotation when the target site responds with 429.', 'Blocked requests dropped by about 70% in the overnight run.', 'Two proxies in the pool are consistently slow.', 'Score proxies by latency and drop the slowest ones.'],
    ['Normalized company names before dedupe (suffixes, casing and punctuation).', 'Duplicate leads in the sample set went from 12% to under 2%.', 'Edge cases with non-English company names.', 'Add tests for the normalizer and review the remaining false merges.'],
    ['Wrote retry logic with exponential backoff for failed page fetches.', 'Transient network errors no longer abort a full run.', 'Choosing sensible retry limits per domain.', 'Log retry counts per domain to tune the limits.'],
    ['Built a validation step for scraped emails and phone numbers.', 'Invalid contacts are flagged before they reach the CRM import.', 'Phone formats vary a lot across regions.', 'Handle PH and US number formats and add fixtures.'],
    ['Scheduled the nightly scraping job and posted run summaries to Slack.', 'The team now sees lead counts and failures every morning.', 'The job occasionally overlaps with the database backup window.', 'Move the schedule and add a lock to prevent overlapping runs.'],
    ['Mapped scraped fields to the leads-api import schema.', 'The first 1,200 scraped leads imported without manual fixes.', 'Industry values do not match the CRM picklist.', 'Build a lookup table for industry values with Daniel.'],
    ['Added structured logging and per-domain metrics to the scraper.', 'Failures can now be traced to a specific page and selector.', 'Log volume is high on large runs.', 'Sample debug logs and keep full logs only for failures.'],
  ],
  general: [
    ['Completed the onboarding modules on Git workflow and code review etiquette.', 'Opened my first pull request fixing setup steps in the README.', 'Still getting used to the monorepo structure.', 'Pick up a good first issue from the backlog.'],
    ['Set up the local development environment for leads-api and the dashboard.', 'Both services now run locally with seeded data.', 'Docker networking issues on Windows took a while to resolve.', 'Read through the auth module and write notes.'],
    ['Shadowed a code review session and reviewed two open pull requests.', 'Left my first review comments on a teammate pull request.', 'Understanding the reasoning behind some architecture decisions.', 'Ask Mika for a walkthrough of the deployment pipeline.'],
    ['Studied the RAG agent prototype and ran the evaluation notebook.', 'Reproduced the baseline answer quality scores.', 'Embedding requests are slow without caching.', 'Prototype a simple cache for embedding requests.'],
    ['Added citation links to agent answers in the RAG prototype.', 'Answers now show the source document and page.', 'Some chunks lose their page metadata.', 'Trace where page numbers get dropped in the chunker.'],
    ['Wrote a script to clean up test data in the staging database.', 'Staging now resets to a known state in under a minute.', 'Needed extra care to avoid touching shared tables.', 'Add a dry-run flag and document the script.'],
    ['Fixed small UI bugs on the intern profile page during a bug bash.', 'Closed three low-priority tickets.', 'Reproducing one bug that only happens on Safari.', 'Write up the Safari bug with steps to reproduce.'],
    ['Attended sprint planning and estimated tickets with the team.', 'Got assigned my first feature ticket for the next sprint.', 'No major blockers today.', 'Break the feature ticket into smaller tasks.'],
  ],
};

const MONTHLY_BANK: Record<Track, string[]> = {
  database: [
    'Shipped GitHub OAuth login and hardened callback error handling',
    'Added composite indexes and cut leads search P95 to 190ms',
    'Raised auth module test coverage from 54% to 81%',
    'Drafted token-bucket rate limiting for public endpoints',
    'Documented the leads and contacts endpoints with examples',
    'Traced and fixed the CSV import worker memory leak',
  ],
  ghl: [
    'Delivered dark mode tokens across the dashboard',
    'Built the responsive navigation and mobile layouts',
    'Connected notifications to the WebSocket event stream',
    'Isolated the Safari SVG chart rendering bug',
    'Added CSV export with the active table filters',
    'Synced GHL appointment updates through a workflow webhook',
  ],
  scraping: [
    'Implemented pagination across directory search results',
    'Added proxy rotation on 429 responses',
    'Normalized company names and cut duplicates under 2%',
    'Added retries with exponential backoff',
    'Validated scraped emails and phone numbers before import',
    'Scheduled nightly runs with Slack summaries',
  ],
  general: [
    'Completed onboarding and Git workflow modules',
    'Set up local environments for leads-api and the dashboard',
    'Reviewed pull requests and shadowed code reviews',
    'Prototyped citation links in the RAG agent',
    'Wrote a staging data cleanup script',
    'Fixed low-priority UI bugs during the bug bash',
  ],
};

const TRACK_DEPARTMENT: Record<Track, string> = {
  database: 'Engineering',
  ghl: 'Automation',
  scraping: 'Data',
  general: 'Engineering',
};

const WEEKDAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const AVATAR_COLORS = ['#4DFFA3', '#3B82F6', '#F59E0B', '#A78BFA', '#F472B6', '#22D3EE', '#FB7185', '#34D399'];

// ---------------------------------------------------------------------------
// Small builders
// ---------------------------------------------------------------------------

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0][0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? '' : '';
  return `${first}${last}`.toUpperCase();
}

function avatarDataUri(name: string, key: string): string {
  const background = AVATAR_COLORS[hashString(`avatar:${key}`) % AVATAR_COLORS.length];
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">' +
    `<rect width="64" height="64" rx="32" fill="${background}"/>` +
    '<text x="50%" y="50%" dy=".35em" text-anchor="middle" font-family="DM Sans, Arial, sans-serif" ' +
    `font-size="26" font-weight="700" fill="#0B0D11">${initialsOf(name)}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function githubIdFor(username: string): string {
  return String(10_000_000 + (hashString(`github:${username}`) % 89_000_000));
}

function formatHours(hours: number): string {
  let whole = Math.floor(hours);
  let minutes = Math.round((hours - whole) * 60);
  if (minutes === 60) {
    whole += 1;
    minutes = 0;
  }
  return minutes ? `${whole}h ${minutes}m` : `${whole}h`;
}

function buildLabel(fullName: string, name: string): GitHubLabel {
  const meta = LABELS[name] ?? { color: 'ededed', isDefault: false, description: null };
  const hash = hashString(`label:${fullName}:${name}`);
  return {
    id: 5_000_000_000 + (hash % 900_000_000),
    node_id: `LA_kwDOL${hash.toString(36).toUpperCase().padStart(7, '0')}`,
    url: `https://api.github.com/repos/${fullName}/labels/${encodeURIComponent(name)}`,
    name,
    color: meta.color,
    default: meta.isDefault,
    description: meta.description,
  };
}

function eodContent(entry: EodEntry, rng: Rng): string {
  const diet = rng.int(5, 9);
  const exercise = rng.int(4, 9);
  const relationship = rng.int(6, 10);
  const overall = Math.min(10, Math.max(1, Math.round((diet + exercise + relationship) / 3) + rng.int(-1, 1)));
  return [
    '### Task Completed',
    entry[0],
    '',
    '### Key Success',
    entry[1],
    '',
    '### Main Challenges',
    entry[2],
    '',
    '### Plans for Tomorrow',
    entry[3],
    '',
    '### Ratings',
    `- Diet: ${diet}/10`,
    `- Exercise: ${exercise}/10`,
    `- Relationship: ${relationship}/10`,
    `- Overall: ${overall}/10`,
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

export function createSeed(now: Date): DemoDb {
  const nowMs = now.getTime();
  const todayKey = utcDateKey(now);
  const currentMonday = mondayOf(todayKey);
  const mondayWeeksAgo = (weeks: number) => addDaysToKey(currentMonday, -7 * weeks);

  /** ISO at a UTC time of day on D(-daysAgo), never in the future. */
  const at = (daysAgo: number, hours: number, minutes = 0): string =>
    clampPast(isoAt(dayKey(-daysAgo, now), hours, minutes), now);

  const byUsername = new Map<string, UserRow>();
  const users: UserRow[] = [];
  const interns: InternRow[] = [];
  const batches: BatchRow[] = [];
  const batchInterns: BatchInternRow[] = [];
  const teams: TeamRow[] = [];
  const teamMembers: TeamMemberRow[] = [];
  const repositories: RepositoryRow[] = [];
  const issues: IssueRow[] = [];
  const assignments: IssueAssignmentRow[] = [];
  const reports: ReportRow[] = [];
  const attendance: AttendanceRow[] = [];

  // --- users -------------------------------------------------------------
  const addUser = (spec: StaffSpec): UserRow => {
    const rng = createRng(`user:${spec.username}`);
    const createdAt = at(spec.daysAgo, rng.int(0, 9), rng.int(0, 59));
    const onboarded = spec.onboarded ?? true;
    const updatedAt = onboarded
      ? clampPast(new Date(new Date(createdAt).getTime() + rng.int(1, 30) * HOUR_MS).toISOString(), now)
      : createdAt;

    const user: UserRow = {
      id: ids.user(spec.username),
      github_id: spec.githubId === undefined ? githubIdFor(spec.username) : spec.githubId,
      github_username: spec.username,
      name: spec.name,
      email: spec.email === undefined ? `${spec.username}@metawatt.dev` : spec.email,
      avatar_url: spec.avatar === false ? null : avatarDataUri(spec.name, spec.username),
      role: spec.role,
      is_onboarded: onboarded,
      school_name: spec.school ?? null,
      created_at: createdAt,
      updated_at: updatedAt,
    };
    if (spec.status) {
      user.status = spec.status;
    }

    users.push(user);
    byUsername.set(spec.username, user);
    return user;
  };

  for (const spec of STAFF_AND_PENDING) {
    addUser(spec);
  }
  for (const spec of INTERNS) {
    addUser({
      username: spec.username,
      name: spec.name,
      role: 'intern',
      daysAgo: spec.userDaysAgo,
      school: spec.school,
      avatar: spec.avatar,
    });
  }
  const adminId = ids.user('michaelt');

  // --- batches -----------------------------------------------------------
  for (const spec of BATCHES) {
    const rng = createRng(`batch:${spec.key}`);
    const createdAt = at(spec.createdDaysAgo, rng.int(1, 8), rng.int(0, 59));
    batches.push({
      id: ids.batch(spec.key),
      name: spec.name,
      description: spec.description,
      start_date: dayKey(spec.startOffset, now),
      end_date: dayKey(spec.endOffset, now),
      max_interns: spec.maxInterns,
      join_code: spec.joinCode,
      created_at: createdAt,
      updated_at: createdAt,
    });
  }

  // --- teams + leads/extra members --------------------------------------
  for (const spec of TEAMS) {
    const rng = createRng(`team:${spec.key}`);
    teams.push({
      id: ids.team(spec.key),
      name: spec.name,
      created_by: adminId,
      created_at: at(spec.createdDaysAgo, rng.int(1, 8), rng.int(0, 59)),
      batch_id: ids.batch(spec.batch),
    });
    teamMembers.push({
      id: ids.teamMember(spec.key, spec.lead),
      team_id: ids.team(spec.key),
      user_id: ids.user(spec.lead),
      role: 'team_lead',
    });
  }

  // --- interns, enrollment, intern memberships ----------------------------
  for (const spec of INTERNS) {
    const rng = createRng(`intern:${spec.username}`);
    const assignedAt = at(spec.assignedDaysAgo, rng.int(1, 6), rng.int(0, 59));
    const internId = ids.intern(spec.username);
    const teamId = spec.team ? ids.team(spec.team) : null;

    interns.push({
      id: internId,
      user_id: ids.user(spec.username),
      team_id: teamId,
      created_at: new Date(new Date(assignedAt).getTime() - 2 * MINUTE_MS).toISOString(),
      school: spec.school,
      role: spec.title,
    });
    batchInterns.push({
      id: ids.batchIntern(spec.username),
      batch_id: ids.batch(spec.batch),
      intern_id: internId,
      assigned_at: assignedAt,
    });
    if (spec.team && teamId) {
      teamMembers.push({
        id: ids.teamMember(spec.team, spec.username),
        team_id: teamId,
        user_id: ids.user(spec.username),
        role: 'intern',
      });
    }
  }

  for (const spec of TEAMS) {
    for (const extra of spec.extraMembers ?? []) {
      teamMembers.push({
        id: ids.teamMember(spec.key, extra.username),
        team_id: ids.team(spec.key),
        user_id: ids.user(extra.username),
        role: extra.role,
      });
    }
  }

  // --- repositories ------------------------------------------------------
  for (const spec of REPOS) {
    const fullName = `${DEMO_GITHUB_ORG}/${spec.name}`;
    const rng = createRng(`repo:${fullName}`);
    repositories.push({
      id: ids.repo(fullName),
      team_id: ids.team(spec.team),
      github_repo_id: spec.githubRepoId,
      name: spec.name,
      owner: DEMO_GITHUB_ORG,
      url: `https://api.github.com/repos/${fullName}`,
      full_name: fullName,
      html_url: `https://github.com/${fullName}`,
      created_at: at(spec.createdDaysAgo, rng.int(1, 8), rng.int(0, 59)),
    });
  }

  // --- issues + assignments ----------------------------------------------
  for (const spec of ISSUES) {
    const fullName = `${DEMO_GITHUB_ORG}/${spec.repo}`;
    const repo = repositories.find((row) => row.full_name === fullName);
    const rng = createRng(`issue:${fullName}#${spec.number}`);
    const createdMs = nowMs - spec.created[0] * 86_400_000 - spec.created[1] * HOUR_MS - rng.int(0, 50) * MINUTE_MS;
    const updatedMs = Math.max(
      createdMs + 30 * MINUTE_MS,
      nowMs - spec.updated[0] * 86_400_000 - spec.updated[1] * HOUR_MS - spec.updated[2] * MINUTE_MS
    );
    const createdAt = new Date(createdMs).toISOString();
    const updatedAt = clampPast(new Date(updatedMs).toISOString(), now);
    const htmlUrl = `https://github.com/${fullName}/issues/${spec.number}`;
    const issueId = ids.issue(fullName, spec.number);

    issues.push({
      id: issueId,
      repo_id: fullName,
      github_issue_id: String(spec.number),
      title: spec.title,
      state: spec.state,
      created_at: createdAt,
      updated_at: updatedAt,
      closed_at: spec.state === 'closed' ? updatedAt : null,
      labels: spec.labels.map((label) => buildLabel(fullName, label)),
      raw_payload: {
        action: spec.state === 'closed' ? 'closed' : spec.assignee ? 'assigned' : 'opened',
        issue: {
          number: spec.number,
          title: spec.title,
          state: spec.state === 'closed' ? 'closed' : 'open',
          html_url: htmlUrl,
        },
        repository: {
          id: Number(repo?.github_repo_id ?? 0),
          full_name: fullName,
          html_url: `https://github.com/${fullName}`,
        },
      },
    });

    if (spec.assignee) {
      // Assignments on issues touched in the last 8 days land just before that update,
      // so every team's Activity Log shows a mix of m/h/d ago entries.
      const recent = nowMs - new Date(updatedAt).getTime() < 8 * 86_400_000;
      const assignedMs = recent
        ? Math.max(createdMs + 10 * MINUTE_MS, new Date(updatedAt).getTime() - rng.int(6, 45) * MINUTE_MS)
        : Math.min(new Date(updatedAt).getTime(), createdMs + rng.int(1, 6) * HOUR_MS);
      assignments.push({
        id: ids.assignment(fullName, spec.number),
        issue_id: issueId,
        intern_id: ids.intern(spec.assignee),
        manual: spec.manual ?? false,
        assigned_at: new Date(assignedMs).toISOString(),
      });
    }
  }

  // --- attendance --------------------------------------------------------
  const windowKeys = pastWeekdays(ATTENDANCE_WINDOW_DAYS, now);
  const attendanceByIntern = new Map<string, Map<string, AttendanceRow>>();

  const closedSession = (username: string, key: string, rng: Rng): AttendanceRow => {
    const inMinutes = rng.int(40, 80); // 00:40Z..01:20Z (08:40..09:20 PHT)
    const maxDuration = Math.min(540, 600 - inMinutes); // time_out <= 10:00Z
    const duration = rng.int(450, maxDuration);
    const timeIn = isoAt(key, 0, inMinutes, rng.int(0, 59));
    const timeOut = new Date(new Date(timeIn).getTime() + duration * MINUTE_MS).toISOString();
    return {
      id: ids.attendance(username, key),
      intern_id: ids.intern(username),
      time_in: timeIn,
      time_out: timeOut,
      rendered_hours: round2(duration / 60),
      created_at: timeIn,
    };
  };

  /** Keep InternProfileView's formatDuration from rendering 'Xh 60m'. */
  const fixTotal = (rows: AttendanceRow[]) => {
    const closed = rows.filter((row) => row.time_out !== null);
    if (!closed.length) return;
    for (let guard = 0; guard < 40; guard++) {
      const total = rows.reduce((sum, row) => sum + (row.rendered_hours ?? 0), 0);
      if (Math.round((total * 60) % 60) < 60) return;
      const last = closed[closed.length - 1];
      const shortened = new Date(new Date(last.time_out as string).getTime() - MINUTE_MS).toISOString();
      last.time_out = shortened;
      last.rendered_hours = round2((new Date(shortened).getTime() - new Date(last.time_in).getTime()) / HOUR_MS);
    }
  };

  const recordAttendance = (username: string, rows: AttendanceRow[]) => {
    fixTotal(rows);
    const map = new Map<string, AttendanceRow>();
    for (const row of rows) {
      map.set(row.time_in.slice(0, 10), row);
      attendance.push(row);
    }
    attendanceByIntern.set(username, map);
  };

  const midnightMs = startOfUtcDay(now).getTime();

  for (const spec of INTERNS.filter((intern) => intern.batch === 'B1')) {
    const rng = createRng(`attendance:${spec.username}`);
    const missCount = Math.max(0, ATTENDANCE_WINDOW_DAYS - spec.pastDays);
    const newestIndex = windowKeys.length - 1;
    // Regular attendees still came in on the most recent weekday.
    const candidates = windowKeys
      .map((_, index) => index)
      .filter((index) => spec.pastDays < 10 || index !== newestIndex);
    const missed = new Set(rng.shuffle(candidates).slice(0, missCount));
    const rows: AttendanceRow[] = [];

    windowKeys.forEach((key, index) => {
      if (!missed.has(index)) {
        rows.push(closedSession(spec.username, key, rng));
      }
    });

    if (spec.openToday) {
      const anchorMs = midnightMs + (spec.openToday[0] * 60 + spec.openToday[1]) * MINUTE_MS;
      const timeInMs = Math.max(midnightMs + MINUTE_MS, Math.min(anchorMs, nowMs - 2 * HOUR_MS));
      if (timeInMs <= nowMs) {
        const jitterMs = rng.int(0, 59) * 1000;
        const timeIn = new Date(timeInMs + jitterMs <= nowMs ? timeInMs + jitterMs : timeInMs).toISOString();
        rows.push({
          id: ids.attendance(spec.username, todayKey),
          intern_id: ids.intern(spec.username),
          time_in: timeIn,
          time_out: null,
          rendered_hours: null,
          created_at: timeIn,
        });
      }
    }

    recordAttendance(spec.username, rows);
  }

  // B3 (completed batch): the last 10 weekdays up to its end date.
  const b3End = dayKey(-120, now);
  const b3Window = pastWeekdays(10, new Date(`${addDaysToKey(b3End, 1)}T12:00:00.000Z`));
  for (const spec of INTERNS.filter((intern) => intern.batch === 'B3')) {
    const rng = createRng(`attendance:${spec.username}`);
    const missed = new Set(rng.shuffle(b3Window.map((_, index) => index)).slice(0, rng.int(0, 2)));
    const rows = b3Window
      .filter((_, index) => !missed.has(index))
      .map((key) => closedSession(spec.username, key, rng));
    recordAttendance(spec.username, rows);
  }

  // --- reports -----------------------------------------------------------
  const supervisorFor = (spec: InternSpec): UserRow | undefined => {
    const team = spec.team ? TEAMS.find((row) => row.key === spec.team) : undefined;
    return byUsername.get(team ? team.lead : 'msantos');
  };

  const addEod = (spec: InternSpec, key: string, status: ReportStatus, rng: Rng, entry: EodEntry) => {
    const session = attendanceByIntern.get(spec.username)?.get(key);
    const base = session?.time_out ?? isoAt(key, 9, 30);
    const submittedAt = clampPast(new Date(new Date(base).getTime() + rng.int(4, 35) * MINUTE_MS).toISOString(), now);
    reports.push({
      id: ids.report(spec.username, 'eod', key),
      intern_id: ids.intern(spec.username),
      title: eodTitle(key),
      content: eodContent(entry, rng),
      period_start: localTimestamp(key),
      period_end: localTimestamp(key),
      submitted_at: submittedAt,
      status,
    });
  };

  const addWeekly = (spec: InternSpec, mondayKey: string, status: ReportStatus, rng: Rng) => {
    const fridayKey = addDaysToKey(mondayKey, 4);
    const supervisor = supervisorFor(spec);
    const supervisorName = supervisor?.name ?? 'Mika Santos';
    const initials = initialsOf(supervisorName);
    const sessions = attendanceByIntern.get(spec.username);
    const windowStart = spec.batch === 'B1' ? windowKeys[0] : b3Window[0];

    const rows = WEEKDAY_NAMES.map((day, index) => {
      const key = addDaysToKey(mondayKey, index);
      const session = sessions?.get(key);
      if (session && session.time_out) {
        return `| ${day} | ${clockAt(session.time_in)} | ${clockAt(session.time_out)} | ${formatHours(session.rendered_hours ?? 0)} | ${initials} |`;
      }
      if (key >= windowStart) {
        return `| ${day} | - | - | 0h | - |`;
      }
      const inMinutes = rng.int(40, 75);
      const duration = rng.int(450, 520);
      const timeIn = isoAt(key, 0, inMinutes);
      const timeOut = new Date(new Date(timeIn).getTime() + duration * MINUTE_MS).toISOString();
      return `| ${day} | ${clockAt(timeIn)} | ${clockAt(timeOut)} | ${formatHours(duration / 60)} | ${initials} |`;
    });

    const content = [
      `**Student:** ${spec.name} (${spec.studentId})`,
      `**Section:** ${spec.section}`,
      `**Company:** ${DEMO_COMPANY} - ${TRACK_DEPARTMENT[spec.track]}`,
      `**Supervisor:** ${supervisorName}`,
      '',
      '### Weekly Log',
      '| Day | In | Out | Hours | Initial |',
      '|-----|----|-----|-------|---------|',
      ...rows,
    ].join('\n');

    reports.push({
      id: ids.report(spec.username, 'weekly', mondayKey),
      intern_id: ids.intern(spec.username),
      title: weeklyTitle(mondayKey, fridayKey),
      content,
      period_start: localTimestamp(mondayKey),
      period_end: localTimestamp(fridayKey),
      submitted_at: clampPast(isoAt(fridayKey, 10, rng.int(2, 40)), now),
      status,
    });
  };

  const addMonthly = (spec: InternSpec, year: number, monthIndex: number, status: ReportStatus, rng: Rng) => {
    const { periodStart, periodEnd } = monthPeriod(year, monthIndex);
    const assignedKey = dayKey(-spec.assignedDaysAgo, now);
    const lastKey = periodEnd < todayKey ? periodEnd : addDaysToKey(todayKey, -1);

    const weeks: string[][] = [];
    for (let key = periodStart; key <= lastKey; key = addDaysToKey(key, 1)) {
      if (isWeekend(key) || key < assignedKey) continue;
      const monday = mondayOf(key);
      const current = weeks[weeks.length - 1];
      if (current && mondayOf(current[0]) === monday) {
        current.push(key);
      } else {
        weeks.push([key]);
      }
    }
    if (!weeks.length) return;

    const bank = MONTHLY_BANK[spec.track];
    const offset = rng.int(0, bank.length - 1);
    const workTimes = rng.pick(['8:30-5:30', '8:45-5:45', '8:30-5:00', '9:00-6:00']);
    let total = 0;
    const rows = weeks.map((days, index) => {
      const hours = Math.max(0, days.length * 8 + rng.int(-1, 2));
      total += hours;
      return `| Week ${index + 1} | ${workTimes} | ${hours}h | ${bank[(offset + index) % bank.length]} |`;
    });

    const content = [
      `**Trainee:** ${spec.name} (ID: ${spec.studentId})`,
      `**Company:** ${DEMO_COMPANY}`,
      `**Total Hours:** ${total}h`,
      '',
      '### Monthly Summary',
      '| Week | Work Times | Hours | Accomplishments |',
      '|------|------------|-------|-----------------|',
      ...rows,
    ].join('\n');

    reports.push({
      id: ids.report(spec.username, 'monthly', periodStart),
      intern_id: ids.intern(spec.username),
      title: monthlyTitle(year, monthIndex),
      content,
      period_start: localTimestamp(periodStart),
      period_end: localTimestamp(periodEnd),
      submitted_at: clampPast(isoAt(periodEnd, 10, rng.int(20, 55)), now),
      status,
    });
  };

  /** Month `monthsAgo` before the month of `from` (UTC). */
  const monthBack = (fromKey: string, monthsAgo: number): [number, number] => {
    const [year, month] = fromKey.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1 - monthsAgo, 1));
    return [date.getUTCFullYear(), date.getUTCMonth()];
  };

  interface ReportPlan {
    /** Which attended day keys get an EOD (index 0 = most recent attended day). */
    eod?: (key: string, indexFromNewest: number) => boolean;
    weekly?: Array<[weeksAgo: number, status: ReportStatus]>;
    monthly?: Array<[monthsAgo: number, status: ReportStatus]>;
    /** Forced status of the newest report by submitted_at ('reviewed' => all reviewed). */
    latest?: ReportStatus;
  }

  const REPORT_PLANS: Record<string, ReportPlan> = {
    sarahchen: {
      eod: (_key, index) => index !== 3 && index !== 8,
      weekly: [[3, 'reviewed'], [2, 'reviewed'], [1, 'submitted']],
      monthly: [[2, 'reviewed'], [1, 'submitted']],
      latest: 'submitted',
    },
    mrodriguez: {
      eod: () => true,
      weekly: [[2, 'reviewed'], [1, 'submitted']],
      monthly: [[1, 'submitted']],
      latest: 'submitted',
    },
    emilyw: {
      weekly: [[2, 'reviewed'], [1, 'reviewed']],
      monthly: [[1, 'reviewed']],
      latest: 'reviewed',
    },
    jamesk: {
      eod: (_key, index) => index < 8,
      weekly: [[1, 'reviewed']],
      latest: 'submitted',
    },
    aishap: {
      eod: (key) => key < currentMonday && key >= mondayWeeksAgo(2),
      weekly: [[2, 'reviewed'], [1, 'reviewed']],
      monthly: [[1, 'reviewed']],
      latest: 'reviewed',
    },
    davidj: {
      eod: (key) => key < mondayWeeksAgo(1),
      weekly: [[2, 'reviewed'], [1, 'pending']],
      latest: 'pending',
    },
    lisan: {
      eod: () => true,
      weekly: [[2, 'reviewed']],
      monthly: [[1, 'submitted']],
    },
    tomand: {
      eod: (_key, index) => index < 10,
      weekly: [[1, 'submitted']],
      monthly: [[1, 'reviewed']],
      latest: 'submitted',
    },
    migueldc: {
      eod: (_key, index) => index < 7,
      weekly: [[2, 'reviewed'], [1, 'submitted']],
    },
    angelaramos: {
      eod: (_key, index) => index < 5,
      weekly: [[1, 'reviewed']],
      monthly: [[1, 'reviewed']],
    },
    // joshuauy, nicolegarcia: no reports at all.
  };

  const applyLatest = (rows: ReportRow[], latest?: ReportStatus) => {
    if (!latest || !rows.length) return;
    if (latest === 'reviewed') {
      for (const row of rows) row.status = 'reviewed';
    }
    const newest = [...rows].sort((a, b) => b.submitted_at.localeCompare(a.submitted_at))[0];
    newest.status = latest;
  };

  for (const spec of INTERNS.filter((intern) => intern.batch === 'B1')) {
    const plan = REPORT_PLANS[spec.username];
    if (!plan) continue;
    const rng = createRng(`reports:${spec.username}`);
    const firstIndex = reports.length;

    const attendedKeys = [...(attendanceByIntern.get(spec.username)?.values() ?? [])]
      .filter((row) => row.time_out !== null && row.time_in.slice(0, 10) < todayKey)
      .map((row) => row.time_in.slice(0, 10))
      .sort()
      .reverse();

    if (plan.eod) {
      const bank = EOD_BANK[spec.track];
      const offset = rng.int(0, bank.length - 1);
      let used = 0;
      attendedKeys.forEach((key, index) => {
        if (!plan.eod?.(key, index)) return;
        const status: ReportStatus = index < 5 ? 'submitted' : 'reviewed';
        addEod(spec, key, status, rng, bank[(offset + used) % bank.length]);
        used += 1;
      });
    }

    for (const [weeksAgo, status] of plan.weekly ?? []) {
      addWeekly(spec, mondayWeeksAgo(weeksAgo), status, rng);
    }

    const assignedKey = dayKey(-spec.assignedDaysAgo, now);
    for (const [monthsAgo, status] of plan.monthly ?? []) {
      const [year, monthIndex] = monthBack(todayKey, monthsAgo);
      if (monthPeriod(year, monthIndex).periodEnd < assignedKey) continue;
      addMonthly(spec, year, monthIndex, status, rng);
    }

    applyLatest(reports.slice(firstIndex), plan.latest);
  }

  // B3 interns: everything reviewed (completed batch).
  for (const spec of INTERNS.filter((intern) => intern.batch === 'B3')) {
    const rng = createRng(`reports:${spec.username}`);
    const attendedKeys = [...(attendanceByIntern.get(spec.username)?.keys() ?? [])].sort().reverse();
    const bank = EOD_BANK[spec.track];
    const offset = rng.int(0, bank.length - 1);
    attendedKeys.slice(0, 5).forEach((key, index) => {
      addEod(spec, key, 'reviewed', rng, bank[(offset + index) % bank.length]);
    });

    const endMonday = mondayOf(b3End);
    const lastFullMonday = addDaysToKey(endMonday, b3End >= addDaysToKey(endMonday, 4) ? 0 : -7);
    addWeekly(spec, addDaysToKey(lastFullMonday, -7), 'reviewed', rng);
    addWeekly(spec, lastFullMonday, 'reviewed', rng);

    const [year, monthIndex] = monthBack(b3End, 1);
    addMonthly(spec, year, monthIndex, 'reviewed', rng);
  }

  return {
    version: DEMO_DB_VERSION,
    seededFor: todayKey,
    seededAt: now.toISOString(),
    users,
    interns,
    batches,
    batch_interns: batchInterns,
    teams,
    team_members: teamMembers,
    repositories,
    issues,
    issue_assignments: assignments,
    reports,
    attendance,
  };
}
