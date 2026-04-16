import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
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
    creatorRole: Role,
  ): Promise<TeamDetail> {
    const teamName = createTeamDto.name?.trim();
    if (!teamName) {
      throw new BadRequestException('Team name is required.');
    }

    if (!this.canManageTeams(creatorRole)) {
      throw new BadRequestException(
        'Only users with admin or team_lead role can create teams.',
      );
    }

    await this.getUserOrThrow(creatorId);

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

    if (createTeamDto.teamLeadId) {
      const assignedLead = await this.getUserOrThrow(createTeamDto.teamLeadId);
      if (assignedLead.role !== Role.TEAM_LEAD) {
        throw new BadRequestException('Assigned team lead must have team_lead role.');
      }

      const addLeadResult = (await supabase
        .from('team_members')
        .insert({
          team_id: result.data.id,
          user_id: createTeamDto.teamLeadId,
          role: Role.TEAM_LEAD,
        })) as unknown as {
        error: { message: string } | null;
      };

      if (addLeadResult.error) {
        throw new BadRequestException(addLeadResult.error.message);
      }
    }

    return this.findOne(result.data.id, creatorId, creatorRole);
  }

  async addMember(
    teamId: string,
    dto: AddTeamMemberDto,
    actorId: string,
    actorRole: Role,
  ): Promise<TeamDetail> {
    await this.assertCanManageTeam(teamId, actorId, actorRole);
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

    return this.findOne(teamId, actorId, actorRole);
  }

  async removeMember(
    teamId: string,
    userId: string,
    actorId: string,
    actorRole: Role,
  ): Promise<TeamDetail> {
    await this.assertCanManageTeam(teamId, actorId, actorRole);

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

    return this.findOne(teamId, actorId, actorRole);
  }

  async findOne(id: string, actorId: string, actorRole: Role): Promise<TeamDetail> {
    await this.assertCanManageTeam(id, actorId, actorRole);
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

  async findMine(actorId: string, actorRole: Role): Promise<TeamDetail[]> {
    if (!this.canManageTeams(actorRole)) {
      throw new ForbiddenException('You are not allowed to manage teams.');
    }

    const supabase = this.supabaseService.getClient();
    const teamsResult = (await supabase
      .from('teams')
      .select('id')
      .eq('created_by', actorId)
      .order('created_at', { ascending: false })) as unknown as {
      data: Array<{ id: string }> | null;
      error: { message: string } | null;
    };

    if (teamsResult.error) {
      throw new BadRequestException(teamsResult.error.message);
    }

    const teamIds = (teamsResult.data ?? []).map((team) => team.id);
    return Promise.all(teamIds.map((id) => this.findOne(id, actorId, actorRole)));
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

  private canManageTeams(role: Role): boolean {
    return role === Role.ADMIN || role === Role.TEAM_LEAD;
  }

  private async assertCanManageTeam(
    teamId: string,
    actorId: string,
    actorRole: Role,
  ): Promise<void> {
    if (!this.canManageTeams(actorRole)) {
      throw new ForbiddenException('Only admins and team leads can manage teams.');
    }

    const team = await this.getTeamOrThrow(teamId);
    if (team.created_by !== actorId) {
      throw new ForbiddenException('You can only manage teams you created.');
    }
  }
}
