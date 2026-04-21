'use client';

import { useState } from 'react';
import { Copy, X, Calendar, Hash, Type, Users as UsersIcon, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { batchesApi } from '@/lib/api/batches';
import { toTitleCase } from '@/lib/utils';

interface CreateBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateBatchModal({ isOpen, onClose, onSuccess }: CreateBatchModalProps) {
  const [batchName, setBatchName] = useState('');
  const [description, setDescription] = useState('');
  const [maxInterns, setMaxInterns] = useState('50');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const generateJoinCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setJoinCode(code);
  };

  // Generate code on first mount
  if (!joinCode) {
    generateJoinCode();
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(joinCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateBatch = async () => {
    setError(null);

    // Validation
    if (!batchName.trim()) {
      setError('Batch name is required');
      return;
    }
    if (!startDate) {
      setError('Start date is required');
      return;
    }
    if (!endDate) {
      setError('End date is required');
      return;
    }
    if (!maxInterns || parseInt(maxInterns) < 1) {
      setError('Max interns must be at least 1');
      return;
    }

    setIsLoading(true);
    try {
      await batchesApi.create({
        name: toTitleCase(batchName.trim()),
        description: description.trim() || undefined,
        startDate,
        endDate,
        maxInterns: parseInt(maxInterns),
        joinCode: joinCode || undefined,
      });

      // Reset form
      setBatchName('');
      setDescription('');
      setMaxInterns('50');
      setStartDate('');
      setEndDate('');
      setJoinCode('');
      setError(null);

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create batch');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <Card className="w-full max-w-lg border-border-color bg-bg-surface card-glow animate-in fade-in zoom-in duration-200">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border-color/50 pb-4">
          <CardTitle className="font-display text-2xl text-text-primary">Initialize New Batch</CardTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose} 
            className="text-text-muted hover:text-text-primary"
            disabled={isLoading}
          >
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* Error Alert */}
          {error && (
            <div className="flex gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-md">
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}

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
              disabled={isLoading}
              className="w-full bg-bg-elevated border border-border-color rounded-md px-4 py-2.5 text-text-primary focus:outline-none focus:border-accent-primary/50 transition-colors disabled:opacity-50"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-text-muted">
              <Type className="h-3 w-3 text-accent-primary" /> Description (Optional)
            </label>
            <textarea
              placeholder="Enter batch description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
              className="w-full bg-bg-elevated border border-border-color rounded-md px-4 py-2.5 text-text-primary focus:outline-none focus:border-accent-primary/50 transition-colors resize-none disabled:opacity-50"
              rows={2}
            />
          </div>

          {/* Join Code Section */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-text-muted">
              <Hash className="h-3 w-3 text-accent-primary" /> Join Code
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                disabled={isLoading}
                className="flex-1 bg-bg-elevated border border-border-color rounded-md px-4 py-2.5 font-mono text-lg font-bold text-accent-primary tracking-widest focus:outline-none focus:border-accent-primary/50 disabled:opacity-50"
              />
              <Button 
                onClick={generateJoinCode}
                disabled={isLoading}
                className="bg-bg-elevated border border-border-color hover:bg-bg-surface text-text-primary transition-all"
                variant="outline"
              >
                Regenerate
              </Button>
              <Button 
                onClick={handleCopy}
                disabled={isLoading}
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
                disabled={isLoading}
                className="w-full bg-bg-elevated border border-border-color rounded-md px-4 py-2.5 text-text-primary text-sm focus:outline-none focus:border-accent-primary/50 disabled:opacity-50"
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
                disabled={isLoading}
                className="w-full bg-bg-elevated border border-border-color rounded-md px-4 py-2.5 text-text-primary text-sm focus:outline-none focus:border-accent-primary/50 disabled:opacity-50"
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
              disabled={isLoading}
              className="w-full bg-bg-elevated border border-border-color rounded-md px-4 py-2.5 text-text-primary focus:outline-none focus:border-accent-primary/50 disabled:opacity-50"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button 
              variant="ghost" 
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 text-text-muted hover:bg-bg-elevated disabled:opacity-50"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateBatch}
              disabled={isLoading}
              className="flex-1 bg-accent-primary text-white hover:bg-accent-primary/90 font-bold disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create Batch'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}