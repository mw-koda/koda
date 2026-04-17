'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  GitPullRequest,
  ChevronLeft,
  ShieldCheck,
  Layers,
  UserCircle,
  LogOut,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { roleRedirects } from '@/lib/role-redirects';
import { useCurrentUser } from '@/hooks/use-current-user';
import { auth } from '@/lib/auth';

const adminNavigation = [
  { name: 'User Management', href: '/admin', icon: ShieldCheck },
  { name: 'Batch Management', href: '/admin/batches', icon: Layers, match: 'prefix' },
  { name: 'Team Management', href: '/admin/teams', icon: Users, match: 'prefix' }, // New Item
];

function isAdminNavItemActive(pathname: string, href: string) {
  if (href === '/admin') {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(href + '/');
}


export function Sidebar() {
  const pathname = usePathname();
  const { user, isLoading } = useCurrentUser();
  const [storedRole, setStoredRole] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setStoredRole(localStorage.getItem('selectedRole'));
  }, []);

  const rawRole = user?.role ?? storedRole ?? 'coordinator';
  const normalizedRole = rawRole === 'team_lead' ? 'admin' : rawRole;
  const currentRole = normalizedRole;

  if (isLoading) {
    return (
      <div className="fixed left-0 top-0 h-screen w-60 bg-bg-surface border-r border-border-color" />
    );
  }

  const dashboardHref = roleRedirects[currentRole] || '/login';
  const isDashboardRoute = pathname === dashboardHref || pathname.startsWith(dashboardHref + '/');
  const isIntern = currentRole === 'intern';
  const isAdmin = currentRole === 'admin';
  const adminTeamMatch = pathname.match(/^\/admin\/teams\/([^/]+)/);
  const adminTeamSlug = adminTeamMatch?.[1];
  const isAdminTeamView = isAdmin && Boolean(adminTeamSlug);
  const adminTeamBase = adminTeamSlug ? `/admin/teams/${adminTeamSlug}` : '';

  const managementItem = {
    name: 'Intern Management',
    href: '/coordinator/intern-management',
    icon: Users,
  };

  const navigation = isAdmin
    ? []
    : isIntern
        ? [
            { name: 'Dashboard', href: dashboardHref, icon: LayoutDashboard },
            { name: 'Profile', href: '/interns/profile', icon: UserCircle },
            { name: 'Issue Tracking', href: '/interns/issue-tracking', icon: GitPullRequest },
          ]
        : [
            { name: 'Dashboard', href: dashboardHref, icon: LayoutDashboard },
            managementItem,
            { name: 'Issue Tracking', href: '/coordinator/issue-tracking-page', icon: GitPullRequest },
          ];

  const adminNavigationItems = isAdmin
    ? [
        {
          name: 'Dashboard',
          href: dashboardHref,
          icon: LayoutDashboard,
          match: 'prefix',
        },
        ...adminNavigation,
      ]
    : adminNavigation;

  const adminTeamNavigation = isAdminTeamView
    ? [
        { name: 'Dashboard', href: `${adminTeamBase}/dashboard`, icon: LayoutDashboard, match: 'prefix' },
        { name: 'Team Management', href: `${adminTeamBase}/team-management`, icon: Users, match: 'prefix' },
        { name: 'Issue Tracking', href: `${adminTeamBase}/issue-tracking`, icon: GitPullRequest, match: 'prefix' },
      ]
    : [];

  return (
    <div className="fixed left-0 top-0 h-screen w-60 bg-bg-surface border-r border-border-color flex flex-col">
      <div className="p-6 border-b border-border-color">
        <Link href={dashboardHref}>
          <h1 className="text-2xl font-mono font-bold text-accent-primary tracking-tight">
            KODA
          </h1>
          <p className="text-xs text-text-muted mt-1 font-mono">
            Correlated Evidence
          </p>
        </Link>
        <div className="mt-4">
          <Badge
            variant="outline"
            className="text-xs bg-bg-elevated border-accent-primary/30 text-accent-primary"
          >
            {currentRole.toUpperCase()}
          </Badge>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isDashboardItem = item.href === dashboardHref;
          const isActive = isDashboardItem
            ? isDashboardRoute
            : (pathname === item.href || pathname.startsWith(item.href + '/')) && !isDashboardRoute;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors group relative',
                isActive
                  ? 'text-accent-primary bg-bg-elevated'
                  : 'text-text-muted hover:text-text-primary hover:bg-bg-elevated/50'
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent-primary rounded-r" />
              )}
              <Icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          );
        })}

        {isAdminTeamView && (
          <>
            <Link
              href="/admin/dashboard"
              className="flex items-center px-3 py-2.5 text-xs font-semibold uppercase tracking-[0.22em] text-text-muted hover:text-text-primary rounded-md hover:bg-bg-elevated/50 transition-colors"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to admin
            </Link>

            {adminTeamNavigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors group relative',
                    isActive
                      ? 'text-accent-primary bg-bg-elevated'
                      : 'text-text-muted hover:text-text-primary hover:bg-bg-elevated/50'
                  )}
                >
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent-primary rounded-r" />
                  )}
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </>
        )}

        {currentRole === 'admin' && !isAdminTeamView && (
          <>
            <div className="my-4 border-t border-border-color" />

            {adminNavigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.match === 'prefix'
                ? pathname === item.href || pathname.startsWith(item.href + '/')
                : pathname === item.href;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors group relative',
                    isActive
                      ? 'text-accent-secondary bg-bg-elevated'
                      : 'text-text-muted hover:text-accent-secondary hover:bg-bg-elevated/50'
                  )}
                >
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent-secondary rounded-r" />
                  )}
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </>
        )}

      </nav>

      <div className="p-4 border-t border-border-color">
        <button 
          onClick={() => {
              auth.removeToken();
              window.location.href = '/login';
          }}
          className="flex items-center px-3 py-2.5 text-sm font-medium rounded-md text-text-muted hover:text-text-primary hover:bg-bg-elevated/50 transition-colors w-full"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Logout
        </button>
      </div>
    </div>
  );
}
