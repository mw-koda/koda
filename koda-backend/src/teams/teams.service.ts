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
  batch_id: string | null;
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
  batchId: string | null;
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

type TeamIssueState = 'open' | 'closed' | 'in_progress';

type TeamDashboardIssue = {
  id: string;
  title: string;
  repo: string;
  user: string;
  status: TeamIssueState;
  createdAt: string | null;
  updatedAt: string | null;
  closedAt: string | null;
  assignedAt: string | null;
  labels: Array<Record<string, unknown>>;
  rawPayload: Record<string, unknown> | null;
};

type TeamDashboardMetrics = {
  openIssues: number;
  inProgressIssues: number;
  closedIssues: number;
  highPriorityIssues: number;
};

type TeamDashboardRecentIssueItem = {
  id: string;
  title: string;
  repo: string;
  user: string;
  status: TeamIssueState;
};

type TeamDashboardLogItem = {
  type: string;
  message: string;
  time: string;
  timestamp: string;
};

export type TeamDashboardData = {
  team: TeamDetail;
  metrics: TeamDashboardMetrics;
  recentIssues: TeamDashboardRecentIssueItem[];
  logs: TeamDashboardLogItem[];
};

type TeamInternRow = {
  id: string;
};

type InternByUserRow = {
  id: string;
};

type TeamIssueAssignmentRow = {
  issue_id: string;
  assigned_at: string | null;
  issues: {
    id: string;
    title: string | null;
    state: TeamIssueState;
    created_at: string | null;
    updated_at: string | null;
    closed_at: string | null;
    labels: Array<Record<string, unknown>> | null;
    raw_payload: Record<string, unknown> | null;
    repositories?: {
      full_name: string | null;
    } | null;
  } | null;
  interns?: {
    users?: {
      name: string | null;
      github_username: string | null;
    } | null;
  } | null;
};

