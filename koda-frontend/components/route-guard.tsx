'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { auth } from '@/lib/auth';
import type { AppRole } from '@/lib/role-redirects';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

type RouteGuardProps = {
  allowedRoles: AppRole[];
  children: React.ReactNode;
};

type AuthResponse = {
  user: {
    role: AppRole;
  };
};

export function RouteGuard({ allowedRoles, children }: RouteGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let isActive = true;

    const logoutAndRedirect = () => {
      auth.clearSession();
      router.replace('/login');
    };

    const verifyAccess = async () => {
      setIsChecking(true);

      const token = auth.getToken();
      if (!token) {
        logoutAndRedirect();
        return;
      }

      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          headers: auth.headers(),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user');
        }

        const data = (await response.json()) as AuthResponse;
        const role = data.user?.role;

        if (!role || !allowedRoles.includes(role)) {
          logoutAndRedirect();
          return;
        }

        if (isActive) {
          setIsAuthorized(true);
        }
      } catch {
        logoutAndRedirect();
      } finally {
        if (isActive) {
          setIsChecking(false);
        }
      }
    };

    void verifyAccess();

    return () => {
      isActive = false;
    };
  }, [allowedRoles, pathname, router]);

  if (isChecking || !isAuthorized) {
    return null;
  }

  return <>{children}</>;
}
