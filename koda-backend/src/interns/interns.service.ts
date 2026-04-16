import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { IssuesService } from '../issues/issues.service';

@Injectable()
export class InternsService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly issuesService: IssuesService,
  ) {}

  private get db() {
    return this.supabase.getClient();
  }

  // ---------------- CREATE INTERN ----------------
  async create(dto: any) {
    const { data, error } = await this.db.from('interns').insert(dto).select();

    if (error) {
      console.error('🔥 CREATE INTERN ERROR:', error);
      throw error;
    }

    return data?.[0] || null;
  }

  // ---------------- GET ALL (WITH FILTERS) ----------------
  async findAll(filters: any) {
    let query = this.db.from('interns').select('*');

    // Filter by team
    if (filters.teamId) {
      query = query.eq('team_id', filters.teamId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('🔥 FIND ALL INTERNS ERROR:', error);
      throw error;
    }

    let interns = data || [];

    // Filter by batch (via batch_interns join table)
    if (filters.batchId) {
      const { data: batchInterns, error: batchError } = await this.db
        .from('batch_interns')
        .select('intern_id')
        .eq('batch_id', filters.batchId);

      if (batchError) {
        console.error('🔥 BATCH FILTER ERROR:', batchError);
        throw batchError;
      }

      const ids = batchInterns?.map((b) => b.intern_id) || [];
      interns = interns.filter((i) => ids.includes(i.id));
    }

    return interns;
  }

  // ---------------- GET ONE ----------------
  async findOne(id: string) {
    const { data, error } = await this.db
      .from('interns')
      .select('*')
      .eq('id', id);

    if (error) {
      console.error('🔥 FIND INTERN ERROR:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      throw new NotFoundException('Intern not found');
    }

    return data[0];
  }

  // ---------------- UPDATE INTERN ----------------
  async update(id: string, dto: any) {
    const { data, error } = await this.db
      .from('interns')
      .update(dto)
      .eq('id', id)
      .select();

    if (error) {
      console.error('🔥 UPDATE INTERN ERROR:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      throw new NotFoundException('Intern not found or not updated');
    }

    return data[0];
  }

  // ---------------- DELETE INTERN ----------------
  async remove(id: string) {
    const { error } = await this.db.from('interns').delete().eq('id', id);

    if (error) {
      console.error('🔥 DELETE INTERN ERROR:', error);
      throw error;
    }

    return { message: 'Deleted successfully' };
  }

  // ---------------- KODA PROFILE ----------------
  async getProfile(id: string) {
    // Get intern
    const intern = await this.findOne(id);

    // Get reports
    const { data: reports, error } = await this.db
      .from('reports')
      .select('*')
      .eq('intern_id', id)
      .order('period_start', { ascending: false });

    if (error) {
      console.error('🔥 PROFILE REPORTS ERROR:', error);
      throw error;
    }

    // Attach GitHub issues per report period
    const enrichedReports = await Promise.all(
      (reports || []).map(async (report) => {
        const issues = await this.issuesService.findByInternId(id, {
          period_start: report.period_start,
          period_end: report.period_end,
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
