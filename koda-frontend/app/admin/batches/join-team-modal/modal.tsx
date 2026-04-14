'use client';

import { useState } from 'react';
import { Hash, Users, ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface JoinTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function JoinTeamModal({ isOpen, onClose }: JoinTeamModalProps) {
  const [joinCode, setJoinCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Logic to verify code and assign team goes here later
    console.log("Joining team with code:", joinCode);
    
    // Simulate API delay
    setTimeout(() => {
      setIsSubmitting(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <Card className="w-full max-w-md border-accent-primary/30 bg-bg-surface card-glow animate-in zoom-in duration-300">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent-primary/10 mb-2">
            <Users className="h-8 w-8 text-accent-primary" />
          </div>
          <CardTitle className="font-display text-2xl text-text-primary">Welcome to KODA</CardTitle>
          <CardDescription className="text-text-muted">
            You are currently unassigned. Enter the **Join Code** provided by your Coordinator to access your team dashboard.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleJoin} className="space-y-6">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-text-muted">
                <Hash className="h-3 w-3 text-accent-primary" /> Internship Join Code
              </label>
              <input
                type="text"
                required
                placeholder="ENTER-CODE"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className="w-full bg-bg-elevated border border-border-color rounded-md px-4 py-4 text-center font-mono text-2xl font-bold tracking-[0.3em] text-accent-primary focus:outline-none focus:border-accent-primary transition-all placeholder:text-text-muted/20"
              />
            </div>

            <Button 
              type="submit"
              disabled={isSubmitting || joinCode.length < 4}
              className="w-full bg-accent-primary hover:bg-accent-primary/90 text-white py-6 text-lg font-bold gap-2"
            >
              {isSubmitting ? "Verifying..." : "Join Cohort"}
              {!isSubmitting && <ArrowRight className="h-5 w-5" />}
            </Button>
            
            <p className="text-center text-xs text-text-muted italic">
              Don't have a code? Contact your supervisor.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}