import type { AppRole } from '@/lib/role-redirects';

export type FlowKey = 'admin' | 'coordinator' | 'intern';

export const flowAccess: Record<FlowKey, AppRole[]> = {
  admin: ['admin', 'team_lead'],
  coordinator: ['coordinator'],
  intern: ['intern'],
};
