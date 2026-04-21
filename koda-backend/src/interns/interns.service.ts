import { Injectable, NotFoundException } from '@nestjs/common';
import type { CreateInternDto } from './dto/create-intern.dto';
import type { UpdateInternDto } from './dto/update-intern.dto';
import { SupabaseService } from '../supabase/supabase.service';
import { IssuesService, type Issue } from '../issues/issues.service';

type InternRow = {
  id: string;
  user_id: string;
  team_id: string | null;
  created_at: string | null;
};

type InternUserRow = {
  id: string;
  github_username: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
};

type InternReportSummaryRow = {
  id: string;
  title: string | null;
  period_start: string | null;
  period_end: string | null;
  submitted_at: string | null;
  status: string | null;
};

type InternIssueAssignmentSummaryRow = {
  id: string;
};

export type InternListRow = InternRow & {
  user: InternUserRow | null;
  reports: InternReportSummaryRow[];
  issue_assignments: InternIssueAssignmentSummaryRow[];
};

type BatchInternRow = {
  intern_id: string;
};

type ReportRow = {
  period_start: string | null;
  period_end: string | null;
};

export type InternFilters = {
  teamId?: string;
  batchId?: string;
};

@Injectable()
export class InternsService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly issuesService: IssuesService,
  ) {}

  private get db() {
    return this.supabase.getClient();
  }

  async create(dto: CreateInternDto): Promise<InternRow | null> {
    const { data, error } = (await this.db
      .from('interns')
      .insert(dto)
      .select()) as {
      data: InternRow[] | null;
      error: Error | null;
    };

    if (error) {
      console.error('🔥 CREATE INTERN ERROR:', error);
      throw error;
    }

    return data?.[0] ?? null;
  }

  async findAll(filters: InternFilters): Promise<InternListRow[]> {
    let query = this.db.from('interns').select(`
      id,
      user_id,
      team_id,
      created_at,
      user:users!interns_user_id_fkey(
        id,
        github_username,
        name,
        email,
        avatar_url
      ),
      reports(
        id,
        title,
        period_start,
        period_end,
        submitted_at,
        status
      ),
      issue_assignments(
        id
      )
    `);

    if (filters.teamId) {
      query = query.eq('team_id', filters.teamId);
    }

    const { data, error } = (await query) as {
      data: InternListRow[] | null;
      error: Error | null;
    };

    if (error) {
      console.error('🔥 FIND ALL INTERNS ERROR:', error);
      throw error;
    }

    let interns: InternListRow[] = data ?? [];

    if (filters.batchId) {
      const { data: batchInterns, error: batchError } = (await this.db
        .from('batch_interns')
        .select('intern_id')
        .eq('batch_id', filters.batchId)) as {
        data: BatchInternRow[] | null;
        error: Error | null;
      };

      if (batchError) {
        console.error('🔥 BATCH FILTER ERROR:', batchError);
        throw batchError;
      }

      const ids =
        batchInterns?.map((batchIntern) => batchIntern.intern_id) ?? [];
      interns = interns.filter((intern) => ids.includes(intern.id));
    }

    return interns;
  }

  async findOne(id: string): Promise<InternRow> {
    const { data, error } = (await this.db
      .from('interns')
      .select('*')
      .eq('id', id)) as {
      data: InternRow[] | null;
      error: Error | null;
    };

    if (error) {
      console.error('🔥 FIND INTERN ERROR:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      throw new NotFoundException('Intern not found');
    }

    return data[0];
  }

  async update(id: string, dto: UpdateInternDto): Promise<InternRow> {
    const { data, error } = (await this.db
      .from('interns')
      .update(dto)
      .eq('id', id)
      .select()) as {
      data: InternRow[] | null;
      error: Error | null;
    };

    if (error) {
      console.error('🔥 UPDATE INTERN ERROR:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      throw new NotFoundException('Intern not found or not updated');
    }

    return data[0];
  }

  async remove(id: string): Promise<{ message: string }> {
    const { error } = await this.db.from('interns').delete().eq('id', id);

    if (error) {
      console.error('🔥 DELETE INTERN ERROR:', error);
      throw error;
    }

    return { message: 'Deleted successfully' };
  }

  async getProfile(id: string): Promise<{
    intern: InternRow;
    reports: Array<ReportRow & { issues: Issue[] }>;
  }> {
    const intern = await this.findOne(id);

    const { data: reports, error } = (await this.db
      .from('reports')
      .select('*')
      .eq('intern_id', id)
      .order('period_start', { ascending: false })) as {
      data: ReportRow[] | null;
      error: Error | null;
    };

    if (error) {
      console.error('🔥 PROFILE REPORTS ERROR:', error);
      throw error;
    }

    const enrichedReports = await Promise.all(
      (reports || []).map(async (report) => {
        const issues = await this.issuesService.findByInternId(id, {
          period_start: report.period_start ?? undefined,
          period_end: report.period_end ?? undefined,
        });

        return {
          ...report,
          issues,
        };
      }),
    );

    return {
      intern,
      reports: enrichedReports,
    };
  }
}
