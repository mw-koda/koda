import { requestJson } from '@/lib/api/client';

export interface ReportRecord {
  id: string;
  intern_id: string;
  title: string | null;
  content: string | null;
  period_start: string | null;
  period_end: string | null;
  submitted_at: string | null;
  status: 'draft' | 'submitted' | 'reviewed' | string;
}

export const reportsApi = {
  async findByInternId(internId: string): Promise<ReportRecord[]> {
    return requestJson<ReportRecord[]>(`/reports/intern/${internId}`);
  },
};