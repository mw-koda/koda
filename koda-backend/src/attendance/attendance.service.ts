import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

type AttendanceRow = {
  id: string;
  intern_id: string;
  time_in: string;
  time_out: string | null;
  rendered_hours: number | null;
  created_at: string;
};

type AttendanceFilters = {
  from?: string;
  to?: string;
};

@Injectable()
export class AttendanceService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async timeInForUser(userId: string) {
    const internId = await this.getInternIdByUserId(userId);

    const supabase = this.supabaseService.getClient();
    const openSession = await this.getOpenSession(internId);
    if (openSession) {
      throw new BadRequestException('You are already timed in.');
    }

    const now = new Date().toISOString();
    const result = (await supabase
      .from('attendance')
      .insert({ intern_id: internId, time_in: now })
      .select('*')
      .single()) as unknown as {
      data: AttendanceRow | null;
      error: { message: string } | null;
    };

    if (result.error || !result.data) {
      throw new BadRequestException(
        result.error?.message ?? 'Failed to time in.',
      );
    }

    return this.mapRow(result.data);
  }

  async timeOutForUser(userId: string) {
    const internId = await this.getInternIdByUserId(userId);

    const supabase = this.supabaseService.getClient();
    const openSession = await this.getOpenSession(internId);
    if (!openSession) {
      throw new BadRequestException('You cannot time out without timing in.');
    }

    const timeIn = new Date(openSession.time_in);
    const timeOut = new Date();
    const renderedHours = this.computeRenderedHours(timeIn, timeOut);

    const result = (await supabase
      .from('attendance')
      .update({
        time_out: timeOut.toISOString(),
        rendered_hours: renderedHours,
      })
      .eq('id', openSession.id)
      .select('*')
      .single()) as unknown as {
      data: AttendanceRow | null;
      error: { message: string } | null;
    };

    if (result.error || !result.data) {
      throw new BadRequestException(
        result.error?.message ?? 'Failed to time out.',
      );
    }

    return this.mapRow(result.data);
  }

  async getAttendanceByIntern(internId: string, filters: AttendanceFilters) {
    const supabase = this.supabaseService.getClient();

    let query = supabase
      .from('attendance')
      .select('*')
      .eq('intern_id', internId)
      .order('time_in', { ascending: false });

    if (filters.from) {
      query = query.gte('time_in', new Date(filters.from).toISOString());
    }
    if (filters.to) {
      query = query.lte('time_in', new Date(filters.to).toISOString());
    }

    const result = (await query) as unknown as {
      data: AttendanceRow[] | null;
      error: { message: string } | null;
    };

    if (result.error) {
      throw new BadRequestException(result.error.message);
    }

    const logs = (result.data ?? []).map((row) => this.mapRow(row));
    const totalHours = logs.reduce(
      (sum, log) => sum + (log.renderedHours ?? 0),
      0,
    );

    return {
      internId,
      from: filters.from ?? null,
      to: filters.to ?? null,
      totalHours,
      logs,
    };
  }

  private async getInternIdByUserId(userId: string): Promise<string> {
    const supabase = this.supabaseService.getClient();
    const result = (await supabase
      .from('interns')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()) as unknown as {
      data: { id: string } | null;
      error: { message: string } | null;
    };

    if (result.error) {
      throw new BadRequestException(result.error.message);
    }

    if (!result.data) {
      throw new NotFoundException('Intern profile not found for this user.');
    }

    return result.data.id;
  }

  private async getOpenSession(
    internId: string,
  ): Promise<AttendanceRow | null> {
    const supabase = this.supabaseService.getClient();
    const result = (await supabase
      .from('attendance')
      .select('*')
      .eq('intern_id', internId)
      .is('time_out', null)
      .order('time_in', { ascending: false })
      .maybeSingle()) as unknown as {
      data: AttendanceRow | null;
      error: { message: string } | null;
    };

    if (result.error) {
      throw new BadRequestException(result.error.message);
    }

    return result.data;
  }

  private computeRenderedHours(timeIn: Date, timeOut: Date): number {
    const diffMs = timeOut.getTime() - timeIn.getTime();
    if (diffMs < 0) {
      throw new BadRequestException('timeOut cannot be before timeIn.');
    }

    const hours = diffMs / (1000 * 60 * 60);
    return Math.round(hours * 100) / 100; // 2 decimals
  }

  private mapRow(row: AttendanceRow) {
    return {
      id: row.id,
      internId: row.intern_id,
      timeIn: row.time_in,
      timeOut: row.time_out,
      renderedHours: row.rendered_hours,
      createdAt: row.created_at,
      isOpen: row.time_out === null,
    };
  }
}
