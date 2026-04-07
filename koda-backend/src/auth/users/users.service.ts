import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import { Role } from '../../common/enums/role.enum';
import type { UserRecord } from '../auth.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async onboardUser(userId: string, role: Role): Promise<UserRecord> {
    const client = this.supabaseService.getClient();

    // Update user role and set is_onboarded to true
    const response = await client
      .from('users')
      .update({ role, is_onboarded: true })
      .eq('id', userId)
      .select(
        'id, github_id, github_username, email, avatar_url, role, is_onboarded, created_at, updated_at',
      )
      .single();

    if (response.error) {
      this.logger.error('Failed to onboard user', response.error.message);
      throw new ForbiddenException('Failed to onboard user');
    }

    return response.data;
  }

  async getUsers(): Promise<UserRecord[]> {
    const client = this.supabaseService.getClient();

    const response = await client
      .from('users')
      .select(
        'id, github_id, github_username, email, avatar_url, role, is_onboarded, created_at, updated_at',
      );

    if (response.error) {
      this.logger.error('Failed to fetch users', response.error.message);
      throw new ForbiddenException('Failed to fetch users');
    }

    return response.data || [];
  }
}
