'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Users,
  GitPullRequest,
  ChevronLeft,
  ShieldCheck,
  Layers,
  UserCircle,
  LogOut,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { roleRedirects, type AppRole } from '@/lib/role-redirects';
import { useCurrentUser } from '@/hooks/use-current-user';
import { auth } from '@/lib/auth';

const adminNavigation = [
  { name: 'User Management', href: '/admin', icon: ShieldCheck },
  { name: 'Batch Management', href: '/admin/batches', icon: Layers, match: 'prefix' },
];

<<<<<<< Updated upstream
=======
function isAdminNavItemActive(pathname: string, href: string) {
  if (href === '/admin') {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(href + '/');
}

function toAppRole(value: string | null | undefined): AppRole {
  if (value === 'admin' || value === 'coordinator' || value === 'intern' || value === 'team_lead') {
    return value;
  }

  return 'coordinator';
}


>>>>>>> Stashed changes
export function Sidebar() {
  const pathname = usePathname();
  const { user, isLoading } = useCurrentUser();
  const [storedRole, setStoredRole] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setStoredRole(localStorage.getItem('selectedRole'));
  }, []);

  const rawRole = toAppRole(user?.role ?? storedRole ?? 'coordinator');
  const normalizedRole: AppRole = rawRole === 'team_lead' ? 'admin' : rawRole;
  const currentRole = normalizedRole;

  if (isLoading) {
    return <div className="fixed left-0 top-0 h-screen w-16 bg-bg-surface border-r border-border-color" />;
  }

  const dashboardHref = roleRedirects[currentRole] || '/login';
  const isDashboardRoute = pathname === dashboardHref || pathname.startsWith(dashboardHref + '/');
  const isIntern = currentRole === 'intern';
  const isAdmin = currentRole === 'admin';
  const adminTeamMatch = pathname.match(/^\/admin\/teams\/([^/]+)/);
  const adminTeamSlug = adminTeamMatch?.[1];
  const isAdminTeamView = isAdmin && Boolean(adminTeamSlug);
  const adminTeamBase = adminTeamSlug ? `/admin/teams/${adminTeamSlug}` : '';

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
          { name: 'Intern Management', href: '/coordinator/intern-management', icon: Users },
          { name: 'Issue Tracking', href: '/coordinator/issue-tracking-page', icon: GitPullRequest },
        ];

  const adminNavigationItems = isAdmin
    ? [{ name: 'Dashboard', href: dashboardHref, icon: LayoutDashboard, match: 'prefix' }, ...adminNavigation]
    : adminNavigation;

  const adminTeamNavigation = isAdminTeamView
    ? [
        { name: 'Dashboard', href: `${adminTeamBase}/dashboard`, icon: LayoutDashboard, match: 'prefix' },
        { name: 'Team Management', href: `${adminTeamBase}/team-management`, icon: Users, match: 'prefix' },
        { name: 'Issue Tracking', href: `${adminTeamBase}/issue-tracking`, icon: GitPullRequest, match: 'prefix' },
      ]
    : [];

  return (
    <div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "fixed left-0 top-0 h-screen bg-bg-surface border-r border-border-color flex flex-col z-50 transition-all duration-300 ease-in-out group",
        isHovered ? "w-60 shadow-2xl" : "w-16"
      )}
    >
      <div className="p-4 border-b border-border-color flex flex-col items-center overflow-hidden min-h-[110px]">
        <Link href={dashboardHref} className="flex flex-col items-center">
          <h1 className={cn(
            "font-mono font-bold text-accent-primary tracking-tight transition-all duration-300",
            isHovered ? "text-2xl" : "text-xl"
          )}>
            {isHovered ? "KODA" : "K"}
          </h1>
          <p className={cn(
            "text-[10px] text-text-muted mt-1 font-mono whitespace-nowrap transition-opacity duration-200",
            isHovered ? "opacity-100" : "opacity-0"
          )}>
            Correlated Evidence
          </p>
        </Link>
        <div className={cn("mt-4 transition-all duration-300", isHovered ? "opacity-100 scale-100" : "opacity-0 scale-75")}>
          <Badge variant="outline" className="text-[10px] bg-bg-elevated border-accent-primary/30 text-accent-primary">
            {currentRole.toUpperCase()}
          </Badge>
        </div>
      </div>

      <nav className="flex-1 p-2 space-y-1 overflow-y-auto overflow-x-hidden">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = item.href === dashboardHref ? isDashboardRoute : (pathname === item.href || pathname.startsWith(item.href + '/')) && !isDashboardRoute;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-all group relative',
                isActive ? 'text-accent-primary bg-bg-elevated' : 'text-text-muted hover:text-text-primary hover:bg-bg-elevated/50'
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className={cn(
                "ml-3 whitespace-nowrap transition-all duration-300",
                isHovered ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 pointer-events-none"
              )}>
                {item.name}
              </span>
            </Link>
          );
        })}

        {isAdminTeamView && (
          <div className="pt-2 space-y-1">
            <Link href="/admin/dashboard" className="flex items-center px-3 py-2 text-text-muted hover:text-text-primary">
              <ChevronLeft className="h-4 w-4 shrink-0" />
              {isHovered && <span className="ml-3 text-[10px] uppercase tracking-widest font-bold">Back to admin</span>}
            </Link>
            {adminTeamNavigation.map((item) => (
              <Link key={item.name} href={item.href} className={cn('flex items-center px-3 py-2.5 rounded-md transition-all', pathname.startsWith(item.href) ? 'text-accent-primary bg-bg-elevated' : 'text-text-muted hover:text-text-primary')}>
                <item.icon className="h-5 w-5 shrink-0" />
                {isHovered && <span className="ml-3 text-sm">{item.name}</span>}
              </Link>
            ))}
          </div>
        )}

        {currentRole === 'admin' && !isAdminTeamView && (
          <div className="pt-4 mt-4 border-t border-border-color space-y-1">
            {adminNavigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.match === 'prefix' ? pathname.startsWith(item.href) : pathname === item.href;
              return (
                <Link key={item.name} href={item.href} className={cn('flex items-center px-3 py-2.5 rounded-md transition-all', isActive ? 'text-accent-secondary bg-bg-elevated' : 'text-text-muted hover:text-accent-secondary')}>
                  <Icon className="h-5 w-5 shrink-0" />
                  {isHovered && <span className="ml-3 text-sm">{item.name}</span>}
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      <div className="p-3 border-t border-border-color">
        <button 
          onClick={() => { auth.removeToken(); window.location.href = '/login'; }}
          className="flex items-center px-3 py-2.5 text-sm font-medium rounded-md text-text-muted hover:text-red-500 hover:bg-red-500/10 transition-all w-full"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <span className={cn(
            "ml-3 transition-all duration-300 whitespace-nowrap",
            isHovered ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
          )}>
            Logout
          </span>
        </button>
      </div>
    </div>
  );
}