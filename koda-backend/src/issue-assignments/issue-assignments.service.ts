import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { ManualAssignDto } from './dto/issue-assignments.dto';

export interface IssueRow {
  id: string;
}

export interface UserRow {
  id: string;
}

export interface InternRow {
  id: string;
}

export interface IssueAssignment {
  id: string;
  issue_id: string;
  intern_id: string;
  manual: boolean;
  assigned_at: string;
  [key: string]: unknown;
}

export interface IssueAssignmentWithRelations extends IssueAssignment {
  interns?: {
    [key: string]: unknown;
    users?: {
      name: string;
      github_username: string;
    };
  };
}

@Injectable()
export class IssueAssignmentsService {
  constructor(private readonly supabase: SupabaseService) {}

  /**
   * Called by WebhookService when a GitHub issue event has an assignee.
   * Looks up the intern by github_username and creates an auto-assignment.
   */
  async autoLinkFromWebhook(
    issue_id: string,
    github_username: string,
  ): Promise<IssueAssignment | null> {
    const client = this.supabase.getClient();

    const { data: user, error: userErr } = await client
      .from('users')
      .select('id')
      .ilike('github_username', github_username)
      .single<UserRow>();

    if (userErr || !user) return null;

    const { data: intern, error: internErr } = await client
      .from('interns')
      .select('id')
      .eq('user_id', user.id)
      .single<InternRow>();

    if (internErr || !intern) return null;

    const { data, error } = await client
      .from('issue_assignments')
      .upsert(
        {
          issue_id: issue_id,
          intern_id: intern.id,
          manual: false,
          assigned_at: new Date().toISOString(),
        },
        { onConflict: 'issue_id,intern_id' },
      )
      .select()
      .single<IssueAssignment>();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  /**
   * Remove assignment when GitHub unassigns a user from an issue.
   */
  async removeAssignmentByUsername(
    github_issue_id: string,
    github_username: string,
  ): Promise<{ removed: boolean } | null> {
    const client = this.supabase.getClient();
    const { data: issue } = await client
      .from('issues')
      .select('id')
      .eq('github_issue_id', github_issue_id)
      .single<IssueRow>();

    if (!issue) return null;

    const { data: user } = await client
      .from('users')
      .select('id')
      .eq('github_username', github_username)
      .single<UserRow>();

    if (!user) return null;

    const { data: intern } = await client
      .from('interns')
      .select('id')
      .eq('user_id', user.id)
      .single<InternRow>();

    if (!intern) return null;

    const { error } = await client
      .from('issue_assignments')
      .delete()
      .eq('issue_id', issue.id)
      .eq('intern_id', intern.id);

    if (error) {
      throw new Error(error.message);
    }

    return { removed: true };
  }

  /**
   * Coordinator manually assigns an issue to an intern.
   */
  async manualAssign(
    issue_id: string,
    dto: ManualAssignDto,
  ): Promise<IssueAssignment> {
    const client = this.supabase.getClient();
    const { data, error } = await client
      .from('issue_assignments')
      .upsert(
        {
          issue_id,
          intern_id: dto.intern_id,
          manual: true,
          assigned_at: new Date().toISOString(),
        },
        { onConflict: 'issue_id,intern_id' },
      )
      .select()
      .single<IssueAssignment>();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  /**
   * Remove a specific assignment row by its id.
   */
  async removeAssignment(assignment_id: string): Promise<{ removed: boolean }> {
    const client = this.supabase.getClient();
    const { error } = await client
      .from('issue_assignments')
      .delete()
      .eq('id', assignment_id);

    if (error) {
      throw new Error(error.message);
    }

    return { removed: true };
  }

  async findByIssueId(
    issue_id: string,
  ): Promise<IssueAssignmentWithRelations[]> {
    const client = this.supabase.getClient();
    const { data, error } = await client
      .from('issue_assignments')
      .select('*, interns(*, users(name, github_username))')
      .eq('issue_id', issue_id)
      .returns<IssueAssignmentWithRelations[]>();

    if (error) {
      throw new Error(error.message);
    }

    return data ?? [];
  }
}
