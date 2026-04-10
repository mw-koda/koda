import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class ReportsService {
  constructor(private readonly supabase: SupabaseService) {}

  private get db() {
    return this.supabase.getClient();
  }

  // ---------------- SUBMIT REPORT ----------------
  async submit(dto: any) {
    // Validate unique period per intern
    const { data: existing, error: checkError } = await this.db
      .from('reports')
      .select('*')
      .eq('intern_id', dto.intern_id)
      .eq('period_start', dto.period_start)
      .eq('period_end', dto.period_end);

    if (checkError) {
      console.error('🔥 REPORT CHECK ERROR:', checkError);
      throw checkError;
    }

    if (existing && existing.length > 0) {
      throw new BadRequestException(
        'Report already exists for this period',
      );
    }

    // Insert with default status
    const { data, error } = await this.db
      .from('reports')
      .insert({
        ...dto,
        status: 'submitted',
      })
      .select();

    if (error) {
      console.error('🔥 SUBMIT REPORT ERROR:', error);
      throw error;
    }

    return data?.[0] || null;
  }

  // ---------------- GET REPORTS BY INTERN ----------------
  async findByIntern(internId: string, filters: any) {
    let query = this.db
      .from('reports')
      .select('*')
      .eq('intern_id', internId);

    // Optional period filters
    if (filters.periodStart) {
      query = query.gte('period_start', filters.periodStart);
    }

    if (filters.periodEnd) {
      query = query.lte('period_end', filters.periodEnd);
    }

    const { data, error } = await query;

    if (error) {
      console.error('🔥 FIND REPORTS ERROR:', error);
      throw error;
    }

    return data || [];
  }

  // ---------------- GET SINGLE REPORT ----------------
  async findOne(id: string) {
    const { data, error } = await this.db
      .from('reports')
      .select('*')
      .eq('id', id);

    if (error) {
      console.error('🔥 FIND REPORT ERROR:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      throw new NotFoundException('Report not found');
    }

    return data[0];
  }

  // ---------------- UPDATE STATUS ----------------
  async updateStatus(id: string, status: string) {
    const transitions = {
      draft: ['submitted'],
      submitted: ['reviewed'],
      reviewed: [],
    };

    const current = await this.findOne(id);

    if (!transitions[current.status]?.includes(status)) {
      throw new BadRequestException(
        `Invalid transition from ${current.status} to ${status}`,
      );
    }

    const { data, error } = await this.db
      .from('reports')
      .update({ status })
      .eq('id', id)
      .select();

    if (error) {
      console.error('🔥 UPDATE STATUS ERROR:', error);
      throw error;
    }

    return data?.[0] || null;
  }
}