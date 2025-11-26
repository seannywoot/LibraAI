"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useTheme } from "@/contexts/ThemeContext";

function useForceLightTheme() {
  const { setDarkModePreference, darkMode } = useTheme();
  const initialDarkMode = useRef(darkMode);

  useEffect(() => {
    if (typeof document === "undefined") {
      return undefined;
    }

    const root = document.documentElement;
    const hadDarkClass = root.classList.contains("dark");
    const initialDatasetTheme = root.dataset.theme === "dark" ? "dark" : "light";
    const initialDarkPreference = initialDarkMode.current;
    // Force the auth route to render with the light theme while preserving the original preference for later pages.

    if (initialDatasetTheme !== "light" || hadDarkClass || initialDarkPreference) {
      setDarkModePreference(false, { persist: false });
    }

    return () => {
      const restoreDark = initialDarkPreference || initialDatasetTheme === "dark" || hadDarkClass;
      setDarkModePreference(restoreDark, { persist: false });
    };
  }, [setDarkModePreference]);
}

export default function ForgotPasswordPage() {
  useForceLightTheme();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      await fetch("/api/auth/password-reset/request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSubmitted(true);
    } catch (err) {
      // Intentionally ignore errors to avoid leaking information
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-100 px-6 py-12 text-zinc-900">
      <div className="w-full max-w-lg rounded-3xl border border-zinc-200 bg-white p-8 shadow-2xl shadow-zinc-900/10">
        <h1 className="text-2xl font-semibold">Forgot your password?</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Enter the email address associated with your account, and we&apos;ll send you a link to reset your password.
        </p>

        {submitted ? (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            If an account exists for <span className="font-medium">{email}</span>, you&apos;ll receive an email with a reset link shortly.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-zinc-700">
                Email address
              </label>
              <input
                id="email"
                type="email"
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
                placeholder="you@school.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-700"
            >
              {loading ? "Sending..." : "Send reset link"}
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-sm">
          <Link className="text-zinc-900 hover:text-zinc-700 font-medium" href="/auth">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
