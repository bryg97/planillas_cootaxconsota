'use client';

import { SessionProvider } from 'next-auth/react';
import { signOut, useSession } from 'next-auth/react';
import { ReactNode, useEffect, useRef } from 'react';

const IDLE_TIMEOUT_MS = 6 * 60 * 60 * 1000;
const SESSION_CHECK_INTERVAL_MS = 30 * 1000;

function IdleSessionHandler() {
  const { status, data: session } = useSession();
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.email) {
      return;
    }

    const storageKey = `lastActivity:${session.user.email}`;

    const clearExistingTimer = () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    const logoutIfIdle = async () => {
      clearExistingTimer();
      await signOut({ redirect: true, callbackUrl: '/login' });
    };

    const scheduleIdleCheck = () => {
      clearExistingTimer();

      const lastActivity = Number(localStorage.getItem(storageKey) || Date.now());
      const elapsed = Date.now() - lastActivity;

      if (elapsed >= IDLE_TIMEOUT_MS) {
        void logoutIfIdle();
        return;
      }

      timeoutRef.current = window.setTimeout(() => {
        void logoutIfIdle();
      }, IDLE_TIMEOUT_MS - elapsed);
    };

    const markActivity = () => {
      localStorage.setItem(storageKey, String(Date.now()));
      scheduleIdleCheck();
    };

    const activityEvents = ['click', 'keydown', 'mousemove', 'scroll', 'touchstart'];

    const storedActivity = localStorage.getItem(storageKey);
    if (!storedActivity) {
      localStorage.setItem(storageKey, String(Date.now()));
    }

    scheduleIdleCheck();
    activityEvents.forEach((eventName) => window.addEventListener(eventName, markActivity, { passive: true }));

    return () => {
      clearExistingTimer();
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, markActivity));
    };
  }, [session?.user?.email, status]);

  return null;
}

function SingleSessionHandler() {
  const { status, data: session } = useSession();

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.email) {
      return;
    }

    const storageKey = `activeSessionVersion:${session.user.email}`;
    const currentSessionVersion = session.user.sessionVersion || '';
    let cancelled = false;

    const clearAndSignOut = async () => {
      if (cancelled) {
        return;
      }

      cancelled = true;
      await signOut({ redirect: true, callbackUrl: '/login' });
    };

    const syncCurrentSession = () => {
      localStorage.setItem(storageKey, currentSessionVersion);
    };

    const checkStoredVersion = () => {
      const storedVersion = localStorage.getItem(storageKey);
      if (storedVersion && storedVersion !== currentSessionVersion) {
        void clearAndSignOut();
      }
    };

    const validateWithServer = async () => {
      try {
        const response = await fetch('/api/auth/session-check', {
          cache: 'no-store',
          credentials: 'same-origin'
        });

        if (!response.ok) {
          await clearAndSignOut();
        }
      } catch {
        await clearAndSignOut();
      }
    };

    syncCurrentSession();
    checkStoredVersion();
    void validateWithServer();

    const intervalId = window.setInterval(() => {
      void validateWithServer();
    }, SESSION_CHECK_INTERVAL_MS);

    const handleStorage = (event: StorageEvent) => {
      if (event.key === storageKey && event.newValue && event.newValue !== currentSessionVersion) {
        void clearAndSignOut();
      }
    };

    window.addEventListener('storage', handleStorage);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener('storage', handleStorage);
    };
  }, [session?.user?.email, session?.user?.sessionVersion, status]);

  return null;
}

export default function SessionProviderWrapper({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <IdleSessionHandler />
      <SingleSessionHandler />
      {children}
    </SessionProvider>
  );
}
