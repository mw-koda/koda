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

  private isEodSubmission(dto: any): boolean {
    const title = String(dto?.title ?? '').trim().toLowerCase();
    return title.startsWith('eod report');
  }

  private getDateKey(value: string): string {
    const match = value.match(/\d{4}-\d{2}-\d{2}/);
    if (match) {
      return match[0];
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException('Invalid EOD date.');
    }

    return parsed.toISOString().slice(0, 10);
  }

  private async ensureUniqueEodForDay(dto: any): Promise<void> {
    if (!this.isEodSubmission(dto)) {
      return;
    }

    if (!dto?.period_start) {
      throw new BadRequestException('EOD report date is required.');
    }

    const dateKey = this.getDateKey(String(dto.period_start));
    const dayStart = new Date(`${dateKey}T00:00:00.000Z`);
    const nextDay = new Date(dayStart);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);

    const { data, error } = await this.db
      .from('reports')
      .select('id')
      .eq('intern_id', dto.intern_id)
      .ilike('title', 'EOD Report%')
      .gte('period_start', dayStart.toISOString())
      .lt('period_start', nextDay.toISOString())
      .limit(1);

    if (error) {
      console.error('🔥 EOD DUPLICATE CHECK ERROR:', error);
      throw error;
    }

    if (data && data.length > 0) {
      throw new BadRequestException(
        'You already submitted an EOD report for this date.',
      );
    }
  }

  // ---------------- SUBMIT REPORT ----------------
  async submit(dto: any) {
    await this.ensureUniqueEodForDay(dto);

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
      throw new BadRequestException('Report already exists for this period');
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
    let query = this.db.from('reports').select('*').eq('intern_id', internId);

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
