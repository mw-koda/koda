export interface Intern {
  id: string;
  name: string;
  github: string;
  avatarInitials: string;
  reportsSubmitted: number;
  lastActive: string;
  score: number;
  assignedPeriod: string;
  reportStatus: 'pending' | 'submitted' | 'reviewed';
  issuesThisWeek: number;
  role: string;
  organizationId?: string;
}

export interface Organization {
  id: string;
  name: string;
  coordinatorId: string;
  coordinatorName: string;
  code: string;
  createdAt: string;
  interns: string[]; // intern IDs
}

export interface Issue {
  id: string;
  number: number;
  title: string;
  repo: string;
  assignee: string;
  assigneeAvatar: string;
  status: 'open' | 'closed' | 'in-progress';
  labels: string[];
  openedAt: string;
  updatedAt: string;
  body: string;
  internId?: string;
}

export interface Report {
  id: string;
  internId: string;
  period: string;
  submittedAt: string;
  score: number | null;
  status: 'pending' | 'reviewed';
  content: string;
  coordinatorNote: string | null;
  type: 'weekly' | 'daily';
}

export interface User {
  id: string;
  name: string;
  github: string;
  role: 'intern' | 'coordinator' | 'team-lead' | 'admin';
  status: 'active' | 'pending' | 'inactive';
  joinedAt: string;
  avatarInitials: string;
  organizationId?: string;
}

export interface Batch {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  maxInterns: number;
  description?: string;
}

export type UserRole = User['role'];

export const interns: Intern[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    github: 'sarahchen',
    avatarInitials: 'SC',
    reportsSubmitted: 8,
    lastActive: '2 hours ago',
    score: 92,
    assignedPeriod: 'Jan 2024 - Mar 2024',
    reportStatus: 'submitted',
    issuesThisWeek: 4,
    role: 'Frontend Intern',
    organizationId: 'org-1',
  },
  {
    id: '2',
    name: 'Marcus Rodriguez',
    github: 'mrodriguez',
    avatarInitials: 'MR',
    reportsSubmitted: 7,
    lastActive: '1 day ago',
    score: 88,
    assignedPeriod: 'Jan 2024 - Mar 2024',
    reportStatus: 'pending',
    issuesThisWeek: 3,
    role: 'Backend Intern',
    organizationId: 'org-1',
  },
  {
    id: '3',
    name: 'Emily Watson',
    github: 'emilyw',
    avatarInitials: 'EW',
    reportsSubmitted: 9,
    lastActive: '3 hours ago',
    score: 95,
    assignedPeriod: 'Jan 2024 - Mar 2024',
    reportStatus: 'reviewed',
    issuesThisWeek: 5,
    role: 'Full-Stack Intern',
    organizationId: 'org-1',
  },
  {
    id: '4',
    name: 'James Kim',
    github: 'jamesk',
    avatarInitials: 'JK',
    reportsSubmitted: 6,
    lastActive: '5 hours ago',
    score: 81,
    assignedPeriod: 'Feb 2024 - Apr 2024',
    reportStatus: 'submitted',
    issuesThisWeek: 2,
    role: 'DevOps Intern',
    organizationId: 'org-1',
  },
  {
    id: '5',
    name: 'Aisha Patel',
    github: 'aishap',
    avatarInitials: 'AP',
    reportsSubmitted: 8,
    lastActive: '1 hour ago',
    score: 90,
    assignedPeriod: 'Jan 2024 - Mar 2024',
    reportStatus: 'submitted',
    issuesThisWeek: 4,
    role: 'Frontend Intern',
    organizationId: 'org-1',
  },
  {
    id: '6',
    name: 'David Johnson',
    github: 'davidj',
    avatarInitials: 'DJ',
    reportsSubmitted: 5,
    lastActive: '2 days ago',
    score: 76,
    assignedPeriod: 'Feb 2024 - Apr 2024',
    reportStatus: 'pending',
    issuesThisWeek: 1,
    role: 'Backend Intern',
    organizationId: 'org-1',
  },
  {
    id: '7',
    name: 'Lisa Nguyen',
    github: 'lisan',
    avatarInitials: 'LN',
    reportsSubmitted: 9,
    lastActive: '4 hours ago',
    score: 93,
    assignedPeriod: 'Jan 2024 - Mar 2024',
    reportStatus: 'reviewed',
    issuesThisWeek: 6,
    role: 'Full-Stack Intern',
    organizationId: 'org-1',
  },
  {
    id: '8',
    name: 'Tom Anderson',
    github: 'tomand',
    avatarInitials: 'TA',
    reportsSubmitted: 7,
    lastActive: '6 hours ago',
    score: 85,
    assignedPeriod: 'Jan 2024 - Mar 2024',
    reportStatus: 'submitted',
    issuesThisWeek: 3,
    role: 'Frontend Intern',
    organizationId: 'org-1',
  },
];

