import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '../common/enums/role.enum';
import { SupabaseService } from '../supabase/supabase.service';
import { AddTeamMemberDto } from './dto/add-team-member.dto';
import { CreateTeamDto } from './dto/create-team.dto';

type UserRow = {
  id: string;
  github_username: string | null;
  name: string | null;
  email: string | null;
  role: Role | null;
};

type TeamRow = {
  id: string;
  name: string;
  created_by: string;
  created_at: string | null;
  creator?: UserRow | null;
};

type TeamMemberRow = {
  id: string;
  team_id: string;
  user_id: string;
  role: Role;
  user?: UserRow | null;
};

type TeamDetail = {
  id: string;
  name: string;
  createdBy: {
    id: string;
    githubUsername: string | null;
    name: string | null;
    email: string | null;
    role: Role | null;
  } | null;
  createdAt: string | null;
  members: Array<{
    id: string;
    userId: string;
    role: Role;
    githubUsername: string | null;
    name: string | null;
    email: string | null;
    userRole: Role | null;
  }>;
  memberCount: number;
};

@Injectable()
export class TeamsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async create(
    createTeamDto: CreateTeamDto,
    creatorId: string,
  ): Promise<TeamDetail> {
    const teamName = createTeamDto.name?.trim();
    if (!teamName) {
      throw new BadRequestException('Team name is required.');
    }

    const creator = await this.getUserOrThrow(creatorId);
    if (creator.role !== Role.TEAM_LEAD && creator.role !== Role.COORDINATOR) {
      throw new BadRequestException(
        'Only users with team_lead or coordinator role can create teams.',
      );
    }

    const supabase = this.supabaseService.getClient();
    const result = (await supabase
      .from('teams')
      .insert({
        name: teamName,
        created_by: creatorId,
      })
      .select('id')
      .single()) as unknown as {
      data: { id: string } | null;
      error: { message: string } | null;
    };

    if (result.error || !result.data) {
      throw new BadRequestException(
        result.error?.message ?? 'Failed to create team.',
      );
    }

    return this.findOne(result.data.id);
  }

  async addMember(teamId: string, dto: AddTeamMemberDto): Promise<TeamDetail> {
    await this.getTeamOrThrow(teamId);
    await this.getUserOrThrow(dto.userId);

    const supabase = this.supabaseService.getClient();
    const existingMemberResult = (await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', teamId)
      .eq('user_id', dto.userId)
      .maybeSingle()) as unknown as {
      data: { id: string } | null;
      error: { message: string } | null;
    };

    if (existingMemberResult.error) {
      throw new BadRequestException(existingMemberResult.error.message);
    }

    if (existingMemberResult.data) {
      throw new ConflictException('User is already a member of this team.');
    }

    const insertResult = (await supabase
      .from('team_members')
      .insert({
        team_id: teamId,
        user_id: dto.userId,
        role: dto.role,
      })
      .select('id')
      .single()) as unknown as {
      data: { id: string } | null;
      error: { message: string } | null;
    };

    if (insertResult.error || !insertResult.data) {
      throw new BadRequestException(
        insertResult.error?.message ?? 'Failed to add team member.',
      );
    }

    return this.findOne(teamId);
  }

  async removeMember(teamId: string, userId: string): Promise<TeamDetail> {
    await this.getTeamOrThrow(teamId);

    const supabase = this.supabaseService.getClient();
    const deleteResult = (await supabase
      .from('team_members')
      .delete()
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .select('id')
      .maybeSingle()) as unknown as {
      data: { id: string } | null;
      error: { message: string } | null;
    };

    if (deleteResult.error) {
      throw new BadRequestException(deleteResult.error.message);
    }

    if (!deleteResult.data) {
      throw new NotFoundException('Team member not found.');
    }

    return this.findOne(teamId);
  }

  async findOne(id: string): Promise<TeamDetail> {
    const team = await this.getTeamOrThrow(id);

    const supabase = this.supabaseService.getClient();
    const membersResult = (await supabase
      .from('team_members')
      .select(
        'id, team_id, user_id, role, user:user_id(id, github_username, name, email, role)',
      )
      .eq('team_id', id)) as unknown as {
      data: TeamMemberRow[] | null;
      error: { message: string } | null;
    };

    if (membersResult.error) {
      throw new BadRequestException(membersResult.error.message);
    }

    const members = (membersResult.data ?? []).map((member) => ({
      id: member.id,
      userId: member.user_id,
      role: member.role,
      githubUsername: member.user?.github_username ?? null,
      name: member.user?.name ?? null,
      email: member.user?.email ?? null,
      userRole: member.user?.role ?? null,
    }));

    return {
      id: team.id,
      name: team.name,
      createdBy: team.creator
        ? {
            id: team.creator.id,
            githubUsername: team.creator.github_username,
            name: team.creator.name,
            email: team.creator.email,
            role: team.creator.role,
          }
        : null,
      createdAt: team.created_at,
      members,
      memberCount: members.length,
    };
  }

  private async getTeamOrThrow(id: string): Promise<TeamRow> {
    const supabase = this.supabaseService.getClient();
    const result = (await supabase
      .from('teams')
      .select(
        'id, name, created_by, created_at, creator:created_by(id, github_username, name, email, role)',
      )
      .eq('id', id)
      .single()) as unknown as {
      data: TeamRow | null;
      error: { message: string } | null;
    };

    if (result.error || !result.data) {
      throw new NotFoundException('Team not found.');
    }

    return result.data;
  }

  private async getUserOrThrow(id: string): Promise<UserRow> {
    const supabase = this.supabaseService.getClient();
    const result = (await supabase
      .from('users')
      .select('id, github_username, name, email, role')
      .eq('id', id)
      .single()) as unknown as {
      data: UserRow | null;
      error: { message: string } | null;
    };

    if (result.error || !result.data) {
      throw new NotFoundException('User not found.');
    }

    return result.data;
  }
}
