import { requestJson } from '@/lib/api/client';

export type AttendanceLog = {
  id: string;
  internId: string;
  timeIn: string;
  timeOut: string | null;
  renderedHours: number | null;
  createdAt: string;
  isOpen: boolean;
};

export type AttendanceSummary = {
  internId: string;
  from: string | null;
  to: string | null;
  totalHours: number;
  logs: AttendanceLog[];
};

export type LiveAttendanceStatus = 'pending' | 'present';

export type LiveAttendanceRow = {
  internId: string;
  userId: string;
  internName: string;
  team: string;
  clockIn: string | null;
  clockOut: string | null;
  status: LiveAttendanceStatus;
};

export type LiveAttendanceResponse = {
  batchId: string;
  date: string;
  rows: LiveAttendanceRow[];
};

export const attendanceApi = {
  async findByInternId(internId: string): Promise<AttendanceSummary> {
    return requestJson<AttendanceSummary>(`/attendance/${internId}`);
  },

  async findLiveByBatch(batchId: string, date?: string): Promise<LiveAttendanceResponse> {
    const params = new URLSearchParams({ batchId });
    if (date) {
      params.set('date', date);
    }

    return requestJson<LiveAttendanceResponse>(`/attendance/live?${params.toString()}`);
  },

  async timeIn(): Promise<AttendanceLog> {
    return requestJson<AttendanceLog>('/attendance/time-in', {
      method: 'POST',
    });
  },

  async timeOut(): Promise<AttendanceLog> {
    return requestJson<AttendanceLog>('/attendance/time-out', {
      method: 'POST',
    });
  },
};
