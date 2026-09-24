/**
 * Deterministic ids and seeded randomness for the demo backend.
 *
 * Seed rows get RFC-4122 v4-shaped UUIDs derived from a stable string key
 * (uuidFromKey), so ids survive reseeds and bookmarked URLs keep working.
 * Use the `ids` helpers to find a seeded row's id without searching, e.g.
 * ids.user('sarahchen'), ids.intern('sarahchen'), ids.team('database').
 * Rows created at runtime (POST handlers) use newId().
 */

/** Same regex the frontend and backend use to gate UUIDs. */
export const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_REGEX.test(value);
}

/** cyrb128: fast 128-bit string hash (four 32-bit words). */
function hash128(input: string): [number, number, number, number] {
  let h1 = 1779033703;
  let h2 = 3144134277;
  let h3 = 1013904242;
  let h4 = 2773480762;

  for (let i = 0; i < input.length; i++) {
    const k = input.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }

  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  h1 ^= h2 ^ h3 ^ h4;
  h2 ^= h1;
  h3 ^= h1;
  h4 ^= h1;

  return [h1 >>> 0, h2 >>> 0, h3 >>> 0, h4 >>> 0];
}

/** 32-bit unsigned hash of a string (for PRNG seeds and numeric ids). */
export function hashString(input: string): number {
  return hash128(input)[0];
}

function formatV4(hex: string): string {
  const chars = hex.split('');
  chars[12] = '4';
  chars[16] = ((parseInt(chars[16], 16) & 0x3) | 0x8).toString(16);
  const h = chars.join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
}

/** Deterministic v4-style UUID for a stable key such as 'user:sarahchen'. */
export function uuidFromKey(key: string): string {
  const hex = hash128(key)
    .map((word) => word.toString(16).padStart(8, '0'))
    .join('');
  return formatV4(hex);
}

/** Random v4 UUID for rows created at runtime. */
export function newId(): string {
  const cryptoObj: Crypto | undefined = typeof crypto !== 'undefined' ? crypto : undefined;

  if (cryptoObj && typeof cryptoObj.randomUUID === 'function') {
    try {
      return cryptoObj.randomUUID();
    } catch {
      // randomUUID needs a secure context; fall through.
    }
  }

  const bytes = new Uint8Array(16);
  if (cryptoObj && typeof cryptoObj.getRandomValues === 'function') {
    cryptoObj.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return formatV4(hex);
}

/**
 * Stable id keys used by the seed. Domain handlers can use these to reference
 * seeded rows directly (for example ids.batch('B1') is the active batch).
 */
export const ids = {
  user: (githubUsername: string) => uuidFromKey(`user:${githubUsername}`),
  intern: (githubUsername: string) => uuidFromKey(`intern:${githubUsername}`),
  /** 'B1' (active), 'B2' (upcoming), 'B3' (completed) */
  batch: (key: string) => uuidFromKey(`batch:${key}`),
  batchIntern: (githubUsername: string) => uuidFromKey(`batch_intern:${githubUsername}`),
  /** 'database' | 'ghl' | 'scraping' | 'agentic-rag' | 'pilot' */
  team: (key: string) => uuidFromKey(`team:${key}`),
  teamMember: (teamKey: string, githubUsername: string) =>
    uuidFromKey(`team_member:${teamKey}:${githubUsername}`),
  /** full name, e.g. 'metawatt/leads-api' */
  repo: (fullName: string) => uuidFromKey(`repo:${fullName}`),
  issue: (fullName: string, issueNumber: number | string) =>
    uuidFromKey(`issue:${fullName}#${issueNumber}`),
  assignment: (fullName: string, issueNumber: number | string) =>
    uuidFromKey(`issue_assignment:${fullName}#${issueNumber}`),
  /** type: 'eod' | 'weekly' | 'monthly'; periodKey: 'YYYY-MM-DD' of period_start */
  report: (githubUsername: string, type: string, periodKey: string) =>
    uuidFromKey(`report:${githubUsername}:${type}:${periodKey}`),
  /** dateKey: UTC 'YYYY-MM-DD' of time_in */
  attendance: (githubUsername: string, dateKey: string) =>
    uuidFromKey(`attendance:${githubUsername}:${dateKey}`),
};

/** mulberry32 PRNG: deterministic floats in [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Rng {
  /** Float in [0, 1). */
  next(): number;
  /** Integer in [min, max] (inclusive). */
  int(min: number, max: number): number;
  /** True with probability p. */
  chance(p: number): boolean;
  pick<T>(items: readonly T[]): T;
  /** New shuffled copy (Fisher-Yates). */
  shuffle<T>(items: readonly T[]): T[];
}

/** Seeded PRNG helper. Same seed (string or number) => same sequence. */
export function createRng(seed: string | number): Rng {
  const next = mulberry32(typeof seed === 'number' ? seed : hashString(seed));

  const rng: Rng = {
    next,
    int(min, max) {
      return min + Math.floor(next() * (max - min + 1));
    },
    chance(p) {
      return next() < p;
    },
    pick(items) {
      return items[Math.floor(next() * items.length)];
    },
    shuffle(items) {
      const copy = [...items];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        const tmp = copy[i];
        copy[i] = copy[j];
        copy[j] = tmp;
      }
      return copy;
    },
  };

  return rng;
}
