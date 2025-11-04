"use client";

import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import { updateLastActivity, getTimeUntilIdleLogout } from "@/lib/session-handler";

export default function IdleTimeoutWarning({ show, onExtend }) {
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    if (show) {
      const interval = setInterval(() => {
        const remaining = getTimeUntilIdleLogout();
        setTimeRemaining(Math.ceil(remaining / 1000));
        
        if (remaining <= 0) {
          clearInterval(interval);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [show]);

  const handleExtend = () => {
    updateLastActivity();
    onExtend();
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/auth" });
  };

  if (!show) return null;

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
            <svg
              className="h-6 w-6 text-amber-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-zinc-900">
              Session Timeout Warning
            </h3>
            <p className="text-sm text-zinc-600">
              You&apos;ve been inactive for a while
            </p>
          </div>
        </div>

        <div className="mb-6 rounded-lg bg-amber-50 p-4">
          <p className="text-sm text-zinc-700">
            Your session will expire in{" "}
            <span className="font-mono font-semibold text-amber-700">
              {minutes}:{seconds.toString().padStart(2, "0")}
            </span>
          </p>
          <p className="mt-2 text-xs text-zinc-600">
            Click &quot;Stay Logged In&quot; to continue your session, or you&apos;ll be
            automatically logged out for security.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleLogout}
            className="flex-1 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
          >
            Log Out Now
          </button>
          <button
            onClick={handleExtend}
            className="flex-1 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800"
          >
            Stay Logged In
          </button>
        </div>
      </div>
    </div>
  );
}
