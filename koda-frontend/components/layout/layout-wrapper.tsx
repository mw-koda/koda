'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './sidebar';
import { Header } from './header';

export function LayoutWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  
  // Hide sidebar and header on auth/login routes
  const isAuthRoute = pathname?.startsWith('/login') || pathname?.startsWith('/auth');

  if (isAuthRoute) {
    return <>{children}</>;
  }

  return (
    <>
      <Sidebar />
      <Header />
      <main className="ml-60 mt-14 min-h-screen">
        {children}
      </main>
    </>
  );
}
