import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Role } from '../common/enums/role.enum';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class DefaultAdminSeeder implements OnApplicationBootstrap {
  private readonly logger = new Logger(DefaultAdminSeeder.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly supabaseService: SupabaseService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const email = this.configService.get<string>('DEFAULT_ADMIN_EMAIL')?.trim();
    if (!email) {
      this.logger.log(
        'Skipping default admin seed: DEFAULT_ADMIN_EMAIL is not set.',
      );
      return;
    }

    if (!this.supabaseService.isConfigured()) {
      this.logger.warn('Skipping default admin seed: Supabase is not configured.');
      return;
    }

    const name =
      this.configService.get<string>('DEFAULT_ADMIN_NAME')?.trim() ||
      'System Administrator';
    const githubUsername =
      this.configService
        .get<string>('DEFAULT_ADMIN_GITHUB_USERNAME')
        ?.trim() || 'system-admin';
    const githubId =
      this.configService.get<string>('DEFAULT_ADMIN_GITHUB_ID')?.trim() ||
      `seed-admin:${email}`;

    const client = this.supabaseService.getClient();
    const existing = await client
      .from('users')
      .select('id, role, email')
      .eq('email', email)
      .maybeSingle();

    if (existing.error) {
      this.logger.error(
        `Failed checking default admin user: ${existing.error.message}`,
      );
      return;
    }

    if (existing.data) {
      if (existing.data.role === Role.ADMIN) {
        this.logger.log(`Default admin already exists: ${email}`);
        return;
      }

      const updateResult = await client
        .from('users')
        .update({ role: Role.ADMIN, name })
        .eq('id', existing.data.id);

      if (updateResult.error) {
        this.logger.error(
          `Failed promoting user to ADMIN: ${updateResult.error.message}`,
        );
        return;
      }

      this.logger.log(`Promoted existing user to ADMIN: ${email}`);
      return;
    }

    const insertResult = await client.from('users').insert({
      email,
      name,
      github_id: githubId,
      github_username: githubUsername,
      role: Role.ADMIN,
    });

    if (insertResult.error) {
      this.logger.error(
        `Failed creating default admin user: ${insertResult.error.message}`,
      );
      return;
    }

    this.logger.log(`Created default ADMIN account: ${email}`);
  }
}