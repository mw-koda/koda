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
  state: string;
  created_at: string | null;
  [key: string]: unknown;
}

interface IssueAssignmentRow {
  issues: Issue[] | null;
}

@Injectable()
export class IssuesService {
  constructor(private readonly supabase: SupabaseService) {}

  private get client() {
    return this.supabase.getClient();
  }

  async upsertFromWebhook(dto: CreateIssueDto): Promise<Issue> {
    const { data, error } = await this.client
      .from('issues')
      .upsert(dto, { onConflict: 'github_issue_id' })
      .select()
      .single<Issue>();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async updateByGithubId(
    github_issue_id: string,
    dto: UpdateIssueDto,
  ): Promise<Issue> {
    const { data, error } = await this.client
      .from('issues')
      .update(dto)
      .eq('github_issue_id', github_issue_id)
      .select()
      .single<Issue>();

    if (error) {
      throw new Error(error.message);
    }

    return data;
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
      period_start,
      period_end,
      page = 1,
      limit = 20,
    } = filter;

    let query = this.client
      .from('issues')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (repo_id) {
      query = query.eq('repo_id', repo_id);
    }

    if (state) {
      query = query.eq('state', state);
    }

    if (period_start) {
      query = query.gte('created_at', period_start);
    }

    if (period_end) {
      query = query.lte('created_at', period_end);
    }

    const { data, error, count } = await query.returns<Issue[]>();

    if (error) {
      throw new Error(error.message);
    }

    return {
      data: data ?? [],
      total: count,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<Issue | null> {
    const { data, error } = await this.client
      .from('issues')
      .select('*')
      .eq('id', id)
      .single<Issue>();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async findByInternId(
    intern_id: string,
    filter: IssueFilterDto = {},
  ): Promise<Issue[]> {
    const { period_start, period_end, state } = filter;

    const { data, error } = await this.client
      .from('issue_assignments')
      .select('issues(*)')
      .eq('intern_id', intern_id)
      .returns<IssueAssignmentRow[]>();

    if (error) {
      throw new Error(error.message);
    }

    const issues: Issue[] = (data ?? []).flatMap((row) => row.issues ?? []);

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
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(limit)
      .returns<Issue[]>();

    if (error) throw new Error(error.message);
    return data ?? [];
  }
}
