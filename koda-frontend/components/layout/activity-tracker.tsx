'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { auth } from '@/lib/auth';

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

export function ActivityTracker() {
  const pathname = usePathname();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (auth.isAuthenticated()) {
      timeoutRef.current = setTimeout(() => {
        console.log('Inactivity detected. Logging out...');
        auth.logoutAndRedirect();
      }, INACTIVITY_TIMEOUT);
    }
  };

  useEffect(() => {
    // Events to track user activity
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];

    const handleActivity = () => resetTimer();

    // Set up listeners
    events.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    // Initial timer set
    resetTimer();

    return () => {
      // Clean up listeners
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [pathname]); // Reset when route changes

  return null; // This component doesn't render anything
}
