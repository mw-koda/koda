import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import { Role } from '../../common/enums/role.enum';
import type { UserRecord } from '../auth.service';
import { USER_SELECT_FIELDS } from './user-select';
import { OnboardUserDto } from './dto/onboard-user.dto';
import { GetUsersQueryDto } from './dto/get-users.query.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async onboardUser(dto: OnboardUserDto): Promise<UserRecord> {
    const client = this.supabaseService.getClient();
    const githubUsername = dto.githubUsername.trim();
    const role = dto.role ?? Role.INTERN;

    const existingResponse = await client
      .from('users')
      .select(USER_SELECT_FIELDS)
      .eq('github_username', githubUsername)
      .maybeSingle();

    if (existingResponse.error) {
      this.logger.error(
        'Failed to lookup user for onboarding',
        existingResponse.error.message,
      );
      throw new InternalServerErrorException('Failed to onboard user');
    }

    if (existingResponse.data) {
      const updateResponse = await client
        .from('users')
        .update({
          role,
          is_onboarded: true,
          name: existingResponse.data.name ?? githubUsername,
        })
        .eq('id', existingResponse.data.id)
        .select(USER_SELECT_FIELDS)
        .single();

      if (updateResponse.error || updateResponse.data === null) {
        this.logger.error(
          'Failed to update existing user during onboarding',
          updateResponse.error?.message,
        );
        throw new InternalServerErrorException('Failed to onboard user');
      }

      return updateResponse.data;
    }

    const insertResponse = await client
      .from('users')
      .insert({
        github_username: githubUsername,
        name: githubUsername,
        role,
        is_onboarded: true,
      })
      .select(USER_SELECT_FIELDS)
      .single();

    if (insertResponse.error || insertResponse.data === null) {
      this.logger.error(
        'Failed to create user during onboarding',
        insertResponse.error?.message,
      );
      throw new InternalServerErrorException('Failed to onboard user');
    }

    return insertResponse.data;
  }

  async getUsers(query: GetUsersQueryDto = {}): Promise<UserRecord[]> {
    const client = this.supabaseService.getClient();

    const response = await client
      .from('users')
      .select(USER_SELECT_FIELDS)
      .order('created_at', { ascending: false });

    if (response.error) {
      this.logger.error('Failed to fetch users', response.error.message);
      throw new InternalServerErrorException('Failed to fetch users');
    }

    const search = query.search?.toLowerCase();

    return (response.data || []).filter((user) => {
      if (query.role && user.role !== query.role) {
        return false;
      }

      if (!search) {
        return true;
      }

      return [user.github_username, user.name, user.email].some((value) => {
        return value?.toLowerCase().includes(search) ?? false;
      });
    });
  }
}
