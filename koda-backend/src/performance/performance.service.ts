import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreatePerformanceDto } from './dto/create-performance.dto';

type PerformanceMetricRow = {
  id: string;
  intern_id: string;
  report_id: string | null;
  score: number;
  notes: string | null;
  dimensions: Record<string, number> | null;
  evaluated_at: string | null;
  created_at: string | null;
};

type TeamPerformanceQuery = {
  teamId: string;
  from?: string;
  to?: string;
  bucket?: 'week' | 'month';
};

type TrendPoint = {
  bucketStart: string;
  averageScore: number;
  count: number;
};

@Injectable()
export class PerformanceService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async create(input: CreatePerformanceDto) {
    const payload = await this.buildInsertPayload(input);

    const supabase = this.supabaseService.getClient();
    const result = (await supabase
      .from('performance_metrics')
      .insert(payload)
      .select('*')
      .single()) as unknown as {
      data: PerformanceMetricRow | null;
      error: { message: string } | null;
    };

    if (result.error || !result.data) {
      throw new BadRequestException(
        result.error?.message ?? 'Failed to create evaluation.',
      );
    }

    return this.mapMetric(result.data);
  }

  async findByIntern(internId: string) {
    const supabase = this.supabaseService.getClient();
    const result = (await supabase
      .from('performance_metrics')
      .select('*')
      .eq('intern_id', internId)
      .order('evaluated_at', { ascending: false })
      .order('created_at', { ascending: false })) as unknown as {
      data: PerformanceMetricRow[] | null;
      error: { message: string } | null;
    };

    if (result.error) {
      throw new BadRequestException(result.error.message);
    }

    const metrics = (result.data ?? []).map((row) => this.mapMetric(row));
    const averageScore =
      metrics.length === 0
        ? null
        : metrics.reduce((sum, metric) => sum + metric.score, 0) /
          metrics.length;

    return { internId, averageScore, evaluations: metrics };
  }

  async getTeamPerformance(query: TeamPerformanceQuery) {
    const bucket = query.bucket === 'month' ? 'month' : 'week';
    const from = query.from ? this.parseIsoDateTime(query.from, 'from') : null;
    const to = query.to ? this.parseIsoDateTime(query.to, 'to') : null;

    if (from && to && from > to) {
      throw new BadRequestException('from must be on or before to.');
    }

    const supabase = this.supabaseService.getClient();
    const internIds = await this.getInternIdsByTeam(query.teamId);
    if (internIds.length === 0) {
      return {
        teamId: query.teamId,
        overallAverage: null,
        count: 0,
        trend: [] as TrendPoint[],
      };
    }

    let metricsQuery = supabase
      .from('performance_metrics')
      .select('intern_id, score, evaluated_at, created_at')
      .in('intern_id', internIds);

    if (from) {
      metricsQuery = metricsQuery.gte('evaluated_at', from.toISOString());
    }
    if (to) {
      metricsQuery = metricsQuery.lte('evaluated_at', to.toISOString());
    }

    const { data, error } = await metricsQuery;
    if (error) {
      throw new BadRequestException(error.message);
    }

    const rows = (data ?? []) as Array<{
      intern_id: string;
      score: number;
      evaluated_at: string | null;
      created_at: string | null;
    }>;

    const normalized = rows
      .map((row) => ({
        score: row.score,
        at: this.pickTimestamp(row.evaluated_at, row.created_at),
      }))
      .filter((row): row is { score: number; at: Date } => row.at !== null);

    if (normalized.length === 0) {
      return {
        teamId: query.teamId,
        overallAverage: null,
        count: 0,
        trend: [] as TrendPoint[],
      };
    }

    const overallAverage =
      normalized.reduce((sum, row) => sum + row.score, 0) / normalized.length;

    const buckets = new Map<string, { sum: number; count: number }>();
    for (const row of normalized) {
      const bucketStart = this.getBucketStart(row.at, bucket).toISOString();
      const current = buckets.get(bucketStart) ?? { sum: 0, count: 0 };
      current.sum += row.score;
      current.count += 1;
      buckets.set(bucketStart, current);
    }

    const trend = Array.from(buckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([bucketStart, agg]) => ({
        bucketStart,
        averageScore: agg.sum / agg.count,
        count: agg.count,
      }));

    return {
      teamId: query.teamId,
      overallAverage,
      count: normalized.length,
      trend,
      bucket,
      from: from?.toISOString() ?? null,
      to: to?.toISOString() ?? null,
    };
  }

  private async buildInsertPayload(input: CreatePerformanceDto) {
    const internId = this.normalizeUuid(input.internId, 'internId');
    const score = this.normalizeScore(input.score);
    const reportId = input.reportId
      ? this.normalizeUuid(input.reportId, 'reportId')
      : null;
    const notes = input.notes?.trim() ? input.notes.trim() : null;
    const evaluatedAt = input.evaluatedAt
      ? this.parseIsoDateTime(input.evaluatedAt, 'evaluatedAt').toISOString()
      : new Date().toISOString();

    const dimensions = input.dimensions
      ? this.normalizeDimensions(input.dimensions)
      : null;

    if (reportId) {
      await this.assertReportExists(reportId);
    }

    return {
      intern_id: internId,
      report_id: reportId,
      score,
      notes,
      dimensions,
      evaluated_at: evaluatedAt,
    };
  }

  private mapMetric(row: PerformanceMetricRow) {
    return {
      id: row.id,
      internId: row.intern_id,
      reportId: row.report_id,
      score: row.score,
      notes: row.notes,
      dimensions: row.dimensions,
      evaluatedAt: row.evaluated_at ?? row.created_at,
      createdAt: row.created_at,
    };
  }

  private normalizeUuid(value: unknown, fieldName: string): string {
    if (typeof value !== 'string' || !value.trim()) {
      throw new BadRequestException(`${fieldName} is required.`);
    }

    const trimmed = value.trim();
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(trimmed)) {
      throw new BadRequestException(`${fieldName} must be a valid UUID.`);
    }

    return trimmed;
  }

  private normalizeScore(value: unknown): number {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      throw new BadRequestException('score is required.');
    }

    if (value < 0 || value > 100) {
      throw new BadRequestException('score must be between 0 and 100.');
    }

    return value;
  }

  private normalizeDimensions(
    value: Record<string, number>,
  ): Record<string, number> {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
      throw new BadRequestException('dimensions must be an object.');
    }

    const normalized: Record<string, number> = {};
    for (const [key, rawScore] of Object.entries(value)) {
      const name = key.trim();
      if (!name) {
        throw new BadRequestException(
          'dimensions keys must be non-empty strings.',
        );
      }
      if (typeof rawScore !== 'number' || Number.isNaN(rawScore)) {
        throw new BadRequestException(`dimensions.${name} must be a number.`);
      }
      if (rawScore < 0 || rawScore > 100) {
        throw new BadRequestException(
          `dimensions.${name} must be between 0 and 100.`,
        );
      }
      normalized[name] = rawScore;
    }

    return normalized;
  }

  private parseIsoDateTime(value: string | Date, fieldName: string): Date {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`${fieldName} must be a valid date/time.`);
    }
    return date;
  }

  private pickTimestamp(
    evaluatedAt: string | null,
    createdAt: string | null,
  ): Date | null {
    const value = evaluatedAt ?? createdAt;
    if (!value) {
      return null;
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private getBucketStart(value: Date, bucket: 'week' | 'month'): Date {
    const d = new Date(value);
    if (bucket === 'month') {
      return new Date(
        Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0, 0),
      );
    }

    const day = d.getUTCDay(); // 0 (Sun) - 6 (Sat)
    const diff = (day + 6) % 7; // days since Monday
    const monday = new Date(
      Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0),
    );
    monday.setUTCDate(monday.getUTCDate() - diff);
    return monday;
  }

  private async assertReportExists(reportId: string): Promise<void> {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('reports')
      .select('id')
      .eq('id', reportId)
      .maybeSingle();

    if (error) {
      throw new BadRequestException(error.message);
    }

    if (!data) {
      throw new NotFoundException('reportId does not exist.');
    }
  }

  private async getInternIdsByTeam(teamId: string): Promise<string[]> {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('interns')
      .select('id')
      .eq('team_id', teamId);

    if (error) {
      throw new BadRequestException(error.message);
    }

    return (data ?? []).map((row) => row.id as string);
  }
}
