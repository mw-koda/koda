/**
 * Demo auth tokens.
 *
 * The frontend never decodes koda_token, so demo tokens are opaque strings of
 * the form 'demo.<userId>'. The login persona picker navigates to
 * /auth/callback?token=<tokenFor(userId)> and the callback page stores it.
 */

import { getDemoPersona } from './config';
import { ids } from './ids';
import { userById } from './lookups';
import type { DemoDb, UserRow } from './types';

const TOKEN_PREFIX = 'demo.';

export function tokenFor(userId: string): string {
  return `${TOKEN_PREFIX}${userId}`;
}

/** User id a persona logs in as (ids derive from github_username). */
export function personaUserId(personaKey: string): string | null {
  const persona = getDemoPersona(personaKey);
  return persona ? ids.user(persona.github_username) : null;
}

export function tokenForPersona(personaKey: string): string | null {
  const userId = personaUserId(personaKey);
  return userId ? tokenFor(userId) : null;
}

/** Extract the token from an Authorization header value ('Bearer <token>'). */
export function tokenFromAuthorization(header: string | null | undefined): string | null {
  if (!header) return null;
  const match = header.match(/^\s*Bearer\s+(.+?)\s*$/i);
  return match ? match[1] : null;
}

/** Resolve a user from a token (with or without the 'Bearer ' prefix). */
export function userFromToken(db: DemoDb, token: string | null | undefined): UserRow | null {
  if (!token) return null;
  const raw = tokenFromAuthorization(token) ?? token.trim();
  if (!raw.startsWith(TOKEN_PREFIX)) return null;
  return userById(db, raw.slice(TOKEN_PREFIX.length));
}
