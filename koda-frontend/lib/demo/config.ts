/**
 * Demo mode configuration.
 *
 * Frontend-only demo mode is enabled with NEXT_PUBLIC_DEMO_MODE=true. In demo
 * mode getPublicApiBaseUrl() returns DEMO_API_BASE, a sentinel origin that never
 * resolves, and lib/demo/install.ts answers every fetch to it from an in-memory
 * mock backend persisted in localStorage (DEMO_DB_STORAGE_KEY).
 */

export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

/** Sentinel API origin. Requests the shim misses fail loudly (DNS error). */
export const DEMO_API_BASE = 'https://api.koda-demo.invalid';

/** localStorage key of the persisted mock database. Never sessionStorage. */
export const DEMO_DB_STORAGE_KEY = 'koda_demo_db_v1';

/** Bump when the DemoDb shape or seed changes; older stored copies are reseeded. */
export const DEMO_DB_VERSION = 1;

/** Query param that wipes and reseeds the mock database on page load. */
export const DEMO_RESET_PARAM = 'demoReset';

/** App localStorage keys the join modals write and logout never clears. */
export const DEMO_SESSION_LEAK_KEYS = ['userBatchId', 'userSchool', 'selectedRole'] as const;

export type DemoPersonaKey =
  | 'admin'
  | 'coordinator'
  | 'intern'
  | 'intern-onshift'
  | 'intern-new';

export interface DemoPersona {
  key: DemoPersonaKey;
  /** Display name of the persona's user. */
  label: string;
  /** Short role label for the picker. */
  role: string;
  /** One-line hint shown under the name. */
  description: string;
  /** users.github_username of the persona (ids derive from it). */
  github_username: string;
}

export const DEMO_PERSONAS: DemoPersona[] = [
  {
    key: 'admin',
    label: 'Michael Torres',
    role: 'Admin',
    description: 'Users, batches, teams and live attendance',
    github_username: 'michaelt',
  },
  {
    key: 'coordinator',
    label: 'Carl Mendoza',
    role: 'Coordinator',
    description: 'Reviews intern reports and attendance',
    github_username: 'carlm',
  },
  {
    key: 'intern',
    label: 'Sarah Chen',
    role: 'Intern',
    description: 'Database Team, time in and file reports',
    github_username: 'sarahchen',
  },
  {
    key: 'intern-onshift',
    label: 'Marcus Rodriguez',
    role: 'Intern, on shift',
    description: 'Already timed in, time out for the EOD flow',
    github_username: 'mrodriguez',
  },
  {
    key: 'intern-new',
    label: 'Paolo Reyes',
    role: 'New intern',
    description: 'Joins with code KODA2026',
    github_username: 'paoloreyes',
  },
];

export const DEFAULT_DEMO_PERSONA: DemoPersonaKey = 'admin';

export function getDemoPersona(key: string): DemoPersona | undefined {
  return DEMO_PERSONAS.find((persona) => persona.key === key);
}
