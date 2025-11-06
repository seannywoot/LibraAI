"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState, useCallback, useRef } from "react";
import {
  clearSessionStorage,
  markSessionStart,
  isSessionExpired,
  updateLastActivity,
  isIdle,
  shouldShowIdleWarning,
} from "@/lib/session-handler";
import IdleTimeoutWarning from "./idle-timeout-warning";
import { useTheme } from "@/contexts/ThemeContext";

function SessionValidator({ children }) {
  const { data: session, status } = useSession();
  const [showIdleWarning, setShowIdleWarning] = useState(false);
  const { setDarkModePreference } = useTheme();
  const themeSyncStateRef = useRef(null);

  // Track user activity
  const handleActivity = useCallback(() => {
    if (status === "authenticated") {
      updateLastActivity();
      setShowIdleWarning(false);
    }
  }, [status]);

  useEffect(() => {
    if (status === "authenticated") {
      // Mark session start on first authentication
      markSessionStart();

      // Activity events to track
      const events = [
        "mousedown",
        "mousemove",
        "keypress",
        "scroll",
        "touchstart",
        "click",
      ];

      // Throttle activity updates to avoid excessive writes
      let activityTimeout;
      const throttledActivity = () => {
        if (!activityTimeout) {
          activityTimeout = setTimeout(() => {
            handleActivity();
            activityTimeout = null;
          }, 1000); // Update at most once per second
        }
      };

      // Add event listeners
      events.forEach((event) => {
        window.addEventListener(event, throttledActivity, { passive: true });
      });

      // Check session validity and idle status periodically (every 30 seconds)
      // Add a delay before first check to allow session to fully establish
      const interval = setInterval(() => {
        // Check if session has expired (24 hours)
        if (isSessionExpired()) {
          clearSessionStorage();
          signOut({ callbackUrl: "/auth?reason=expired" });
          return;
        }

        // Check if user has been idle too long
        if (isIdle()) {
          clearSessionStorage();
          signOut({ callbackUrl: "/auth?reason=idle" });
          return;
        }

        // Show warning if approaching idle timeout
        if (shouldShowIdleWarning()) {
          setShowIdleWarning(true);
        }
      }, 30 * 1000);

      return () => {
        clearInterval(interval);
        if (activityTimeout) clearTimeout(activityTimeout);
        events.forEach((event) => {
          window.removeEventListener(event, throttledActivity);
        });
      };
    }
  }, [status, handleActivity]);

  useEffect(() => {
    // Clear session storage on sign out
    if (status === "unauthenticated") {
      clearSessionStorage();
    }
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated") {
      themeSyncStateRef.current = null;
      return;
    }

    const theme = session?.user?.theme;
    if (theme === "dark" || theme === "light") {
      themeSyncStateRef.current = theme;
      setDarkModePreference(theme === "dark", { persist: true });
      return;
    }

    if (themeSyncStateRef.current === "fetching" || themeSyncStateRef.current === "synced") {
      return;
    }

    themeSyncStateRef.current = "fetching";
    let cancelled = false;

    const fetchThemePreference = async () => {
      try {
        const res = await fetch("/api/user/profile", { method: "GET" });
        const data = await res.json().catch(() => ({}));
        const fetchedTheme = data?.user?.theme;
        if (!cancelled && (fetchedTheme === "dark" || fetchedTheme === "light")) {
          themeSyncStateRef.current = fetchedTheme;
          setDarkModePreference(fetchedTheme === "dark", { persist: true });
        } else if (!cancelled) {
          themeSyncStateRef.current = "synced";
        }
      } catch (err) {
        if (!cancelled) {
          themeSyncStateRef.current = "synced";
          console.warn("Theme sync failed:", err);
        }
      }
    };

    fetchThemePreference();

    return () => {
      cancelled = true;
      if (themeSyncStateRef.current === "fetching") {
        themeSyncStateRef.current = null;
      }
    };
  }, [status, session?.user?.theme, setDarkModePreference]);

  const handleExtendSession = () => {
    setShowIdleWarning(false);
    updateLastActivity();
  };

  return (
    <>
      {children}
      <IdleTimeoutWarning
        show={showIdleWarning}
        onExtend={handleExtendSession}
      />
    </>
  );
}

export function SessionProvider({ children, session }) {
  return (
    <NextAuthSessionProvider session={session} refetchInterval={5 * 60}>
      <SessionValidator>{children}</SessionValidator>
    </NextAuthSessionProvider>
  );
}
