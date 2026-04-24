import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../../supabase/supabase.service';
import type { JwtPayload, UserRecord } from '../auth.service';
import { USER_SELECT_FIELDS } from '../users/user-select';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly supabaseService: SupabaseService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<UserRecord> {
    const client = this.supabaseService.getClient();

    const response = await client
      .from('users')
      .select(
        `
        ${USER_SELECT_FIELDS},
        interns (
          id,
          school,
          batch_interns (
            batch_id
          )
        ),
        team_members (
          team_id,
          role,
          teams (
            name
          )
        )
      `,
      )
      .eq('id', payload.sub)
      .single();

    if (response.error || !response.data) {
      throw new UnauthorizedException('User not found');
    }

    const data = response.data as any;

    // Handle both array and object responses for joins
    const internData = data.interns;
    const internRecord = Array.isArray(internData) ? internData[0] : internData;

    const batchInternsData = internRecord?.batch_interns;
    const batchRecord = Array.isArray(batchInternsData)
      ? batchInternsData[0]
      : batchInternsData;

    const teamMembersData = data.team_members;
    const teamMembers = Array.isArray(teamMembersData)
      ? teamMembersData
      : teamMembersData
        ? [teamMembersData]
        : [];
    const internTeamMember = teamMembers.find(
      (member: any) => member?.role === 'intern',
    );
    const teamData = internTeamMember?.teams;
    const teamRecord = Array.isArray(teamData) ? teamData[0] : teamData;

    // Remove the joined objects and flatten to the UserRecord shape
    const { interns, team_members, ...userFields } = data;

    return {
      ...userFields,
      intern_id: internRecord?.id ?? null,
      batch_id: batchRecord?.batch_id ?? null,
      school: internRecord?.school ?? null,
      team_id: internTeamMember?.team_id ?? null,
      team_name: teamRecord?.name ?? null,
    };
  }
}