export const issues: Issue[] = [
  {
    id: 'issue-1',
    number: 145,
    title: 'Implement OAuth authentication flow',
    repo: 'metawatt/leads-api',
    assignee: 'Sarah Chen',
    assigneeAvatar: 'SC',
    status: 'in-progress',
    labels: ['authentication', 'high-priority'],
    openedAt: '2024-03-15T10:30:00Z',
    updatedAt: '2024-03-19T14:22:00Z',
    body: 'Need to implement OAuth 2.0 authentication flow for third-party integrations. Should support Google and GitHub providers initially.',
    internId: '1',
  },
  {
    id: 'issue-2',
    number: 152,
    title: 'Fix memory leak in data processing pipeline',
    repo: 'metawatt/leads-api',
    assignee: 'Marcus Rodriguez',
    assigneeAvatar: 'MR',
    status: 'open',
    labels: ['bug', 'performance'],
    openedAt: '2024-03-18T09:15:00Z',
    updatedAt: '2024-03-18T16:45:00Z',
    body: 'Memory usage grows unbounded when processing large datasets. Need to investigate and fix the leak in the data processing pipeline.',
    internId: '2',
  },
  {
    id: 'issue-3',
    number: 89,
    title: 'Add dark mode support to dashboard',
    repo: 'metawatt/dashboard',
    assignee: 'Emily Watson',
    assigneeAvatar: 'EW',
    status: 'closed',
    labels: ['enhancement', 'ui'],
    openedAt: '2024-03-10T11:00:00Z',
    updatedAt: '2024-03-17T15:30:00Z',
    body: 'Implement dark mode theme throughout the dashboard with proper color scheme and user preference persistence.',
    internId: '3',
  },
  {
    id: 'issue-4',
    number: 95,
    title: 'Optimize database query performance',
    repo: 'metawatt/leads-api',
    assignee: 'James Kim',
    assigneeAvatar: 'JK',
    status: 'in-progress',
    labels: ['database', 'performance'],
    openedAt: '2024-03-12T13:20:00Z',
    updatedAt: '2024-03-19T10:00:00Z',
    body: 'Several database queries are taking too long. Need to add proper indexes and optimize query structure.',
    internId: '4',
  },
  {
    id: 'issue-5',
    number: 101,
    title: 'Create responsive mobile layout',
    repo: 'metawatt/dashboard',
    assignee: 'Aisha Patel',
    assigneeAvatar: 'AP',
    status: 'in-progress',
    labels: ['mobile', 'ui'],
    openedAt: '2024-03-14T08:45:00Z',
    updatedAt: '2024-03-19T12:15:00Z',
    body: 'Dashboard needs to be fully responsive and work well on mobile devices. Focus on touch-friendly interactions.',
    internId: '5',
  },
  {
    id: 'issue-6',
    number: 156,
    title: 'Add rate limiting to API endpoints',
    repo: 'metawatt/leads-api',
    assignee: 'David Johnson',
    assigneeAvatar: 'DJ',
    status: 'open',
    labels: ['security', 'api'],
    openedAt: '2024-03-19T07:30:00Z',
    updatedAt: '2024-03-19T07:30:00Z',
    body: 'Implement rate limiting middleware to prevent API abuse. Should be configurable per endpoint.',
    internId: '6',
  },
  {
    id: 'issue-7',
    number: 103,
    title: 'Implement real-time notifications',
    repo: 'metawatt/dashboard',
    assignee: 'Lisa Nguyen',
    assigneeAvatar: 'LN',
    status: 'in-progress',
    labels: ['feature', 'real-time'],
    openedAt: '2024-03-13T15:00:00Z',
    updatedAt: '2024-03-19T11:30:00Z',
    body: 'Add WebSocket support for real-time notifications. Users should be notified of important events immediately.',
    internId: '7',
  },
  {
    id: 'issue-8',
    number: 108,
    title: 'Fix chart rendering on Safari',
    repo: 'metawatt/dashboard',
    assignee: 'Tom Anderson',
    assigneeAvatar: 'TA',
    status: 'open',
    labels: ['bug', 'browser-compatibility'],
    openedAt: '2024-03-16T10:20:00Z',
    updatedAt: '2024-03-18T14:00:00Z',
    body: 'Charts are not rendering correctly on Safari. Need to investigate and fix compatibility issues.',
    internId: '8',
  },
  {
    id: 'issue-9',
    number: 147,
    title: 'Update API documentation',
    repo: 'metawatt/leads-api',
    assignee: 'Sarah Chen',
    assigneeAvatar: 'SC',
    status: 'closed',
    labels: ['documentation'],
    openedAt: '2024-03-11T09:00:00Z',
    updatedAt: '2024-03-15T16:00:00Z',
    body: 'API documentation is outdated. Need to update all endpoints with current parameters and examples.',
    internId: '1',
  },
  {
    id: 'issue-10',
    number: 150,
    title: 'Implement data export functionality',
    repo: 'metawatt/dashboard',
    assignee: 'Emily Watson',
    assigneeAvatar: 'EW',
    status: 'in-progress',
    labels: ['feature', 'export'],
    openedAt: '2024-03-17T11:30:00Z',
    updatedAt: '2024-03-19T09:45:00Z',
    body: 'Users need ability to export data in CSV and JSON formats. Should include filtering options.',
    internId: '3',
  },
  {
    id: 'issue-11',
    number: 154,
    title: 'Add unit tests for auth module',
    repo: 'metawatt/leads-api',
    assignee: 'Marcus Rodriguez',
    assigneeAvatar: 'MR',
    status: 'open',
    labels: ['testing', 'authentication'],
    openedAt: '2024-03-18T13:00:00Z',
    updatedAt: '2024-03-18T13:00:00Z',
    body: 'Authentication module needs comprehensive unit test coverage. Target is 90% code coverage.',
    internId: '2',
  },
  {
    id: 'issue-12',
    number: 110,
    title: 'Improve error handling in forms',
    repo: 'metawatt/dashboard',
    assignee: 'Aisha Patel',
    assigneeAvatar: 'AP',
    status: 'closed',
    labels: ['ui', 'forms'],
    openedAt: '2024-03-14T14:15:00Z',
    updatedAt: '2024-03-18T10:30:00Z',
    body: 'Form validation errors need better user feedback. Should show inline errors and highlight problematic fields.',
    internId: '5',
  },
];

