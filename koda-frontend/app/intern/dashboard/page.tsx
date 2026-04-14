'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function InternDashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/interns/dashboard');
  }, [router]);

  return null;
}