@Injectable()
export class TeamsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getDashboard(
    teamId: string,
    actorId: string,
    actorRole: Role,
  ): Promise<TeamDashboardData> {
    const team = await this.findOne(teamId, actorId, actorRole);
    const internIds = await this.getInternIdsByTeam(teamId);

    if (internIds.length === 0) {
      return {
        team,
        metrics: {
          openIssues: 0,
          inProgressIssues: 0,
          closedIssues: 0,
          highPriorityIssues: 0,
        },
        recentIssues: [],
        logs: [],
      };
    }

    const assignments = await this.getIssueAssignmentsByInternIds(internIds);
    const issues = this.deduplicateAssignedIssues(assignments);

    return {
      team,
      metrics: this.computeDashboardMetrics(issues),
      recentIssues: this.buildRecentIssues(issues),
      logs: this.buildActivityLogs(issues),
    };
  }

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
    await this.getBatchOrThrow(createTeamDto.batchId);

    const supabase = this.supabaseService.getClient();
    const result = (await supabase
      .from('teams')
      .insert({
        name: teamName,
        batch_id: createTeamDto.batchId,
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
        throw new BadRequestException(
          'Assigned team lead must have team_lead role.',
        );
      }

      const addLeadResult = (await supabase.from('team_members').insert({
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
    const team = await this.assertCanManageTeam(teamId, actorId, actorRole);
    await this.getUserOrThrow(dto.userId);

    if (dto.role === Role.INTERN) {
      await this.assertInternBelongsToTeamBatch(dto.userId, team);
    }

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

  async findOne(
    id: string,
    actorId: string,
    actorRole: Role,
  ): Promise<TeamDetail> {
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
      batchId: team.batch_id,
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

  async findMine(
    actorId: string,
    actorRole: Role,
    batchId?: string,
  ): Promise<TeamDetail[]> {
    if (!this.canManageTeams(actorRole)) {
      throw new ForbiddenException('You are not allowed to manage teams.');
    }

    if (batchId && !this.isUuid(batchId)) {
      throw new BadRequestException('Invalid batchId query parameter.');
    }

    const supabase = this.supabaseService.getClient();
    let teamsQuery = supabase
      .from('teams')
      .select('id')
      .eq('created_by', actorId)
      .order('created_at', { ascending: false });

    if (batchId) {
      teamsQuery = teamsQuery.eq('batch_id', batchId);
    }

    const teamsResult = (await teamsQuery) as unknown as {
      data: Array<{ id: string }> | null;
      error: { message: string } | null;
    };

    if (teamsResult.error) {
      throw new BadRequestException(teamsResult.error.message);
    }

    const teamIds = (teamsResult.data ?? []).map((team) => team.id);
    return Promise.all(
      teamIds.map((id) => this.findOne(id, actorId, actorRole)),
    );
  }

  private async getInternIdsByTeam(teamId: string): Promise<string[]> {
    const supabase = this.supabaseService.getClient();
    const result = (await supabase
      .from('interns')
      .select('id')
      .eq('team_id', teamId)) as unknown as {
      data: TeamInternRow[] | null;
      error: { message: string } | null;
    };

    if (result.error) {
      throw new BadRequestException(result.error.message);
    }

    return (result.data ?? []).map((intern) => intern.id);
  }

  private async getIssueAssignmentsByInternIds(
    internIds: string[],
  ): Promise<TeamIssueAssignmentRow[]> {
    const supabase = this.supabaseService.getClient();
    const result = (await supabase
      .from('issue_assignments')
      .select(
        'issue_id, assigned_at, issues!inner(id, title, state, created_at, updated_at, closed_at, labels, raw_payload, repositories:repo_id(full_name)), interns!inner(users(name, github_username))',
      )
      .in('intern_id', internIds)
      .order('assigned_at', { ascending: false })) as unknown as {
      data: TeamIssueAssignmentRow[] | null;
      error: { message: string } | null;
    };

    if (result.error) {
      throw new BadRequestException(result.error.message);
    }

    return result.data ?? [];
  }

  private deduplicateAssignedIssues(
    assignments: TeamIssueAssignmentRow[],
  ): TeamDashboardIssue[] {
    const uniqueIssues = new Map<string, TeamDashboardIssue>();

    for (const row of assignments) {
      if (!row.issues || uniqueIssues.has(row.issue_id)) {
        continue;
      }

      const assignedUserName =
        row.interns?.users?.name?.trim() ||
        row.interns?.users?.github_username?.trim() ||
        'Unassigned';

      uniqueIssues.set(row.issue_id, {
        id: row.issues.id,
        title: row.issues.title?.trim() || 'Untitled issue',
        repo:
          row.issues.repositories?.full_name?.trim() || 'Unknown repository',
        user: assignedUserName,
        status: row.issues.state,
        createdAt: row.issues.created_at,
        updatedAt: row.issues.updated_at,
        closedAt: row.issues.closed_at,
        assignedAt: row.assigned_at,
        labels: row.issues.labels ?? [],
        rawPayload: row.issues.raw_payload ?? null,
      });
    }

    return Array.from(uniqueIssues.values()).sort((a, b) => {
      const aTime = this.getActivityTimestamp(a);
      const bTime = this.getActivityTimestamp(b);
      return bTime - aTime;
    });
  }

  private computeDashboardMetrics(
    issues: TeamDashboardIssue[],
  ): TeamDashboardMetrics {
    let openIssues = 0;
    let inProgressIssues = 0;
    let closedIssues = 0;
    let highPriorityIssues = 0;

    for (const issue of issues) {
      if (issue.status === 'open') {
        openIssues += 1;
      } else if (issue.status === 'in_progress') {
        inProgressIssues += 1;
      } else if (issue.status === 'closed') {
        closedIssues += 1;
      }

      if (this.isHighPriority(issue)) {
        highPriorityIssues += 1;
      }
    }

    return {
      openIssues,
      inProgressIssues,
      closedIssues,
      highPriorityIssues,
    };
  }

  private buildRecentIssues(
    issues: TeamDashboardIssue[],
  ): TeamDashboardRecentIssueItem[] {
    return issues.slice(0, 5).map((issue) => ({
      id: issue.id,
      title: issue.title,
      repo: issue.repo,
      user: issue.user,
      status: issue.status,
    }));
  }

  private buildActivityLogs(
    issues: TeamDashboardIssue[],
  ): TeamDashboardLogItem[] {
    const entries: TeamDashboardLogItem[] = [];

    for (const issue of issues) {
      const referenceDate =
        issue.assignedAt ||
        issue.updatedAt ||
        issue.createdAt ||
        issue.closedAt;
      if (!referenceDate) {
        continue;
      }

      entries.push({
        type: this.toActivityType(issue.status),
        message: `${issue.user} handled issue: ${issue.title}`,
        time: this.formatRelativeTime(referenceDate),
        timestamp: referenceDate,
      });
    }

    return entries
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
      .slice(0, 10);
  }

  private toActivityType(status: TeamIssueState): string {
    if (status === 'closed') {
      return 'ISSUE_CLOSED';
    }

    if (status === 'in_progress') {
      return 'ISSUE_PROGRESS';
    }

    return 'ISSUE_OPEN';
  }

  private isHighPriority(issue: TeamDashboardIssue): boolean {
    const labels = this.collectIssueLabelTexts(issue);
    const priorityPattern =
      /(\bhigh\b|\bp0\b|\bp1\b|\bcritical\b|\bsev1\b|priority[:\s_-]*high)/i;

    return labels.some((label) => priorityPattern.test(label));
  }

  private collectIssueLabelTexts(issue: TeamDashboardIssue): string[] {
    const labels: string[] = [];

    for (const label of issue.labels) {
      const labelName = this.extractLabelName(label);
      if (labelName) {
        labels.push(labelName);
      }
    }

    const rawLabels = issue.rawPayload?.labels;
    if (Array.isArray(rawLabels)) {
      for (const label of rawLabels) {
        const labelName = this.extractLabelName(label);
        if (labelName) {
          labels.push(labelName);
        }
      }
    }

    return labels;
  }

  private extractLabelName(label: unknown): string | null {
    if (!label || typeof label !== 'object') {
      return null;
    }

    const labelRecord = label as Record<string, unknown>;
    if (!('name' in labelRecord)) {
      return null;
    }

    const name = labelRecord['name'];
    return typeof name === 'string' ? name : null;
  }

  private getActivityTimestamp(issue: TeamDashboardIssue): number {
    const dateValue =
      issue.updatedAt || issue.assignedAt || issue.createdAt || issue.closedAt;

    if (!dateValue) {
      return 0;
    }

    const parsed = new Date(dateValue).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  private formatRelativeTime(value: string): string {
    const target = new Date(value).getTime();
    if (Number.isNaN(target)) {
      return 'unknown';
    }

    const diffMs = Math.max(0, Date.now() - target);
    const minutes = Math.floor(diffMs / 60_000);
    const hours = Math.floor(diffMs / 3_600_000);
    const days = Math.floor(diffMs / 86_400_000);

    if (minutes < 1) {
      return 'just now';
    }

    if (minutes < 60) {
      return `${minutes}m ago`;
    }

    if (hours < 24) {
      return `${hours}h ago`;
    }

    return `${days}d ago`;
  }

  private async getTeamOrThrow(id: string): Promise<TeamRow> {
    const supabase = this.supabaseService.getClient();
    const result = (await supabase
      .from('teams')
      .select(
        'id, name, batch_id, created_by, created_at, creator:created_by(id, github_username, name, email, role)',
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

  private isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    );
  }

  private async getBatchOrThrow(id: string): Promise<void> {
    const supabase = this.supabaseService.getClient();
    const result = (await supabase
      .from('batches')
      .select('id')
      .eq('id', id)
      .maybeSingle()) as unknown as {
      data: { id: string } | null;
      error: { message: string } | null;
    };

    if (result.error) {
      throw new BadRequestException(result.error.message);
    }

    if (!result.data) {
      throw new NotFoundException('Batch not found.');
    }
  }

  private async assertInternBelongsToTeamBatch(
    userId: string,
    team: TeamRow,
  ): Promise<void> {
    if (!team.batch_id) {
      throw new BadRequestException(
        'Team is not linked to a batch. Please set team batch first.',
      );
    }

    const supabase = this.supabaseService.getClient();
    const internResult = (await supabase
      .from('interns')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()) as unknown as {
      data: InternByUserRow | null;
      error: { message: string } | null;
    };

    if (internResult.error) {
      throw new BadRequestException(internResult.error.message);
    }

    if (!internResult.data) {
      throw new BadRequestException(
        'Selected user does not have an intern record.',
      );
    }

    const enrollmentResult = (await supabase
      .from('batch_interns')
      .select('id')
      .eq('intern_id', internResult.data.id)
      .eq('batch_id', team.batch_id)
      .maybeSingle()) as unknown as {
      data: { id: string } | null;
      error: { message: string } | null;
    };

    if (enrollmentResult.error) {
      throw new BadRequestException(enrollmentResult.error.message);
    }

    if (!enrollmentResult.data) {
      throw new BadRequestException(
        'Intern must be enrolled in the same batch as this team.',
      );
    }
  }

  private async assertCanManageTeam(
    teamId: string,
    actorId: string,
    actorRole: Role,
  ): Promise<TeamRow> {
    if (!this.canManageTeams(actorRole)) {
      throw new ForbiddenException(
        'Only admins and team leads can manage teams.',
      );
    }

    const team = await this.getTeamOrThrow(teamId);
    if (actorRole !== Role.ADMIN && team.created_by !== actorId) {
      throw new ForbiddenException('You can only manage teams you created.');
    }

    return team;
  }
}
