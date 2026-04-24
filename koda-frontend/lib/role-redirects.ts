export type AppRole = 'admin' | 'coordinator' | 'intern' | 'team_lead';

export const roleRedirects: Record<AppRole, string> = {
  intern: '/intern/dashboard',
  coordinator: '/coordinator/dashboard',
  admin: '/admin/dashboard',
  team_lead: '/admin/dashboard',
};
