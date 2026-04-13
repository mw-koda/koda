'use client';

import { useState } from 'react';
import { Copy, X, Calendar, Hash, Type, Users as UsersIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CreateBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateBatchModal({ isOpen, onClose }: CreateBatchModalProps) {
  const [batchName, setBatchName] = useState('');
  const [maxInterns, setMaxInterns] = useState('50');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Generate a random 6-character code
  const [joinCode] = useState(() => Math.random().toString(36).substring(2, 8).toUpperCase());
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(joinCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <Card className="w-full max-w-lg border-border-color bg-bg-surface card-glow animate-in fade-in zoom-in duration-200">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border-color/50 pb-4">
          <CardTitle className="font-display text-2xl text-text-primary">Initialize New Batch</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-text-muted hover:text-text-primary">
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* Batch Name */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-text-muted">
              <Type className="h-3 w-3 text-accent-primary" /> Batch Name
            </label>
            <input
              type="text"
              placeholder="e.g. 2026 First Semester"
              value={batchName}
              onChange={(e) => setBatchName(e.target.value)}
              className="w-full bg-bg-elevated border border-border-color rounded-md px-4 py-2.5 text-text-primary focus:outline-none focus:border-accent-primary/50 transition-colors"
            />
          </div>

          {/* Join Code Section */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-text-muted">
              <Hash className="h-3 w-3 text-accent-primary" /> Join Code
            </label>
            <div className="flex gap-2">
              <div className="flex-1 bg-bg-elevated border border-border-color rounded-md px-4 py-2.5 font-mono text-lg font-bold text-accent-primary tracking-widest">
                {joinCode}
              </div>
              <Button 
                onClick={handleCopy}
                className={`${copied ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-bg-elevated border border-border-color hover:bg-bg-surface'} transition-all`}
                variant="outline"
              >
                {copied ? 'Copied!' : <Copy className="h-4 w-4 text-text-primary" />}
              </Button>
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-text-muted">
                <Calendar className="h-3 w-3 text-accent-primary" /> Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-bg-elevated border border-border-color rounded-md px-4 py-2.5 text-text-primary text-sm focus:outline-none focus:border-accent-primary/50"
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-text-muted">
                <Calendar className="h-3 w-3 text-accent-primary" /> End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-bg-elevated border border-border-color rounded-md px-4 py-2.5 text-text-primary text-sm focus:outline-none focus:border-accent-primary/50"
              />
            </div>
          </div>

          {/* Intern Capacity */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-text-muted">
              <UsersIcon className="h-3 w-3 text-accent-primary" /> Max Capacity (Interns)
            </label>
            <input
              type="number"
              value={maxInterns}
              onChange={(e) => setMaxInterns(e.target.value)}
              className="w-full bg-bg-elevated border border-border-color rounded-md px-4 py-2.5 text-text-primary focus:outline-none focus:border-accent-primary/50"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button 
              variant="ghost" 
              onClick={onClose}
              className="flex-1 text-text-muted hover:bg-bg-elevated"
            >
              Cancel
            </Button>
            <Button 
              className="flex-1 bg-accent-primary text-white hover:bg-accent-primary/90 font-bold"
            >
              Create Batch
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}