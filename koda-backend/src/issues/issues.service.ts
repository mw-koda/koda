import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import {
  CreateIssueDto,
  UpdateIssueDto,
  IssueFilterDto,
} from './dto/issues.dto';

export interface Issue {
  id: string;
  github_issue_id: string;
  repo_id: string;
  title: string;
  state: string;
  created_at: string | null;
  updated_at: string | null;
  closed_at: string | null;
  labels: Record<string, unknown>[];
  assignee_name?: string | null;
  assignee_username?: string | null;
  assignee_avatar?: string | null;
  [key: string]: unknown;
}

interface IssueAssignmentRow {
  issues: any | null;
}

@Injectable()
export class IssuesService {
  constructor(private readonly supabase: SupabaseService) {}

  private get client() {
    return this.supabase.getClient();
  }

  private readonly ISSUE_SELECT =
    '*, issue_assignments(interns(users(name, github_username, avatar_url)))';

  private mapIssue(raw: any): Issue {
    const { issue_assignments, ...issue } = raw;
    const assignment = issue_assignments?.[0];
    const intern = assignment?.interns;
    const user = intern?.users;

    return {
      ...issue,
      assignee_name: user?.name || null,
      assignee_username: user?.github_username || null,
      assignee_avatar: user?.avatar_url || null,
    } as Issue;
  }

  async upsertFromWebhook(dto: CreateIssueDto): Promise<Issue> {
    const { data, error } = await this.client
      .from('issues')
      .upsert(dto, { onConflict: 'github_issue_id' })
      .select(this.ISSUE_SELECT)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return this.mapIssue(data);
  }

  async updateByGithubId(
    github_issue_id: string,
    dto: UpdateIssueDto,
  ): Promise<Issue | null> {
    const { data, error } = await this.client
      .from('issues')
      .update(dto)
      .eq('github_issue_id', github_issue_id)
      .select(this.ISSUE_SELECT)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? this.mapIssue(data) : null;
  }

  async findAll(filter: IssueFilterDto = {}): Promise<{
    data: Issue[];
    total: number | null;
    page: number;
    limit: number;
  }> {
    const {
      repo_id,
      state,
      intern_id,
      period_start,
      period_end,
      page = 1,
      limit = 20,
    } = filter;

    let query;

    if (intern_id) {
      // Use the assignment table to find issues for this intern
      query = this.client
        .from('issue_assignments')
        .select(`issues(${this.ISSUE_SELECT})`, { count: 'exact' })
        .eq('intern_id', intern_id)
        .order('assigned_at', { ascending: false });
    } else {
      query = this.client
        .from('issues')
        .select(this.ISSUE_SELECT, { count: 'exact' })
        .order('created_at', { ascending: false });
    }

    // Pagination
    query = query.range((page - 1) * limit, page * limit - 1);

    if (repo_id) {
      const field = intern_id ? 'issues.repo_id' : 'repo_id';
      query = query.eq(field, repo_id);
    }

    if (state) {
      const field = intern_id ? 'issues.state' : 'state';
      query = query.eq(field, state);
    }

    if (period_start) {
      const field = intern_id ? 'issues.created_at' : 'created_at';
      query = query.gte(field, period_start);
    }

    if (period_end) {
      const field = intern_id ? 'issues.created_at' : 'created_at';
      query = query.lte(field, period_end);
    }

    const { data, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    // Flatten nested response if intern_id was used
    const results = intern_id
      ? (data ?? []).flatMap((row: any) => (row.issues ? [row.issues] : []))
      : (data ?? []);

    return {
      data: results.map((i) => this.mapIssue(i)),
      total: count,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<Issue | null> {
    const { data, error } = await this.client
      .from('issues')
      .select(this.ISSUE_SELECT)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? this.mapIssue(data) : null;
  }

  async findByInternId(
    intern_id: string,
    filter: IssueFilterDto = {},
  ): Promise<Issue[]> {
    const { period_start, period_end, state } = filter;

    const { data, error } = await this.client
      .from('issue_assignments')
      .select(`issues(${this.ISSUE_SELECT})`)
      .eq('intern_id', intern_id);

    if (error) {
      throw new Error(error.message);
    }

    const issues: Issue[] = (data ?? []).flatMap((row: any) =>
      row.issues ? [this.mapIssue(row.issues)] : [],
    );

    let filteredIssues = issues;

    if (state) {
      filteredIssues = filteredIssues.filter((i) => i.state === state);
    }

    if (period_start) {
      filteredIssues = filteredIssues.filter(
        (i) => i.created_at && i.created_at >= period_start,
      );
    }

    if (period_end) {
      filteredIssues = filteredIssues.filter(
        (i) => i.created_at && i.created_at <= period_end,
      );
    }

    return filteredIssues;
  }
  async findRecent(limit = 10): Promise<Issue[]> {
    const { data, error } = await this.client
      .from('issues')
      .select(this.ISSUE_SELECT)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error(error.message);
    return (data ?? []).map((i) => this.mapIssue(i));
  }
}
