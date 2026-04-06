'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Check, Copy, LogIn } from 'lucide-react';

export function JoinOrganizationCard({ currentOrganizationId }: { currentOrganizationId?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleJoin = () => {
    if (!code.trim()) {
      setMessage({ type: 'error', text: 'Please enter an organization code' });
      return;
    }

    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      if (code === 'KODA-METAWATT-Q1-2024') {
        localStorage.setItem('userOrganizationId', 'org-1');
        setMessage({ type: 'success', text: 'Successfully joined organization!' });
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setMessage({ type: 'error', text: 'Invalid organization code. Please try again.' });
      }
      setIsLoading(false);
    }, 800);
  };

  if (currentOrganizationId) {
    return null;
  }

  return (
    <>
      {/* Banner when not in dialog */}
      {!isOpen && (
        <Card className="bg-gradient-to-r from-accent-primary/10 to-accent-secondary/10 border border-accent-primary/30 p-6 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-accent-primary flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">
                  Join an Organization
                </h3>
                <p className="text-text-muted text-sm mb-4">
                  Enter an organization code to join and start collaborating with your team.
                </p>
              </div>
            </div>
            <Button
              onClick={() => setIsOpen(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-accent-primary to-accent-primary/80 text-bg-surface hover:shadow-lg hover:shadow-accent-primary/20"
            >
              <LogIn className="h-4 w-4" />
              Join Now
            </Button>
          </div>
        </Card>
      )}

      {/* Modal/Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="bg-bg-surface border-border-color w-full max-w-md p-8 shadow-2xl">
            <h2 className="text-2xl font-mono font-bold text-text-primary mb-2">
              Join Organization
            </h2>
            <p className="text-text-muted text-sm mb-6">
              Enter the organization code provided by your coordinator.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Organization Code
                </label>
                <Input
                  type="text"
                  placeholder="e.g., KODA-METAWATT-Q1-2024"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase());
                    setMessage(null);
                  }}
                  className="bg-bg-elevated border-border-color text-text-primary placeholder-text-muted/50"
                  disabled={isLoading}
                />
              </div>

              {message && (
                <div
                  className={`flex items-start gap-3 p-3 rounded-lg border ${
                    message.type === 'success'
                      ? 'bg-accent-primary/10 border-accent-primary/30 text-accent-primary'
                      : 'bg-accent-danger/10 border-accent-danger/30 text-accent-danger'
                  }`}
                >
                  {message.type === 'success' ? (
                    <Check className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  )}
                  <span className="text-sm">{message.text}</span>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsOpen(false);
                    setCode('');
                    setMessage(null);
                  }}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleJoin}
                  disabled={isLoading || !code.trim()}
                  className="flex-1 bg-gradient-to-r from-accent-primary to-accent-primary/80 text-bg-surface"
                >
                  {isLoading ? 'Joining...' : 'Join'}
                </Button>
              </div>
            </div>

            {/* Demo Info */}
            <div className="mt-6 pt-6 border-t border-border-color/30">
              <p className="text-xs text-text-muted/60">
                💡 <strong>Demo Code:</strong> KODA-METAWATT-Q1-2024
              </p>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
