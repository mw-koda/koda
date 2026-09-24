/**
 * Persistence for the demo mock database.
 *
 * getDb() returns the live in-memory DemoDb, loading it lazily from
 * localStorage (DEMO_DB_STORAGE_KEY). A missing, unparsable, wrong-version or
 * stale copy (seededFor !== today's UTC date key) is replaced by a fresh
 * createSeed(new Date()). All storage access is wrapped in try/catch; when
 * storage is unavailable the db simply lives in memory. sessionStorage is
 * never used (auth.clearSession() clears it on logout).
 */

import { DEMO_DB_STORAGE_KEY, DEMO_DB_VERSION } from './config';
import { createSeed } from './seed';
import { utcDateKey } from './time';
import { DEMO_TABLE_NAMES, type DemoDb } from './types';

let cache: DemoDb | null = null;
let listenerInstalled = false;

function getStorage(): Storage | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }
    return window.localStorage;
  } catch {
    return null;
  }
}

function isUsable(value: unknown, todayKey: string): value is DemoDb {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<DemoDb> & Record<string, unknown>;
  if (candidate.version !== DEMO_DB_VERSION || candidate.seededFor !== todayKey) {
    return false;
  }

  return DEMO_TABLE_NAMES.every((name) => Array.isArray(candidate[name]));
}

function readStored(todayKey: string): DemoDb | null {
  const storage = getStorage();
  if (!storage) {
    return null;
  }

  try {
    const raw = storage.getItem(DEMO_DB_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed: unknown = JSON.parse(raw);
    return isUsable(parsed, todayKey) ? parsed : null;
  } catch {
    return null;
  }
}

/** Drop the in-memory copy when another tab writes the db. */
function installStorageListener(): void {
  if (listenerInstalled || typeof window === 'undefined') {
    return;
  }
  listenerInstalled = true;

  try {
    window.addEventListener('storage', (event) => {
      if (event.key === null || event.key === DEMO_DB_STORAGE_KEY) {
        cache = null;
      }
    });
  } catch {
    // Ignore: cross-tab sync is a nicety.
  }
}

/** The live mock database (seeded for today's UTC date). Mutate it in place, then saveDb(). */
export function getDb(): DemoDb {
  const todayKey = utcDateKey(new Date());

  if (cache && cache.version === DEMO_DB_VERSION && cache.seededFor === todayKey) {
    return cache;
  }

  installStorageListener();

  const stored = readStored(todayKey);
  if (stored) {
    cache = stored;
    return cache;
  }

  cache = createSeed(new Date());
  saveDb(cache);
  return cache;
}

/** Persist the db (default: the live one) to localStorage. Never throws. */
export function saveDb(db: DemoDb | null = cache): void {
  if (!db) {
    return;
  }

  cache = db;
  const storage = getStorage();
  if (!storage) {
    return;
  }

  try {
    storage.setItem(DEMO_DB_STORAGE_KEY, JSON.stringify(db));
  } catch (error) {
    console.warn('[demo] could not persist demo db', error);
  }
}

/** Wipe and reseed for now; returns the fresh db. */
export function resetDb(): DemoDb {
  const storage = getStorage();
  if (storage) {
    try {
      storage.removeItem(DEMO_DB_STORAGE_KEY);
    } catch {
      // Ignore.
    }
  }

  cache = createSeed(new Date());
  saveDb(cache);
  return cache;
}
