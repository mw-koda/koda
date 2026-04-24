'use client';

import { RouteGuard } from '@/components/route-guard';
import { flowAccess } from '@/lib/route-access';

export default function InternsLayout({ children }: { children: React.ReactNode }) {
  // Allow all staff roles to view intern pages (e.g. profiles)
  const allowedRoles = [...flowAccess.intern, ...flowAccess.coordinator];
  return <RouteGuard allowedRoles={allowedRoles}>{children}</RouteGuard>;
}
