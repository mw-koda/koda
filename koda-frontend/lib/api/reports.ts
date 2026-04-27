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
  async findAll(): Promise<ReportRecord[]> {
    return requestJson<ReportRecord[]>(`/reports`);
  },

  async findByInternId(internId: string): Promise<ReportRecord[]> {
    return requestJson<ReportRecord[]>(`/reports/intern/${internId}`);
  },

  async updateStatus(reportId: string, status: 'draft' | 'submitted' | 'reviewed'): Promise<ReportRecord> {
    return requestJson<ReportRecord>(`/reports/${reportId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
  },

  async submit(data: {
    intern_id: string;
    title: string;
    content: string;
    period_start: string;
    period_end: string;
  }): Promise<ReportRecord> {
    return requestJson<ReportRecord>('/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },
};