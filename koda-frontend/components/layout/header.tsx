'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useMemo } from 'react';
import { useCurrentUser } from '@/hooks/use-current-user';

export function Header() {
  const { user } = useCurrentUser();

  const displayName = user?.name || user?.github_username || 'User';
  const roleLabel = (user?.role ?? 'coordinator').replace('_', ' ').toUpperCase();
  const initials = useMemo(() => {
    if (!displayName) return 'U';
    const parts = displayName.trim().split(/\s+/);
    const first = parts[0]?.[0] ?? '';
    const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : '';
    return (first + last || displayName[0] || 'U').toUpperCase();
  }, [displayName]);

  return (
    <header className="fixed top-0 right-0 left-16 peer-hover:left-60 h-14 bg-bg-surface border-b border-border-color z-10 transition-[left] duration-300 ease-in-out">
      <div className="h-full px-6 flex items-center justify-end">
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm font-medium text-text-primary">
              {displayName}
            </div>
            <Badge
              variant="outline"
              className="text-xs bg-transparent border-accent-primary/30 text-accent-primary mt-0.5"
            >
              {roleLabel}
            </Badge>
          </div>
          <Avatar className="h-9 w-9 bg-bg-elevated border border-border-color">
            <AvatarFallback className="bg-accent-primary/10 text-accent-primary font-mono font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
