export type AppRole = 'admin' | 'coordinator' | 'intern' | 'team_lead';

export const roleRedirects: Record<AppRole, string> = {
  intern: '/interns/dashboard',
  coordinator: '/coordinator/dashboard',
  admin: '/admin/dashboard',
  team_lead: '/coordinator/dashboard',
};
