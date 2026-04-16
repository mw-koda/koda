'use client';

import { RouteGuard } from '@/components/route-guard';
import { flowAccess } from '@/lib/route-access';

export default function InternsLayout({ children }: { children: React.ReactNode }) {
  return <RouteGuard allowedRoles={flowAccess.intern}>{children}</RouteGuard>;
}
