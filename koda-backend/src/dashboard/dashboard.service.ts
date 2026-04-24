import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import {
  ActivityDto,
  DashboardStatsDto,
  GetDashboardQueryDto,
  PerformanceTrendDto,
} from './dto';

type ReportRow = {
  id: string;
  intern_id: string;
  status: string;
  submitted_at: string | null;
};

type IssueRow = {
  id: string;
  title: string | null;
  state: string;
  created_at: string | null;
  closed_at: string | null;
};

type PerformanceRow = {
  id: string;
  intern_id: string;
  score: number;
  evaluated_at: string | null;
};

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async getStats(query: GetDashboardQueryDto): Promise<DashboardStatsDto> {
    const teamId = query.teamId;
    const internIds = teamId ? await this.getInternIdsByTeam(teamId) : null;

    const totalInterns = teamId
      ? (internIds?.length ?? 0)
      : await this.getTotalInternCount();

    const pendingReports = await this.getPendingReportsCount(internIds);
    const openIssues = await this.getOpenIssuesCount(internIds);
    const averageScore = await this.getAverageScore(internIds);

    return {
      totalInterns,
      pendingReports,
      openIssues,
      averageScore,
    };
  }

  async getPerformanceTrend(
    query: GetDashboardQueryDto,
  ): Promise<PerformanceTrendDto[]> {
    const teamId = query.teamId;
    const internIds = teamId ? await this.getInternIdsByTeam(teamId) : null;

    if (internIds && internIds.length === 0) {
      return [];
    }

    const supabase = this.supabaseService.getClient();
    let trendQuery = supabase
      .from('performance_metrics')
      .select('score, evaluated_at, intern_id')
      .order('evaluated_at', { ascending: true });

    if (internIds) {
      trendQuery = trendQuery.in('intern_id', internIds);
    }

    const { data, error } = await trendQuery;

    if (error) {
      this.handleSupabaseError('Failed to fetch performance trend', error);
    }

    // Group scores by ISO week so trend points remain consistent across years.
    const weeklyAggregates = new Map<string, { sum: number; count: number }>();

    for (const row of (data ?? []) as PerformanceRow[]) {
      if (typeof row.score !== 'number' || !row.evaluated_at) {
        continue;
      }

      const week = this.getIsoWeekKey(row.evaluated_at);
      if (!week) {
        continue;
      }

      const aggregate = weeklyAggregates.get(week) ?? { sum: 0, count: 0 };
      aggregate.sum += row.score;
      aggregate.count += 1;
      weeklyAggregates.set(week, aggregate);
    }

    return Array.from(weeklyAggregates.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, aggregate]) => ({
        week,
        averageScore: aggregate.sum / aggregate.count,
      }));
  }

  async getActivity(query: GetDashboardQueryDto): Promise<ActivityDto[]> {
    const teamId = query.teamId;
    const internIds = teamId ? await this.getInternIdsByTeam(teamId) : null;

    if (internIds && internIds.length === 0) {
      return [];
    }

    const [reportActivities, issueActivities, evaluationActivities] =
      await Promise.all([
        this.getReportActivities(internIds, teamId ?? null),
        this.getIssueActivities(internIds, teamId ?? null),
        this.getEvaluationActivities(internIds, teamId ?? null),
      ]);

    // Merge heterogeneous sources, then sort once for a global latest-first feed.
    return [...reportActivities, ...issueActivities, ...evaluationActivities]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 20);
  }

  private async getTotalInternCount(): Promise<number> {
    const supabase = this.supabaseService.getClient();
    const { count, error } = await supabase
      .from('interns')
      .select('id', { count: 'exact', head: true });

    if (error) {
      this.handleSupabaseError('Failed to count interns', error);
    }

    return count ?? 0;
  }

  private async getPendingReportsCount(
    internIds: string[] | null,
  ): Promise<number> {
    if (internIds && internIds.length === 0) {
      return 0;
    }

    const supabase = this.supabaseService.getClient();
    let reportCountQuery = supabase
      .from('reports')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'submitted');

    if (internIds) {
      reportCountQuery = reportCountQuery.in('intern_id', internIds);
    }

    const { count, error } = await reportCountQuery;

    if (error) {
      this.handleSupabaseError('Failed to count pending reports', error);
    }

    return count ?? 0;
  }

  private async getOpenIssuesCount(
    internIds: string[] | null,
  ): Promise<number> {
    const supabase = this.supabaseService.getClient();

    if (!internIds) {
      const { count, error } = await supabase
        .from('issues')
        .select('id', { count: 'exact', head: true })
        .eq('state', 'open');

      if (error) {
        this.handleSupabaseError('Failed to count open issues', error);
      }

      return count ?? 0;
    }

    if (internIds.length === 0) {
      return 0;
    }

    const { data, error } = await supabase
      .from('issue_assignments')
      .select('issue_id, issues!inner(state)')
      .in('intern_id', internIds)
      .eq('issues.state', 'open');

    if (error) {
      this.handleSupabaseError('Failed to count team open issues', error);
    }

    return new Set((data ?? []).map((row) => row.issue_id as string)).size;
  }

  private async getAverageScore(internIds: string[] | null): Promise<number> {
    if (internIds && internIds.length === 0) {
      return 0;
    }

    const supabase = this.supabaseService.getClient();
    let scoreQuery = supabase
      .from('performance_metrics')
      .select('score, intern_id');

    if (internIds) {
      scoreQuery = scoreQuery.in('intern_id', internIds);
    }

    const { data, error } = await scoreQuery;

    if (error) {
      this.handleSupabaseError('Failed to calculate average score', error);
    }

    const scores = (data ?? [])
      .map((row) => row.score as number)
      .filter((score) => typeof score === 'number' && Number.isFinite(score));

    if (scores.length === 0) {
      return 0;
    }

    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  private async getInternIdsByTeam(teamId: string): Promise<string[]> {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('interns')
      .select('id')
      .eq('team_id', teamId);

    if (error) {
      this.handleSupabaseError('Failed to resolve team interns', error);
    }

    return (data ?? []).map((row) => row.id as string);
  }

  private async getReportActivities(
    internIds: string[] | null,
    teamId: string | null,
  ): Promise<ActivityDto[]> {
    if (internIds && internIds.length === 0) {
      return [];
    }

    const supabase = this.supabaseService.getClient();
    let reportsQuery = supabase
      .from('reports')
      .select('id, intern_id, status, submitted_at')
      .eq('status', 'submitted')
      .order('submitted_at', { ascending: false })
      .limit(40);

    if (internIds) {
      reportsQuery = reportsQuery.in('intern_id', internIds);
    }

    const { data, error } = await reportsQuery;

    if (error) {
      this.handleSupabaseError('Failed to fetch report activity', error);
    }

    return ((data ?? []) as ReportRow[])
      .filter((row) => !!row.submitted_at)
      .map((row) => ({
        type: 'report_submitted',
        description: `Report ${row.id} submitted`,
        date: row.submitted_at as string,
        internId: row.intern_id,
        teamId,
      }));
  }

  private async getIssueActivities(
    internIds: string[] | null,
    teamId: string | null,
  ): Promise<ActivityDto[]> {
    const supabase = this.supabaseService.getClient();

    if (!internIds) {
      const { data, error } = await supabase
        .from('issues')
        .select('id, title, state, created_at, closed_at')
        .order('created_at', { ascending: false })
        .limit(40);

      if (error) {
        this.handleSupabaseError('Failed to fetch issue activity', error);
      }

      return this.mapIssueRowsToActivities((data ?? []) as IssueRow[], null);
    }

    if (internIds.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from('issue_assignments')
      .select(
        'intern_id, issue_id, issues!inner(id, title, state, created_at, closed_at)',
      )
      .in('intern_id', internIds)
      .order('assigned_at', { ascending: false })
      .limit(80);

    if (error) {
      this.handleSupabaseError('Failed to fetch team issue activity', error);
    }

    const issueById = new Map<
      string,
      { issue: IssueRow; internId: string | null }
    >();

    for (const row of data ?? []) {
      const issue = row.issues as unknown as IssueRow | null;
      const issueId = (row.issue_id as string) || issue?.id;

      if (!issue || !issueId) {
        continue;
      }

      if (!issueById.has(issueId)) {
        issueById.set(issueId, {
          issue,
          internId: (row.intern_id as string) ?? null,
        });
      }
    }

    const teamIssueActivities: ActivityDto[] = [];
    for (const { issue, internId } of issueById.values()) {
      const mapped = this.mapSingleIssueToActivities(issue, internId, teamId);
      teamIssueActivities.push(...mapped);
    }

    return teamIssueActivities;
  }

  private async getEvaluationActivities(
    internIds: string[] | null,
    teamId: string | null,
  ): Promise<ActivityDto[]> {
    if (internIds && internIds.length === 0) {
      return [];
    }

    const supabase = this.supabaseService.getClient();
    let evaluationsQuery = supabase
      .from('performance_metrics')
      .select('id, intern_id, score, evaluated_at')
      .order('evaluated_at', { ascending: false })
      .limit(40);

    if (internIds) {
      evaluationsQuery = evaluationsQuery.in('intern_id', internIds);
    }

    const { data, error } = await evaluationsQuery;

    if (error) {
      this.handleSupabaseError('Failed to fetch evaluation activity', error);
    }

    return ((data ?? []) as PerformanceRow[])
      .filter((row) => !!row.evaluated_at)
      .map((row) => ({
        type: 'evaluation_added',
        description: `Evaluation added with score ${row.score}`,
        date: row.evaluated_at as string,
        internId: row.intern_id,
        teamId,
      }));
  }

  private mapIssueRowsToActivities(
    rows: IssueRow[],
    teamId: string | null,
  ): ActivityDto[] {
    const activities: ActivityDto[] = [];

    for (const issue of rows) {
      activities.push(...this.mapSingleIssueToActivities(issue, null, teamId));
    }

    return activities;
  }

  private mapSingleIssueToActivities(
    issue: IssueRow,
    internId: string | null,
    teamId: string | null,
  ): ActivityDto[] {
    const activities: ActivityDto[] = [];
    const issueLabel = issue.title?.trim() ? issue.title.trim() : issue.id;

    if (issue.created_at) {
      activities.push({
        type: 'issue_opened',
        description: `Issue opened: ${issueLabel}`,
        date: issue.created_at,
        internId,
        teamId,
      });
    }

    if (issue.state === 'closed' && issue.closed_at) {
      activities.push({
        type: 'issue_closed',
        description: `Issue closed: ${issueLabel}`,
        date: issue.closed_at,
        internId,
        teamId,
      });
    }

    return activities;
  }

  private getIsoWeekKey(value: string): string | null {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return null;
    }

    // ISO week logic: shift to Thursday to determine ISO year, then compute week index.
    const workingDate = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );
    const dayOfWeek = workingDate.getUTCDay() || 7;
    workingDate.setUTCDate(workingDate.getUTCDate() + 4 - dayOfWeek);

    const isoYear = workingDate.getUTCFullYear();
    const yearStart = new Date(Date.UTC(isoYear, 0, 1));
    const daysSinceYearStart = Math.floor(
      (workingDate.getTime() - yearStart.getTime()) / 86_400_000,
    );
    const isoWeek = Math.ceil((daysSinceYearStart + 1) / 7);

    return `${isoYear}-W${String(isoWeek).padStart(2, '0')}`;
  }

  private handleSupabaseError(
    context: string,
    error: { message?: string },
  ): never {
    this.logger.error(context, error.message ?? 'Unknown Supabase error');
    throw new InternalServerErrorException(context);
  }
}
