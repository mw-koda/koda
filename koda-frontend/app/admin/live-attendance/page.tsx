'use client';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { getAttendanceLogsByDate, interns } from '@/lib/mock-data';
import { batchesApi } from '@/lib/api/batches';
import { ArrowUpDown, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

type AttendanceStatus = 'pending' | 'present' | 'absent';
type SortKey = 'internName' | 'team' | 'status';
type SortDirection = 'asc' | 'desc';

type AttendanceRow = {
  id: string;
  internName: string;
  team: string;
  clockIn: string | null;
};

export default function AdminLiveAttendancePage() {
  const searchParams = useSearchParams();
  const batchId = searchParams.get('batchId');
  const backHref = batchId ? `/admin/batches/${batchId}` : '/admin/batches';
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(
    today.toISOString().slice(0, 10)
  );
  const [isMounted, setIsMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [batchName, setBatchName] = useState<string | null>(null);
  const [statusById, setStatusById] = useState<Record<string, AttendanceStatus>>({});
  const [clockInById, setClockInById] = useState<Record<string, string>>({});
  const [noteById, setNoteById] = useState<Record<string, string>>({});
  const [sortConfig, setSortConfig] = useState<{
    key: SortKey;
    direction: SortDirection;
  }>({
    key: 'internName',
    direction: 'asc',
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!batchId || !isMounted) {
      return;
    }

    const loadBatchName = async () => {
      try {
        const batch = await batchesApi.findOne(batchId);
        setBatchName(batch.name);
      } catch {
        setBatchName(null);
      }
    };

    void loadBatchName();
  }, [batchId, isMounted]);

  const rows = useMemo<AttendanceRow[]>(() => {
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

  const filteredAndSortedRows = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const searchedRows = normalizedQuery
      ? rows.filter((row) =>
          row.internName.toLowerCase().includes(normalizedQuery)
        )
      : rows;

    const withIndex = searchedRows.map((row, index) => ({ row, index }));
    withIndex.sort((a, b) => {
      const aStatus = statusById[a.row.id] || 'pending';
      const bStatus = statusById[b.row.id] || 'pending';
      const aValue =
        sortConfig.key === 'status'
          ? aStatus
          : sortConfig.key === 'team'
            ? a.row.team
            : a.row.internName;
      const bValue =
        sortConfig.key === 'status'
          ? bStatus
          : sortConfig.key === 'team'
            ? b.row.team
            : b.row.internName;
      const compare = String(aValue).localeCompare(String(bValue));

      if (compare !== 0) {
        return sortConfig.direction === 'asc' ? compare : -compare;
      }

      return a.index - b.index;
    });

    return withIndex.map(({ row }) => row);
  }, [rows, searchQuery, sortConfig, statusById]);

  function setStatus(internId: string, status: AttendanceStatus, options?: { clockInNow?: boolean }) {
    setStatusById((prev) => ({ ...prev, [internId]: status }));
    if (status === 'present' && options?.clockInNow) {
      setClockInById((prev) => ({
        ...prev,
        [internId]: new Date().toISOString(),
      }));
    }
    if (status === 'absent') {
      setClockInById((prev) => {
        const next = { ...prev };
        delete next[internId];
        return next;
      });
    }
  }

  function toggleSort(key: SortKey) {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === 'asc' ? 'desc' : 'asc',
        };
      }

      return {
        key,
        direction: 'asc',
      };
    });
  }

  if (!isMounted) {
    return <div className="p-8 text-text-muted">Loading attendance...</div>;
  }

  return (
    <div className="p-8">
      <Link
        href={backHref}
        className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors mb-4"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to {batchName || 'batches'}
      </Link>
      <div className="mb-6">
        <h1 className="text-3xl font-mono font-bold text-text-primary mb-2">
          Live Attendance
        </h1>
        <p className="text-text-muted">
          Monitor and confirm attendance while interns are on the call.
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

      <Card className="card-glow bg-bg-surface border-border-color overflow-hidden">
        <div className="border-b border-border-color bg-bg-elevated/20 px-6 py-4">
          <label
            htmlFor="attendance-search"
            className="mb-2 block text-xs font-semibold uppercase text-text-muted"
          >
            Search
          </label>
          <input
            id="attendance-search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by intern name"
            className="w-full max-w-sm bg-bg-elevated border border-border-color rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-primary"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border-color bg-bg-elevated/30">
                <th className="px-6 py-3 text-xs font-semibold text-text-muted uppercase">
                  <button
                    type="button"
                    onClick={() => toggleSort('internName')}
                    className="inline-flex items-center gap-1 hover:text-text-primary transition-colors"
                  >
                    Intern Name
                    <ArrowUpDown className="h-3.5 w-3.5" />
                  </button>
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-text-muted uppercase">
                  In
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-text-muted uppercase">
                  <button
                    type="button"
                    onClick={() => toggleSort('team')}
                    className="inline-flex items-center gap-1 hover:text-text-primary transition-colors"
                  >
                    Team
                    <ArrowUpDown className="h-3.5 w-3.5" />
                  </button>
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-text-muted uppercase">
                  <button
                    type="button"
                    onClick={() => toggleSort('status')}
                    className="inline-flex items-center gap-1 hover:text-text-primary transition-colors"
                  >
                    Status
                    <ArrowUpDown className="h-3.5 w-3.5" />
                  </button>
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
              {filteredAndSortedRows.length > 0 ? (
                filteredAndSortedRows.map((row) => {
                  const status = statusById[row.id] || 'pending';
                  const clockIn = status === 'absent'
                    ? null
                    : status === 'present'
                      ? clockInById[row.id] || row.clockIn
                      : row.clockIn;
                  return (
                    <tr key={row.id} className="hover:bg-bg-elevated/50">
                      <td className="px-6 py-4 text-sm text-text-primary font-medium">
                        {row.internName}
                      </td>
                      <td className="px-6 py-4 text-sm text-text-muted">
                        {clockIn ? formatTime(clockIn) : '--'}
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
                          disabled={status !== 'absent'}
                          className="w-56 bg-bg-elevated border border-border-color rounded-md px-3 py-2 text-xs text-text-primary disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:border-accent-primary"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => setStatus(row.id, 'present', { clockInNow: true })}
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
