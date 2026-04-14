'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  GitPullRequest,
  Target,
} from 'lucide-react';
import { interns, issues, reports, performanceData, mockAuthConfig } from '@/lib/mock-data';
import { JoinOrganizationCard } from '@/components/join-organization-card';
import Link from 'next/link';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// --- ADDED IMPORT ---
import JoinTeamModal from '../../admin/batches/join-team-modal/modal';

function StatCard({
  title,
  value,
  change,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string | number;
  change: string;
  icon: any;
  trend: 'up' | 'down';
}) {
  return (
    <Card className="bg-bg-surface border-border-color p-6 card-glow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-label text-text-muted mb-2">{title}</p>
          <p className="text-3xl font-mono font-bold text-text-primary mb-1">
            {value}
          </p>
          <div className="flex items-center gap-1">
            {trend === 'up' ? (
              <TrendingUp className="h-3 w-3 text-accent-primary" />
            ) : (
              <TrendingDown className="h-3 w-3 text-accent-danger" />
            )}
            <span
              className={`text-xs ${trend === 'up' ? 'text-accent-primary' : 'text-accent-danger'}`}
            >
              {change}
            </span>
          </div>
        </div>
        <div className="p-3 bg-bg-elevated rounded-lg">
          <Icon className="h-6 w-6 text-accent-primary" />
        </div>
      </div>
    </Card>
  );
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case 'open':
      return 'bg-accent-secondary/10 text-accent-secondary border-accent-secondary/30';
    case 'closed':
      return 'bg-accent-primary/10 text-accent-primary border-accent-primary/30';
    case 'in-progress':
      return 'bg-accent-warning/10 text-accent-warning border-accent-warning/30';
    default:
      return 'bg-text-muted/10 text-text-muted border-text-muted/30';
  }
}

function formatTimestamp(timestamp: string) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 1) return `${days} days ago`;
  if (days === 1) return 'yesterday';
  if (hours > 0) return `${hours} hours ago`;
  return 'just now';
}

export default function InternDashboardPage() {
  const [currentRole, setCurrentRole] = useState<string>(mockAuthConfig.role);
  const [userOrganizationId, setUserOrganizationId] = useState<string | undefined>(mockAuthConfig.organizationId);
  
  // --- ADDED STATE FOR MODAL ---
  const [showJoinModal, setShowJoinModal] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem('selectedRole') || mockAuthConfig.role;
    const orgId = localStorage.getItem('userOrganizationId') || mockAuthConfig.organizationId;
    setCurrentRole(role);
    setUserOrganizationId(orgId || undefined);

    // --- LOGIC: Trigger modal if intern is unassigned ---
    if (role === 'intern' && !orgId) {
      setShowJoinModal(true);
    }
  }, []);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const pendingReports = reports.filter((r) => r.status === 'pending').length;
  const openIssues = issues.filter((i) => i.status === 'open').length;
  const avgScore =
    reports.filter((r) => r.score !== null).reduce((acc, r) => acc + (r.score || 0), 0) /
    reports.filter((r) => r.score !== null).length;

  const recentIssues = [...issues]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 6);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-mono font-bold text-text-primary mb-2">
          Overview
        </h1>
        <p className="text-text-muted">{today}</p>
      </div>

      {/* Show Join Organization card for interns without an organization */}
      {currentRole === 'intern' && (
        <JoinOrganizationCard currentOrganizationId={userOrganizationId} />
      )}

      {/* --- ADDED MODAL COMPONENT --- */}
      <JoinTeamModal 
        isOpen={showJoinModal} 
        onClose={() => setShowJoinModal(false)} 
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Interns"
          value={interns.length}
          change="+2 this month"
          icon={Users}
          trend="up"
        />
        <StatCard
          title="Reports Pending"
          value={pendingReports}
          change="-1 from last week"
          icon={FileText}
          trend="down"
        />
        <StatCard
          title="Open GitHub Issues"
          value={openIssues}
          change="+3 this week"
          icon={GitPullRequest}
          trend="up"
        />
        <StatCard
          title="Avg Performance Score"
          value={`${avgScore.toFixed(1)}%`}
          change="+2.4% from last period"
          icon={Target}
          trend="up"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="bg-bg-surface border-border-color p-6">
          <h2 className="text-xl font-mono font-semibold text-text-primary mb-4">
            Recent GitHub Activity Feed
          </h2>
          <div className="space-y-3">
            {recentIssues.map((issue) => (
              <div
                key={issue.id}
                className="flex items-start gap-3 p-3 bg-bg-elevated rounded-lg border border-border-color hover:border-accent-primary/30 transition-colors"
              >
                <GitPullRequest className="h-5 w-5 text-text-muted mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {issue.title}
                    </p>
                    <Badge
                      variant="outline"
                      className={`text-xs flex-shrink-0 ${getStatusBadgeClass(issue.status)}`}
                    >
                      {issue.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-text-muted">
                    <span className="font-mono">{issue.repo}</span>
                    <span>•</span>
                    <span>{issue.assignee}</span>
                    <span>•</span>
                    <span>{formatTimestamp(issue.updatedAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Link
            href="/issues"
            className="inline-block mt-4 text-sm text-accent-secondary hover:text-accent-primary transition-colors"
          >
            View all issues →
          </Link>
        </Card>

        <Card className="bg-bg-surface border-border-color p-6">
          <h2 className="text-xl font-mono font-semibold text-text-primary mb-4">
            Performance Overview
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={performanceData}>
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4DFFA3" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#4DFFA3" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#252830" />
              <XAxis
                dataKey="week"
                stroke="#6B7280"
                style={{ fontSize: '12px', fontFamily: 'IBM Plex Mono' }}
              />
              <YAxis
                stroke="#6B7280"
                style={{ fontSize: '12px', fontFamily: 'IBM Plex Mono' }}
                domain={[70, 100]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1C2029',
                  border: '1px solid #252830',
                  borderRadius: '8px',
                  fontFamily: 'DM Sans',
                }}
                labelStyle={{ color: '#E8EAF0' }}
              />
              <Area
                type="monotone"
                dataKey="score"
                stroke="#4DFFA3"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorScore)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="bg-bg-surface border-border-color p-6">
        <h2 className="text-xl font-mono font-semibold text-text-primary mb-4">
          Intern Status Summary
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {interns.map((intern) => (
            <Link key={intern.id} href={`/interns/${intern.id}`}>
              <div className="p-4 bg-bg-elevated rounded-lg border border-border-color hover:border-accent-primary/50 transition-all card-glow cursor-pointer">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12 bg-bg-base border border-border-color">
                    <AvatarFallback className="bg-accent-primary/10 text-accent-primary font-mono font-semibold">
                      {intern.avatarInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-text-primary truncate">
                      {intern.name}
                    </h3>
                    <p className="text-xs text-text-muted mb-2">{intern.role}</p>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          intern.reportStatus === 'submitted'
                            ? 'bg-accent-warning/10 text-accent-warning border-accent-warning/30'
                            : intern.reportStatus === 'reviewed'
                              ? 'bg-accent-primary/10 text-accent-primary border-accent-primary/30'
                              : 'bg-text-muted/10 text-text-muted border-text-muted/30'
                        }`}
                      >
                        {intern.reportStatus}
                      </Badge>
                      <span className="text-xs text-text-muted font-mono">
                        {intern.score}%
                      </span>
                    </div>
                    <p className="text-xs text-text-muted">{intern.lastActive}</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}