'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { FileText, Calendar, Clock, Loader2 } from 'lucide-react';
import { ReportRecord } from '@/lib/api/reports';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface ReportViewModalProps {
  report: ReportRecord | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

function getReportStatusClass(status: string | null) {
  switch (status) {
    case 'reviewed':
      return 'bg-accent-primary/10 text-accent-primary border-accent-primary/30';
    case 'submitted':
      return 'bg-accent-warning/10 text-accent-warning border-accent-warning/30';
    case 'pending':
    case 'draft':
      return 'bg-text-muted/10 text-text-muted border-text-muted/30';
    default:
      return 'bg-text-muted/10 text-text-muted border-text-muted/30';
  }
}

function parseContent(content: string | null) {
  if (!content) return <p className="text-sm text-text-muted italic">No content provided.</p>;

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  
  let inTable = false;
  let tableHeaders: string[] = [];
  let tableRows: string[][] = [];

  const renderTable = () => {
    if (tableHeaders.length === 0) return null;
    const el = (
      <div className="border border-border-color rounded-lg overflow-x-auto my-4" key={`table-${elements.length}`}>
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-bg-elevated border-b border-border-color text-text-muted">
            <tr>
              {tableHeaders.map((th, i) => (
                <th key={i} className="p-2 whitespace-nowrap">{th.trim()}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-color">
            {tableRows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j} className="p-2 text-text-primary">{cell.trim()}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    tableHeaders = [];
    tableRows = [];
    inTable = false;
    return el;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Table parsing
    if (line.startsWith('|')) {
      if (!inTable) {
        inTable = true;
        tableHeaders = line.split('|').filter(Boolean);
        // Skip separator line like |---|---|
        if (i + 1 < lines.length && lines[i + 1].includes('|-')) {
          i++; 
        }
      } else {
        tableRows.push(line.split('|').filter(Boolean));
      }
      continue;
    } else if (inTable) {
      const tableEl = renderTable();
      if (tableEl) elements.push(tableEl);
    }

    // Bold text matching (**text**)
    const formatBold = (text: string) => {
      const parts = text.split(/(\*\*.*?\*\*)/);
      return parts.map((part, idx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={idx} className="font-bold text-text-primary">{part.slice(2, -2)}</strong>;
        }
        return part;
      });
    };

    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={i} className="text-sm font-semibold text-text-primary font-mono uppercase tracking-widest mt-6 mb-2 text-accent-primary">
          {line.replace('### ', '')}
        </h3>
      );
    } else if (line.startsWith('- ')) {
      const ratingMatch = line.match(/^- (.*?):\s*(\d+)\/10/);
      if (ratingMatch) {
        const [, category, scoreStr] = ratingMatch;
        const score = parseInt(scoreStr, 10);
        elements.push(
          <div key={i} className="flex items-center justify-between bg-bg-elevated p-3 rounded-lg border border-border-color mb-2 ml-4 mr-4">
            <span className="text-xs text-text-muted font-mono uppercase tracking-widest">{category}</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-text-primary mr-2">{score}/10</span>
              {Array.from({ length: 10 }).map((_, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "w-2.5 h-2.5 rounded-full transition-colors",
                    idx < score 
                      ? "bg-accent-primary shadow-[0_0_5px_var(--accent-primary)]" 
                      : "bg-bg-surface border border-border-color"
                  )}
                />
              ))}
            </div>
          </div>
        );
      } else {
        elements.push(
          <li key={i} className="text-sm text-text-primary ml-4 list-disc marker:text-accent-primary/50 mb-1">
            {formatBold(line.replace('- ', ''))}
          </li>
        );
      }
    } else if (line.trim() === '') {
      // Empty line spacing
      elements.push(<div key={i} className="h-2" />);
    } else {
      elements.push(
        <p key={i} className="text-sm text-text-primary leading-relaxed">
          {formatBold(line)}
        </p>
      );
    }
  }

  // Flush remaining table
  if (inTable) {
    const tableEl = renderTable();
    if (tableEl) elements.push(tableEl);
  }

  return <div className="space-y-1">{elements}</div>;
}

export function ReportViewModal({ report, isOpen, onOpenChange }: ReportViewModalProps) {
  if (!report) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-bg-surface border-border-color sm:max-w-2xl max-h-[90vh] overflow-y-auto [&>button]:top-3 [&>button]:right-3 [&>button]:rounded-full [&>button]:border [&>button]:border-border-color [&>button]:bg-bg-elevated [&>button]:text-text-muted [&>button]:hover:bg-bg-surface [&>button]:hover:text-text-primary [&>button]:opacity-100">
        <DialogHeader className="mb-4">
          <div className="pr-10">
            <DialogTitle className="text-text-primary text-xl font-mono mb-2">
              {report.title || 'Untitled Report'}
            </DialogTitle>
            <div className="mb-3">
              <Badge
                variant="outline"
                className={`text-xs uppercase font-mono px-3 py-1 ${getReportStatusClass(report.status)}`}
              >
                {report.status}
              </Badge>
            </div>
            <DialogDescription className="text-text-muted flex flex-col gap-1">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3 w-3" />
                Period: {new Date(report.period_start || '').toLocaleDateString()} — {new Date(report.period_end || '').toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3 w-3" />
                Submitted: {new Date(report.submitted_at || '').toLocaleString()}
              </span>
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="pt-4 border-t border-border-color">
          {parseContent(report.content)}
        </div>
      </DialogContent>
    </Dialog>
  );
}
