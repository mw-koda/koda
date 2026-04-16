import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { PostgrestMaybeSingleResponse } from '@supabase/supabase-js';
import { SupabaseService } from '../supabase/supabase.service';
import { Role } from '../common/enums/role.enum';
import { USER_SELECT_FIELDS } from './users/user-select';

interface GithubUser {
  githubId: string;
  username: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
  accessToken: string;
}

export interface UserRecord {
  id: string;
  github_id: string;
  github_username: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: Role;
  is_onboarded: boolean;
  created_at: string;
  updated_at: string;
}

export interface JwtPayload {
  sub: string;
  role: Role;
}

/** Columns written on insert — everything except server-generated fields. */
type NewUserInsert = Omit<UserRecord, 'id' | 'created_at' | 'updated_at'>;

/**
 * Narrows an unknown catch-block value to an Error so we can safely read
 * `.message`.  Falls back to a string representation for non-Error throws.
 */
function toErrorMessage(value: unknown): string {
  if (value instanceof Error) return value.message;
  return String(value);
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private jwtService: JwtService,
    private supabaseService: SupabaseService,
  ) {}

  async findOrCreateUser(githubUser: GithubUser): Promise<UserRecord> {
    const client = this.supabaseService.getClient();
    const existingResponse = (await client
      .from('users')
      .select(USER_SELECT_FIELDS)
      .eq('github_id', githubUser.githubId)
      .maybeSingle()) as PostgrestMaybeSingleResponse<UserRecord>;

    if (existingResponse.error !== null) {
      this.logger.error(
        'Failed to fetch existing user from Supabase',
        existingResponse.error.message,
      );
      throw new InternalServerErrorException('Failed to fetch existing user');
    }

    if (existingResponse.data !== null) {
      const updateResponse = await client
        .from('users')
        .update({
          github_username: githubUser.username,
          name: existingResponse.data.name ?? githubUser.name ?? githubUser.username,
          email: githubUser.email,
          avatar_url: githubUser.avatarUrl,
          is_onboarded: true,
        })
        .eq('id', existingResponse.data.id)
        .select(USER_SELECT_FIELDS)
        .single();

      if (updateResponse.error !== null || updateResponse.data === null) {
        this.logger.error(
          'Failed to update existing user from GitHub login',
          updateResponse.error?.message,
        );
        throw new InternalServerErrorException('Failed to update user');
      }

      this.logger.log(
        `Existing user logged in: ${updateResponse.data.github_username}`,
      );
      return updateResponse.data;
    }

    const usernameResponse = (await client
      .from('users')
      .select(USER_SELECT_FIELDS)
      .eq('github_username', githubUser.username)
      .maybeSingle()) as PostgrestMaybeSingleResponse<UserRecord>;

    if (usernameResponse.error !== null) {
      this.logger.error(
        'Failed to fetch username-matched user from Supabase',
        usernameResponse.error.message,
      );
      throw new InternalServerErrorException('Failed to fetch existing user');
    }

    if (usernameResponse.data !== null) {
      const updateResponse = await client
        .from('users')
        .update({
          github_id: githubUser.githubId,
          github_username: githubUser.username,
          name: usernameResponse.data.name ?? githubUser.name ?? githubUser.username,
          email: githubUser.email,
          avatar_url: githubUser.avatarUrl,
          is_onboarded: true,
        })
        .eq('id', usernameResponse.data.id)
        .select(USER_SELECT_FIELDS)
        .single();

      if (updateResponse.error !== null || updateResponse.data === null) {
        this.logger.error(
          'Failed to attach GitHub identity to onboarded user',
          updateResponse.error?.message,
        );
        throw new InternalServerErrorException('Failed to update user');
      }

      this.logger.log(
        `Existing user matched by username: ${updateResponse.data.github_username}`,
      );
      return updateResponse.data;
    }

    const newUser: NewUserInsert = {
      github_id: githubUser.githubId,
      github_username: githubUser.username,
      name: githubUser.name ?? githubUser.username,
      email: githubUser.email,
      avatar_url: githubUser.avatarUrl,
      role: Role.INTERN,
      is_onboarded: false,
    };

    // Same rationale for the cast as above: explicit columns + cast keeps
    // ESLint happy without resorting to `any` or `@ts-ignore`.
    const createResponse = await client
      .from('users')
      .insert(newUser)
      .select(USER_SELECT_FIELDS)
      .single();

    if (createResponse.error !== null || createResponse.data === null) {
      // createResponse.error is PostgrestError | null — .message is always safe.
      this.logger.error(
        'Failed to create user in Supabase',
        createResponse.error?.message,
      );
      throw new InternalServerErrorException('Failed to create user');
    }

    this.logger.log(`New user created: ${createResponse.data.github_username}`);
    return createResponse.data;
  }

  generateToken(user: { id: string; role: Role }): string {
    const payload: JwtPayload = {
      sub: user.id,
      role: user.role,
    };

    return this.jwtService.sign(payload);
  }
}

// Re-export the helper so callers in catch blocks can use it without
// duplicating the instanceof pattern throughout the codebase.
export { toErrorMessage };
