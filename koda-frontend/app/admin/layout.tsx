'use client';

import { RouteGuard } from '@/components/route-guard';
import { flowAccess } from '@/lib/route-access';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <RouteGuard allowedRoles={flowAccess.admin}>{children}</RouteGuard>;
}
