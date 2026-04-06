'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { roleToUserMap } from '@/lib/mock-data';

export function Header() {
  const [currentUser, setCurrentUser] = useState(roleToUserMap.coordinator);

  useEffect(() => {
    const selectedRole = localStorage.getItem('selectedRole') || 'coordinator';
    const user = roleToUserMap[selectedRole as keyof typeof roleToUserMap] || roleToUserMap.coordinator;
    setCurrentUser(user);
  }, []);

  return (
    <header className="fixed top-0 right-0 left-60 h-14 bg-bg-surface border-b border-border-color z-10">
      <div className="h-full px-6 flex items-center justify-end">
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm font-medium text-text-primary">
              {currentUser.name}
            </div>
            <Badge
              variant="outline"
              className="text-xs bg-transparent border-accent-primary/30 text-accent-primary mt-0.5"
            >
              {currentUser.role}
            </Badge>
          </div>
          <Avatar className="h-9 w-9 bg-bg-elevated border border-border-color">
            <AvatarFallback className="bg-accent-primary/10 text-accent-primary font-mono font-semibold">
              {currentUser.avatarInitials}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
