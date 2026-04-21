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

export const attendanceApi = {
  async findByInternId(internId: string): Promise<AttendanceSummary> {
    return requestJson<AttendanceSummary>(`/attendance/${internId}`);
  },
};
