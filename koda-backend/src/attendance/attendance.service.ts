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

type TeamRow = {
  id: string;
  name: string;
};

type BatchInternRow = {
  intern_id: string;
};

type InternRow = {
  id: string;
  user_id: string;
  team_id: string | null;
};

type UserRow = {
  id: string;
  name: string | null;
  github_username: string | null;
};

type TeamMemberRow = {
  user_id: string;
  team_id: string;
  role: string;
};

@Injectable()
export class AttendanceService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getLiveAttendanceByBatch(batchId: string, date?: string) {
    const { startIso, endIso, dateLabel } = this.getDayRange(date);
    const supabase = this.supabaseService.getClient();

    const batchInternsResult = (await supabase
      .from('batch_interns')
      .select('intern_id')
      .eq('batch_id', batchId)) as unknown as {
      data: BatchInternRow[] | null;
      error: { message: string } | null;
    };

    if (batchInternsResult.error) {
      throw new BadRequestException(batchInternsResult.error.message);
    }

    const internIds = (batchInternsResult.data ?? []).map(
      (row) => row.intern_id,
    );

    if (internIds.length === 0) {
      return {
        batchId,
        date: dateLabel,
        rows: [],
      };
    }

    const internsResult = (await supabase
      .from('interns')
      .select('id,user_id,team_id')
      .in('id', internIds)) as unknown as {
      data: InternRow[] | null;
      error: { message: string } | null;
    };

    if (internsResult.error) {
      throw new BadRequestException(internsResult.error.message);
    }

    const interns = internsResult.data ?? [];
    if (interns.length === 0) {
      return {
        batchId,
        date: dateLabel,
        rows: [],
      };
    }

    const teamIds = Array.from(
      new Set(interns.map((intern) => intern.team_id).filter(Boolean)),
    ) as string[];

    let teamNameById = new Map<string, string>();
    if (teamIds.length > 0) {
      const teamsResult = (await supabase
        .from('teams')
        .select('id,name')
        .in('id', teamIds)) as unknown as {
        data: TeamRow[] | null;
        error: { message: string } | null;
      };

      if (teamsResult.error) {
        throw new BadRequestException(teamsResult.error.message);
      }

      teamNameById = new Map(
        (teamsResult.data ?? []).map((team) => [team.id, team.name]),
      );
    }

    const userIds = Array.from(
      new Set(interns.map((intern) => intern.user_id).filter(Boolean)),
    );

    const usersResult = (await supabase
      .from('users')
      .select('id,name,github_username')
      .in('id', userIds)) as unknown as {
      data: UserRow[] | null;
      error: { message: string } | null;
    };

    if (usersResult.error) {
      throw new BadRequestException(usersResult.error.message);
    }

    const usersById = new Map<string, UserRow>(
      (usersResult.data ?? []).map((user) => [user.id, user]),
    );

    const teamMembersResult = (await supabase
      .from('team_members')
      .select('user_id,team_id,role')
      .in('user_id', userIds)
      .eq('role', 'intern')) as unknown as {
      data: TeamMemberRow[] | null;
      error: { message: string } | null;
    };

    if (teamMembersResult.error) {
      throw new BadRequestException(teamMembersResult.error.message);
    }

    const teamIdByUserId = new Map<string, string>();
    for (const member of teamMembersResult.data ?? []) {
      if (!teamIdByUserId.has(member.user_id)) {
        teamIdByUserId.set(member.user_id, member.team_id);
      }
    }

    const memberTeamIds = Array.from(
      new Set((teamMembersResult.data ?? []).map((member) => member.team_id)),
    );

    const allTeamIds = Array.from(new Set([...teamIds, ...memberTeamIds]));

    if (allTeamIds.length > 0 && allTeamIds.length !== teamIds.length) {
      const allTeamsResult = (await supabase
        .from('teams')
        .select('id,name')
        .in('id', allTeamIds)) as unknown as {
        data: TeamRow[] | null;
        error: { message: string } | null;
      };

      if (allTeamsResult.error) {
        throw new BadRequestException(allTeamsResult.error.message);
      }

      teamNameById = new Map(
        (allTeamsResult.data ?? []).map((team) => [team.id, team.name]),
      );
    }

    const activeInternIds = interns.map((intern) => intern.id);
    const attendanceResult = (await supabase
      .from('attendance')
      .select('*')
      .in('intern_id', activeInternIds)
      .gte('time_in', startIso)
      .lt('time_in', endIso)
      .order('time_in', { ascending: false })) as unknown as {
      data: AttendanceRow[] | null;
      error: { message: string } | null;
    };

    if (attendanceResult.error) {
      throw new BadRequestException(attendanceResult.error.message);
    }

    const latestByInternId = new Map<string, AttendanceRow>();
    for (const row of attendanceResult.data ?? []) {
      if (!latestByInternId.has(row.intern_id)) {
        latestByInternId.set(row.intern_id, row);
      }
    }

    const rows = interns
      .map((intern) => {
        const user = usersById.get(intern.user_id);
        const attendance = latestByInternId.get(intern.id);

        return {
          internId: intern.id,
          userId: intern.user_id,
          internName:
            user?.name?.trim() ||
            user?.github_username?.trim() ||
            'Unknown Intern',
          team:
            (teamIdByUserId.get(intern.user_id) ?? intern.team_id)
              ? (teamNameById.get(
                  teamIdByUserId.get(intern.user_id) ?? intern.team_id ?? '',
                ) ?? 'Unassigned')
              : 'Unassigned',
          clockIn: attendance?.time_in ?? null,
          clockOut: attendance?.time_out ?? null,
          status: attendance?.time_in ? 'present' : 'pending',
        };
      })
      .sort((a, b) => a.internName.localeCompare(b.internName));

    return {
      batchId,
      date: dateLabel,
      rows,
    };
  }

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

  private getDayRange(date?: string): {
    startIso: string;
    endIso: string;
    dateLabel: string;
  } {
    let baseDate: Date;

    if (date) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        throw new BadRequestException('date must be formatted as YYYY-MM-DD.');
      }

      baseDate = new Date(`${date}T00:00:00.000Z`);
      if (Number.isNaN(baseDate.getTime())) {
        throw new BadRequestException('date must be a valid calendar date.');
      }
    } else {
      const now = new Date();
      baseDate = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
      );
    }

    const start = new Date(
      Date.UTC(
        baseDate.getUTCFullYear(),
        baseDate.getUTCMonth(),
        baseDate.getUTCDate(),
      ),
    );
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);

    return {
      startIso: start.toISOString(),
      endIso: end.toISOString(),
      dateLabel: start.toISOString().slice(0, 10),
    };
  }
}
