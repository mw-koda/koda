'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { ActivityTracker } from './activity-tracker';

export function LayoutWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  
  // Hide sidebar and header on auth/login routes
  const isAuthRoute = pathname?.startsWith('/login') || pathname?.startsWith('/auth');

  if (isAuthRoute) {
    return (
      <>
        <ActivityTracker />
        {children}
      </>
    );
  }

  return (
    <>
      <ActivityTracker />
      <Sidebar />
      <Header />
      <main className="ml-16 peer-hover:ml-60 mt-14 min-h-screen transition-[margin-left] duration-300 ease-in-out">
        {children}
      </main>
    </>
  );
}
