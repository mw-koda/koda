'use client';

import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getAttendanceLogsByDate, interns } from '@/lib/mock-data';

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

type AttendanceStatus = 'pending' | 'present' | 'absent';

export default function TeamLeadAttendancePage() {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(
    today.toISOString().slice(0, 10)
  );
  const [statusById, setStatusById] = useState<Record<string, AttendanceStatus>>({});
  const [noteById, setNoteById] = useState<Record<string, string>>({});

  const rows = useMemo(() => {
    const logsByIntern = new Map(
      getAttendanceLogsByDate(selectedDate).map((log) => [log.internId, log])
    );

    return interns
      .map((intern) => {
        const log = logsByIntern.get(intern.id);
        return {
          id: intern.id,
          internName: intern.name,
          team: intern.team,
          clockIn: log?.clockIn || null,
        };
      })
      .sort((a, b) => a.internName.localeCompare(b.internName));
  }, [selectedDate]);

  function setStatus(internId: string, status: AttendanceStatus) {
    setStatusById((prev) => ({ ...prev, [internId]: status }));
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-mono font-bold text-text-primary mb-2">
          Intern Attendance Checking
        </h1>
        <p className="text-text-muted">
          Double-check attendance while interns are on the call.
        </p>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-text-muted mb-2">
          Date
        </label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="bg-bg-elevated border border-border-color rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-primary"
        />
      </div>

      <Card className="bg-bg-surface border-border-color overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border-color bg-bg-elevated/30">
                <th className="px-6 py-3 text-xs font-semibold text-text-muted uppercase">
                  Intern Name
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-text-muted uppercase">
                  In
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-text-muted uppercase">
                  Team
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-text-muted uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-text-muted uppercase">
                  Note
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-text-muted uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-color">
              {rows.length > 0 ? (
                rows.map((row) => {
                  const status = statusById[row.id] || 'pending';
                  return (
                    <tr key={row.id} className="hover:bg-bg-elevated/50">
                      <td className="px-6 py-4 text-sm text-text-primary font-medium">
                        {row.internName}
                      </td>
                      <td className="px-6 py-4 text-sm text-text-muted">
                        {row.clockIn ? formatTime(row.clockIn) : '--'}
                      </td>
                      <td className="px-6 py-4 text-sm text-text-muted">
                        {row.team}
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant="outline"
                          className={
                            status === 'present'
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                              : status === 'absent'
                                ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                                : 'bg-text-muted/10 text-text-muted border-text-muted/30'
                          }
                        >
                          {status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <input
                          value={noteById[row.id] || ''}
                          onChange={(e) =>
                            setNoteById((prev) => ({
                              ...prev,
                              [row.id]: e.target.value,
                            }))
                          }
                          placeholder="Add note if absent"
                          className="w-56 bg-bg-elevated border border-border-color rounded-md px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent-primary"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => setStatus(row.id, 'present')}
                            className="px-3 py-1 text-xs font-semibold text-emerald-500 border border-emerald-500/30 rounded-md hover:bg-emerald-500/10 transition-colors"
                          >
                            Present
                          </button>
                          <button
                            onClick={() => setStatus(row.id, 'absent')}
                            className="px-3 py-1 text-xs font-semibold text-amber-500 border border-amber-500/30 rounded-md hover:bg-amber-500/10 transition-colors"
                          >
                            Absent
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-sm text-text-muted"
                  >
                    No attendance records found for this date.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
