'use client';

import { SessionProvider } from 'next-auth/react';
import { signOut, useSession } from 'next-auth/react';
import { ReactNode, useEffect, useRef, useState } from 'react';

const IDLE_TIMEOUT_MS = 60 * 60 * 1000;
const IDLE_WARNING_MS = 10 * 60 * 1000;
const SESSION_CHECK_INTERVAL_MS = 30 * 1000;
const HEARTBEAT_INTERVAL_MS = 60 * 1000;

function IdleSessionHandler() {
  const { status, data: session } = useSession();
  const timeoutRef = useRef<number | null>(null);
  const warningRef = useRef<number | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [warningSecondsLeft, setWarningSecondsLeft] = useState(0);

  const playWarningSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

      if (!AudioContextClass) {
        return;
      }

      const audioContext = new AudioContextClass();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.value = 880;
      gainNode.gain.value = 0.0001;

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      const startedAt = audioContext.currentTime;
      gainNode.gain.exponentialRampToValueAtTime(0.2, startedAt + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startedAt + 1.2);

      oscillator.start(startedAt);
      oscillator.stop(startedAt + 1.2);

      oscillator.onended = () => {
        void audioContext.close();
      };
    } catch {
      // Si el navegador bloquea el audio, el aviso visual sigue funcionando.
    }
  };

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

      if (warningRef.current) {
        window.clearTimeout(warningRef.current);
        warningRef.current = null;
      }
    };

    const logoutIfIdle = async () => {
      clearExistingTimer();
      await signOut({ redirect: true, callbackUrl: '/login' });
    };

    const openWarning = () => {
      const warningStart = IDLE_TIMEOUT_MS - IDLE_WARNING_MS;
      const warningElapsed = Math.max(0, Date.now() - Number(localStorage.getItem(storageKey) || Date.now()));
      const remainingMs = Math.max(0, IDLE_TIMEOUT_MS - warningElapsed);

      setShowWarning(true);
      setWarningSecondsLeft(Math.ceil(remainingMs / 1000));
      playWarningSound();

      warningRef.current = window.setTimeout(() => {
        void logoutIfIdle();
      }, Math.max(0, IDLE_TIMEOUT_MS - warningStart - warningElapsed));
    };

    const scheduleIdleCheck = () => {
      clearExistingTimer();
      setShowWarning(false);

      const lastActivity = Number(localStorage.getItem(storageKey) || Date.now());
      const elapsed = Date.now() - lastActivity;

      if (elapsed >= IDLE_TIMEOUT_MS) {
        void logoutIfIdle();
        return;
      }

      if (elapsed >= IDLE_TIMEOUT_MS - IDLE_WARNING_MS) {
        openWarning();
        return;
      }

      timeoutRef.current = window.setTimeout(() => {
        openWarning();
      }, IDLE_TIMEOUT_MS - IDLE_WARNING_MS - elapsed);
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

    const countdownInterval = window.setInterval(() => {
      if (!showWarning) {
        return;
      }

      const lastActivity = Number(localStorage.getItem(storageKey) || Date.now());
      const remainingMs = Math.max(0, IDLE_TIMEOUT_MS - (Date.now() - lastActivity));
      setWarningSecondsLeft(Math.ceil(remainingMs / 1000));

      if (remainingMs <= 0) {
        void logoutIfIdle();
      }
    }, 1000);

    return () => {
      clearExistingTimer();
      window.clearInterval(countdownInterval);
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, markActivity));
    };
  }, [session?.user?.email, status, showWarning]);

  return showWarning ? (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-amber-300 bg-white p-6 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-2xl">
            ⏳
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">Sesión por cerrar</p>
            <h2 className="text-xl font-bold text-slate-900">Tu sesión está por expirar</h2>
          </div>
        </div>

        <p className="mt-4 text-sm leading-6 text-slate-600">
          Detectamos inactividad. Si no haces nada, la sesión se cerrará automáticamente en {Math.max(0, Math.ceil(warningSecondsLeft / 60))} minuto{warningSecondsLeft >= 120 ? 's' : ''}.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => {
              localStorage.setItem(`lastActivity:${session?.user?.email}`, String(Date.now()));
              setShowWarning(false);
            }}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
          >
            Seguir conectado
          </button>
          <button
            type="button"
            onClick={() => {
              void signOut({ redirect: true, callbackUrl: '/login' });
            }}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            Cerrar sesión ahora
          </button>
        </div>
      </div>
    </div>
  ) : null;
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

function OnlineHeartbeatHandler() {
  const { status } = useSession();

  useEffect(() => {
    if (status !== 'authenticated') {
      return;
    }

    const sendHeartbeat = async () => {
      try {
        await fetch('/api/auth/heartbeat', {
          method: 'POST',
          credentials: 'same-origin',
          cache: 'no-store'
        });
      } catch {
        // Ignorar errores transitorios de red.
      }
    };

    void sendHeartbeat();

    const intervalId = window.setInterval(() => {
      void sendHeartbeat();
    }, HEARTBEAT_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void sendHeartbeat();
      }
    };

    window.addEventListener('focus', handleVisibilityChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleVisibilityChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [status]);

  return null;
}

export default function SessionProviderWrapper({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <IdleSessionHandler />
      <SingleSessionHandler />
      <OnlineHeartbeatHandler />
      {children}
    </SessionProvider>
  );
}
