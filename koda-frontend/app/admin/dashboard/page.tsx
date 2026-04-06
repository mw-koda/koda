import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { users } from '@/lib/mock-data';

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
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const activeUsers = users.filter((user) => user.status === 'active');
  const pendingUsers = users.filter((user) => user.status === 'pending');
  const adminUsers = users.filter((user) => user.role === 'admin');
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
    </div>
  );
}