export const reports: Report[] = [
  {
    id: 'rep-1',
    internId: '1',
    period: 'Week of Mar 11-15, 2024',
    submittedAt: '2024-03-15T18:00:00Z',
    score: 92,
    status: 'reviewed',
    content: 'This week I focused on implementing the OAuth authentication flow for the leads-api. I completed the Google OAuth integration and started work on GitHub OAuth. I also spent time reviewing and updating the API documentation which was significantly outdated. The main challenges were understanding the OAuth 2.0 flow and handling edge cases in the authentication callback. I resolved these by studying the RFC specifications and implementing comprehensive error handling.',
    coordinatorNote: 'Excellent progress on authentication. Documentation updates are thorough and well-written.',
    type: 'weekly',
  },
  {
    id: 'rep-2',
    internId: '2',
    period: 'Week of Mar 11-15, 2024',
    submittedAt: '2024-03-15T17:30:00Z',
    score: null,
    status: 'pending',
    content: 'Investigated the memory leak issue in the data processing pipeline. Used profiling tools to identify that the leak was in the stream processing logic. Started implementing a fix but need more time to test thoroughly. Also began work on unit tests for the authentication module.',
    coordinatorNote: null,
    type: 'weekly',
  },
  {
    id: 'rep-3',
    internId: '3',
    period: 'Week of Mar 11-15, 2024',
    submittedAt: '2024-03-15T19:00:00Z',
    score: 95,
    status: 'reviewed',
    content: 'Successfully completed the dark mode implementation for the dashboard. All components now support dark mode with proper color schemes. Also made significant progress on the data export functionality, implementing CSV export with filtering options. JSON export is next on the list. The dark mode feature received positive feedback from the team during our review session.',
    coordinatorNote: 'Outstanding work on dark mode. Very clean implementation with excellent attention to detail.',
    type: 'weekly',
  },
  {
    id: 'rep-4',
    internId: '4',
    period: 'Week of Mar 11-15, 2024',
    submittedAt: '2024-03-16T10:00:00Z',
    score: 81,
    status: 'reviewed',
    content: 'Worked on optimizing database queries. Added indexes to frequently queried columns and refactored several N+1 query patterns. Performance improvements are noticeable with query times reduced by 60-70% on average. Need to continue monitoring in production to ensure stability.',
    coordinatorNote: 'Good progress on performance optimization. Consider documenting the indexing strategy for future reference.',
    type: 'weekly',
  },
  {
    id: 'rep-5',
    internId: '5',
    period: 'Week of Mar 11-15, 2024',
    submittedAt: '2024-03-15T16:45:00Z',
    score: null,
    status: 'pending',
    content: 'Working on responsive mobile layout for the dashboard. Completed the navigation and header components. Tables are proving challenging on small screens - exploring different approaches including horizontal scrolling and card-based layouts for mobile. Also wrapped up the form error handling improvements.',
    coordinatorNote: null,
    type: 'weekly',
  },
  {
    id: 'rep-6',
    internId: '6',
    period: 'Week of Mar 18-22, 2024',
    submittedAt: '2024-03-19T09:00:00Z',
    score: null,
    status: 'pending',
    content: 'Started working on rate limiting implementation for API endpoints. Researching different approaches and libraries. Planning to use a token bucket algorithm. Progress has been slower than expected due to complexity of the requirements.',
    coordinatorNote: null,
    type: 'weekly',
  },
  {
    id: 'rep-7',
    internId: '7',
    period: 'Week of Mar 11-15, 2024',
    submittedAt: '2024-03-15T20:00:00Z',
    score: 93,
    status: 'reviewed',
    content: 'Made excellent progress on real-time notifications feature. WebSocket connection is stable and events are being pushed correctly. Implemented reconnection logic and error handling. Currently working on the UI components to display notifications. The system is handling concurrent connections well in testing.',
    coordinatorNote: 'Impressive work on the WebSocket implementation. The reconnection logic is particularly well thought out.',
    type: 'weekly',
  },
  {
    id: 'rep-8',
    internId: '8',
    period: 'Week of Mar 11-15, 2024',
    submittedAt: '2024-03-16T11:30:00Z',
    score: 85,
    status: 'reviewed',
    content: 'Investigated and partially fixed the Safari chart rendering issue. The problem was related to CSS transforms and SVG rendering. Applied a workaround that works in most cases. Still need to test edge cases and ensure it works across all Safari versions.',
    coordinatorNote: 'Good troubleshooting on the Safari issue. Make sure to document the workaround for future reference.',
    type: 'weekly',
  },
  {
    id: 'rep-9',
    internId: '1',
    period: 'Week of Mar 4-8, 2024',
    submittedAt: '2024-03-08T17:00:00Z',
    score: 90,
    status: 'reviewed',
    content: 'Focused on code reviews and learning the authentication architecture. Completed onboarding tasks and set up development environment. Started planning the OAuth implementation after reviewing existing authentication code.',
    coordinatorNote: 'Great start. Shows good initiative in understanding the codebase before diving into implementation.',
    type: 'weekly',
  },
  {
    id: 'rep-10',
    internId: '3',
    period: 'Week of Mar 4-8, 2024',
    submittedAt: '2024-03-08T18:30:00Z',
    score: 94,
    status: 'reviewed',
    content: 'Completed initial tasks and started work on dark mode feature. Did extensive research on color theory and accessibility. Created a color palette that meets WCAG AA standards. Began implementing theme switching logic.',
    coordinatorNote: 'Excellent attention to accessibility. The research phase shows maturity in approach.',
    type: 'weekly',
  },
];

