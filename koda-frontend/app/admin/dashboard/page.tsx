'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react'; // Added for error state
import * as mockData from '@/lib/mock-data';
import { batchesApi, BatchSummary } from '@/lib/api/batches'; // Import the API
import AdminOnboardingView from '../batches/onboarding-modal/onboarding-view';

function getUserStatusClass(status: string) {
  switch (status) {
    case 'active':
      return 'bg-accent-primary/10 text-accent-primary border-accent-primary/30';
    case 'pending':
      return 'bg-accent-warning/10 text-accent-warning border-accent-warning/30';
    case 'inactive':
      return 'bg-text-muted/10 text-text-muted border-text-muted/30';
    default:
      return 'bg-text-muted/10 text-text-muted border-text-muted/30';
  }
}

export default function AdminDashboardPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [batches, setBatches] = useState<BatchSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch data logic moved from BatchesPage
  useEffect(() => {
    if (!isMounted) return;

    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await batchesApi.findAll();
        setBatches(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
        console.error('Error fetching dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [isMounted]);

  if (!isMounted || isLoading) {
    return (
      <div className="p-8 flex items-center gap-3 text-text-muted font-mono">
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-accent-primary/20 border-t-accent-primary" />
        Initializing KODA Dashboard...
      </div>
    );
  }

  // Users are still coming from mockData for now
  const users = mockData.users ?? [];
  const showOnboarding = batches.length === 0;

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const activeUsers = users.filter((user) => user.status === 'active');
  const pendingUsers = users.filter((user) => user.status === 'pending');
  const interns = users.filter((user) => user.role === 'intern');

  const newestUsers = [...users]
    .sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime())
    .slice(0, 6);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-mono font-bold text-text-primary mb-2">
          Admin Dashboard
        </h1>
        <p className="text-text-muted">{today}</p>
        
        {error && (
          <div className="mt-4 flex gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-bg-surface border-border-color p-6 card-glow">
          <p className="text-label text-text-muted mb-2">Total Users</p>
          <p className="text-3xl font-mono font-bold text-text-primary">
            {users.length}
          </p>
          <p className="text-xs text-text-muted mt-2">All roles</p>
        </Card>
        <Card className="bg-bg-surface border-border-color p-6 card-glow">
          <p className="text-label text-text-muted mb-2">Active Users</p>
          <p className="text-3xl font-mono font-bold text-text-primary">
            {activeUsers.length}
          </p>
          <p className="text-xs text-text-muted mt-2">Currently enabled</p>
        </Card>
        <Card className="bg-bg-surface border-border-color p-6 card-glow">
          <p className="text-label text-text-muted mb-2">Pending Requests</p>
          <p className="text-3xl font-mono font-bold text-text-primary">
            {pendingUsers.length}
          </p>
          <p className="text-xs text-text-muted mt-2">Awaiting approval</p>
        </Card>
        <Card className="bg-bg-surface border-border-color p-6 card-glow">
          <p className="text-label text-text-muted mb-2">Interns</p>
          <p className="text-3xl font-mono font-bold text-text-primary">
            {interns.length}
          </p>
          <p className="text-xs text-text-muted mt-2">Active program</p>
        </Card>
      </div>

      <Card className="bg-bg-surface border-border-color p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-mono font-semibold text-text-primary">
            Latest User Signups
          </h2>
          <Link
            href="/admin"
            className="text-sm text-accent-secondary hover:text-accent-primary transition-colors"
          >
            Manage users
          </Link>
        </div>
        <div className="space-y-3">
          {newestUsers.map((user) => (
            <div
              key={user.id}
              className="p-3 bg-bg-elevated rounded-lg border border-border-color"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-text-primary">
                    {user.name}
                  </p>
                  <p className="text-xs text-text-muted mt-1">
                    {user.role} • Joined {user.joinedAt}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={`text-xs ${getUserStatusClass(user.status)}`}
                >
                  {user.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Onboarding Modal triggers if batches.length is 0. 
         Wait for isLoading to be false before showing to avoid "pop-in" 
      */}
      {!isLoading && <AdminOnboardingView isOpen={showOnboarding} />}
    </div>
  );
}