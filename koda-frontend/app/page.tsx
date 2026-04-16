'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { roleRedirects } from '@/lib/role-redirects';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if user has selected a role (logged in)
    const selectedRole = typeof window !== 'undefined' && localStorage.getItem('selectedRole');
    
    if (selectedRole) {
      const normalizedRole = selectedRole === 'team_lead' ? 'admin' : selectedRole;
      // User is logged in, redirect to role-specific dashboard
      if (normalizedRole in roleRedirects) {
        router.push(roleRedirects[normalizedRole as keyof typeof roleRedirects]);
      } else {
        router.push('/login');
      }
    } else {
      // User is not logged in, redirect to login
      router.push('/login');
    }
  }, [router]);

  return null;
}
