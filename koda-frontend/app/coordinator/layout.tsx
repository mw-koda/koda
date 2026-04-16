'use client';

import { RouteGuard } from '@/components/route-guard';
import { flowAccess } from '@/lib/route-access';

export default function CoordinatorLayout({ children }: { children: React.ReactNode }) {
  return <RouteGuard allowedRoles={flowAccess.coordinator}>{children}</RouteGuard>;
}