export const batches: Batch[] = [];

export const users: User[] = [
  {
    id: 'user-1',
    name: 'Sarah Chen',
    github: 'sarahchen',
    role: 'intern',
    status: 'active',
    joinedAt: '2024-01-15',
    avatarInitials: 'SC',
  },
  {
    id: 'user-2',
    name: 'Marcus Rodriguez',
    github: 'mrodriguez',
    role: 'intern',
    status: 'active',
    joinedAt: '2024-01-15',
    avatarInitials: 'MR',
  },
  {
    id: 'user-3',
    name: 'Emily Watson',
    github: 'emilyw',
    role: 'intern',
    status: 'active',
    joinedAt: '2024-01-15',
    avatarInitials: 'EW',
  },
  {
    id: 'user-4',
    name: 'James Kim',
    github: 'jamesk',
    role: 'intern',
    status: 'active',
    joinedAt: '2024-02-01',
    avatarInitials: 'JK',
  },
  {
    id: 'user-5',
    name: 'Aisha Patel',
    github: 'aishap',
    role: 'intern',
    status: 'active',
    joinedAt: '2024-01-15',
    avatarInitials: 'AP',
  },
  {
    id: 'user-6',
    name: 'David Johnson',
    github: 'davidj',
    role: 'intern',
    status: 'active',
    joinedAt: '2024-02-01',
    avatarInitials: 'DJ',
  },
  {
    id: 'user-7',
    name: 'Lisa Nguyen',
    github: 'lisan',
    role: 'intern',
    status: 'active',
    joinedAt: '2024-01-15',
    avatarInitials: 'LN',
  },
  {
    id: 'user-8',
    name: 'Tom Anderson',
    github: 'tomand',
    role: 'intern',
    status: 'active',
    joinedAt: '2024-01-15',
    avatarInitials: 'TA',
  },
  {
    id: 'user-9',
    name: 'Carl Mendoza',
    github: 'carlm',
    role: 'coordinator',
    status: 'active',
    joinedAt: '2023-09-01',
    avatarInitials: 'CM',
  },
  {
    id: 'user-10',
    name: 'Rachel Green',
    github: 'rachelg',
    role: 'team-lead',
    status: 'active',
    joinedAt: '2023-06-15',
    avatarInitials: 'RG',
  },
  {
    id: 'user-11',
    name: 'Michael Torres',
    github: 'michaelt',
    role: 'admin',
    status: 'active',
    joinedAt: '2023-01-10',
    avatarInitials: 'MT',
  },
  {
    id: 'user-12',
    name: 'Jennifer Lee',
    github: 'jenniferlee',
    role: 'intern',
    status: 'pending',
    joinedAt: '2024-03-19',
    avatarInitials: 'JL',
  },
];

