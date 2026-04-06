'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  GitPullRequest,
  ShieldCheck,
  LogOut,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { roleRedirects, type UserRole } from '@/lib/mock-data';
import { useState, useEffect } from 'react';

const adminNavigation = [
  { name: 'User Management', href: '/admin', icon: ShieldCheck },
];


export function Sidebar() {
  const pathname = usePathname();
  const [currentRole, setCurrentRole] = useState<string>('coordinator');

  useEffect(() => {
    const selectedRole = localStorage.getItem('selectedRole') || 'coordinator';
    setCurrentRole(selectedRole);
  }, []);

  const dashboardHref = roleRedirects[currentRole as UserRole] || '/login';
  const isDashboardRoute = pathname === dashboardHref || pathname.startsWith(dashboardHref + '/');

  const navigation = [
    { name: 'Dashboard', href: dashboardHref, icon: LayoutDashboard },
    { name: 'Intern Management', href: '/interns', icon: Users },
    { name: 'Reports & Performance', href: '/reports', icon: ClipboardList },
    { name: 'Issue Tracking', href: '/issues', icon: GitPullRequest },
  ];

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

        <div className="my-4 border-t border-border-color" />

        {adminNavigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

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

      </nav>

      <div className="p-4 border-t border-border-color">
        <button 
          onClick={() => {
            localStorage.removeItem('selectedRole');
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
