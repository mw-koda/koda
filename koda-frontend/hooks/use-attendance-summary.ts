import { useEffect, useState } from 'react';
import { attendanceApi, type AttendanceSummary } from '@/lib/api/attendance';

export function useAttendanceSummary(internIds: string[]) {
  const [attendanceByInternId, setAttendanceByInternId] = useState<
    Record<string, AttendanceSummary>
  >({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadAttendance() {
      if (internIds.length === 0) {
        setAttendanceByInternId({});
        setError(null);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const results = await Promise.all(
          internIds.map(async (internId) => {
            try {
              const summary = await attendanceApi.findByInternId(internId);
              return [internId, summary] as const;
            } catch {
              return [internId, null] as const;
            }
          }),
        );

        if (!isActive) {
          return;
        }

        const nextMap: Record<string, AttendanceSummary> = {};
        for (const [internId, summary] of results) {
          if (summary) {
            nextMap[internId] = summary;
          }
        }

        setAttendanceByInternId(nextMap);
      } catch (err) {
        if (!isActive) {
          return;
        }

        setError(
          err instanceof Error ? err : new Error('Failed to load attendance.'),
        );
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadAttendance();

    return () => {
      isActive = false;
    };
  }, [internIds]);

  return { attendanceByInternId, isLoading, error };
}