// Organizations managed by coordinators
export const organizations: Organization[] = [
  {
    id: 'org-1',
    name: 'Metawatt Q1 2024',
    coordinatorId: 'user-9',
    coordinatorName: 'Carl Mendoza',
    code: 'KODA-METAWATT-Q1-2024',
    createdAt: '2024-01-15',
    interns: ['1', '2', '3', '4', '5', '6', '7', '8'],
  },
];

// Get current user based on selected role (from localStorage or default)
export const roleToUserMap: Record<string, User> = {
  admin: {
    id: 'user-11',
    name: 'Michael Torres',
    github: 'michaelt',
    role: 'admin',
    status: 'active',
    joinedAt: '2023-01-10',
    avatarInitials: 'MT',
  },
  coordinator: {
    id: 'user-9',
    name: 'Carl Mendoza',
    github: 'carlm',
    role: 'coordinator',
    status: 'active',
    joinedAt: '2023-09-01',
    avatarInitials: 'CM',
    organizationId: 'org-1',
  },
  'team-lead': {
    id: 'user-10',
    name: 'Rachel Green',
    github: 'rachelg',
    role: 'team-lead',
    status: 'active',
    joinedAt: '2023-06-15',
    avatarInitials: 'RG',
  },
  intern: {
    id: 'user-1',
    name: 'Sarah Chen',
    github: 'sarahchen',
    role: 'intern',
    status: 'active',
    joinedAt: '2024-01-15',
    avatarInitials: 'SC',
  },
};

// Deprecated: Use roleToUserMap instead
export const currentUser = roleToUserMap.coordinator;

// Dev toggle: change role to 'admin' | 'coordinator' | 'team-lead' | 'intern' to access that dashboard after login.
export const mockAuthConfig: { role: UserRole; organizationId?: string } = {
  role: 'coordinator',
  // Set to 'org-1' to skip the join-organization prompt for interns.
  organizationId: undefined,
};

export const roleRedirects: Record<UserRole, string> = {
  intern: '/interns/dashboard',
  coordinator: '/coordinator/dashboard',
  'team-lead': '/teamlead/dashboard',
  admin: '/admin/dashboard',
};

export const performanceData = [
  { week: 'Week 1', score: 82 },
  { week: 'Week 2', score: 85 },
  { week: 'Week 3', score: 87 },
  { week: 'Week 4', score: 88 },
  { week: 'Week 5', score: 89 },
  { week: 'Week 6', score: 87 },
];

export const getInternById = (id: string) => interns.find(i => i.id === id);
export const getIssuesByInternId = (internId: string) => issues.filter(i => i.internId === internId);
export const getReportsByInternId = (internId: string) => reports.filter(r => r.internId === internId);
