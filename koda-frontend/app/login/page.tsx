'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Github } from 'lucide-react';
import { useRouter } from 'next/navigation';
// import { mockAuthConfig, roleRedirects } from '@/lib/mock-data';
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-surface via-bg-elevated to-bg-surface overflow-hidden flex items-center justify-center">
      {/* Animated background elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-accent-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent-secondary/5 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="relative w-full max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-primary/20 to-accent-primary/10 mb-6">
            <span className="text-3xl font-mono font-bold text-accent-primary">K</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-mono font-bold text-text-primary mb-3">
            KODA
          </h1>
          <p className="text-lg text-accent-primary font-semibold mb-2 tracking-wide">
            Correlated Evidence. Verified Progress.
          </p>
          <p className="text-text-muted font-mono text-sm">
            Knowledge, Oversight, and Development Analytics
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-border-color/30 bg-gradient-to-b from-bg-elevated/50 to-bg-surface/50 backdrop-blur-md p-8 shadow-xl mb-8">
          <div className="mb-8">
            <p className="text-center text-text-primary text-lg font-semibold mb-2">
              Welcome to KODA
            </p>
            <p className="text-center text-text-muted text-sm">
              Sign in with your GitHub account to get started
            </p>
          </div>

          {/* Login Button */}
          <Button
            onClick={() => {
              setIsLoading(true);
              window.location.href = `${API_URL}/auth/github`;
            }}
            disabled={isLoading}
            className={`w-full px-6 py-3 rounded-xl font-semibold text-lg flex items-center justify-center gap-3 transition-all duration-300 ${
              !isLoading
                ? 'bg-gradient-to-r from-accent-primary to-accent-primary/80 hover:shadow-lg hover:shadow-accent-primary/20 text-bg-surface hover:scale-105'
                : 'bg-accent-primary/50 text-bg-surface cursor-not-allowed'
            }`}
          >
            <Github className="w-5 h-5" />
            {isLoading ? 'Signing in...' : 'Continue with GitHub'}  
          </Button>

          {/* Info Message */}
          <div className="mt-6 pt-6 border-t border-border-color/20">
            <p className="text-xs text-text-muted/70 text-center">
              By signing in, you agree to KODA Terms of Service and Privacy Policy
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-text-muted/60">
            © 2024 KODA. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
