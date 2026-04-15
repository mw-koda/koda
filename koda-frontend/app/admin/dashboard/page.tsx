'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import * as mockData from '@/lib/mock-data';
import AdminOnboardingView from './onboarding-view';
import { getUsers } from '@/lib/api/users';

type DashboardUser = {
  id: string;
  name: string;
  role: 'admin' | 'coordinator' | 'team_lead' | 'intern';
  status: 'active' | 'pending' | 'inactive';
  joinedAt: string;
};


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
  const [users, setUsers] = useState<DashboardUser[]>([]);
  const [usersError, setUsersError] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);

    void (async () => {
      try {
        const response = await getUsers();
        setUsers(
          response.map((user) => ({
            id: user.id,
            name: user.name?.trim() || user.github_username,
            role:
              user.role === 'admin' ||
              user.role === 'coordinator' ||
              user.role === 'team_lead' ||
              user.role === 'intern'
                ? user.role
                : 'intern',
            status:
              user.status === 'active' ||
              user.status === 'pending' ||
              user.status === 'inactive'
                ? user.status
                : user.is_onboarded
                  ? 'active'
                  : 'pending',
            joinedAt:
              user.created_at?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
          })),
        );
      } catch (error: unknown) {
        setUsersError(error instanceof Error ? error.message : 'Failed to load users');
      }
    })();
  }, []);

  if (!isMounted) {
    return <div className="p-8 text-text-muted">Loading dashboard...</div>;
  }

  const batches = mockData.batches ?? [];
  const fallbackUsers = mockData.users.map((user) => ({
    id: user.id,
    name: user.name,
    role: user.role,
    status: user.status,
    joinedAt: user.joinedAt,
  }));
  const usersToRender = usersError ? fallbackUsers : users;

  const showOnboarding = batches.length === 0;
  if(showOnboarding) {
    return <AdminOnboardingView />;
  } 

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const activeUsers = usersToRender.filter((user) => user.status === 'active');
  const pendingUsers = usersToRender.filter((user) => user.status === 'pending');
  const adminUsers = usersToRender.filter((user) => user.role === 'admin');
  const interns = usersToRender.filter((user) => user.role === 'intern');

  const newestUsers = [...usersToRender]
    .sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime())
    .slice(0, 6);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-mono font-bold text-text-primary mb-2">
          Admin Dashboard
        </h1>
        <p className="text-text-muted">{today}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-bg-surface border-border-color p-6 card-glow">
          <p className="text-label text-text-muted mb-2">Total Users</p>
          <p className="text-3xl font-mono font-bold text-text-primary">
            {usersToRender.length}
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
    </div>
  );
}
