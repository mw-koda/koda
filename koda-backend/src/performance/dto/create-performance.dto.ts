export class CreatePerformanceDto {
  internId!: string;
  score!: number;
  reportId?: string;
  notes?: string;
  evaluatedAt?: string | Date;
  dimensions?: Record<string, number>;
}
