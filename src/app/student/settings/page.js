"use client";

import { useState } from "react";
import DashboardSidebar from "@/components/dashboard-sidebar";
import SignOutButton from "@/components/sign-out-button";

export default function StudentSettingsPage() {
  const [focusMode, setFocusMode] = useState(false);
  const [readingGoals, setReadingGoals] = useState(true);
  const [syncCalendar, setSyncCalendar] = useState(false);
  const [summaryLength, setSummaryLength] = useState("concise");
  const [saved, setSaved] = useState(false);

  const navigationLinks = [
    {
      key: "student-dashboard",
      label: "Dashboard",
      href: "/student/dashboard",
      exact: true,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h5v-5h4v5h5V9.5"/></svg>
      ),
    },
    {
      key: "student-profile",
      label: "Profile",
      href: "/student/profile",
      exact: true,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4"><path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z"/><path d="M3 21a9 9 0 0 1 18 0"/></svg>
      ),
    },
    {
      key: "student-settings",
      label: "Settings",
      href: "/student/settings",
      exact: true,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4"><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/><path d="M19.4 15a1.8 1.8 0 0 0 .36 1.98l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.8 1.8 0 0 0-1.98-.36 1.8 1.8 0 0 0-1.06 1.64V21a2 2 0 1 1-4 0v-.08a1.8 1.8 0 0 0-1.06-1.64 1.8 1.8 0 0 0-1.98.36l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.8 1.8 0 0 0 5 15.4a1.8 1.8 0 0 0-1.64-1.06H3a2 2 0 1 1 0-4h.08A1.8 1.8 0 0 0 4.72 8.2a1.8 1.8 0 0 0-.36-1.98l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.8 1.8 0 0 0 9.17 3c.72 0 1.37-.43 1.64-1.06V2a2 2 0 1 1 4 0v.08c.27.63.92 1.06 1.64 1.06.54 0 1.06-.22 1.44-.59l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06c-.37.37-.59.9-.59 1.44 0 .72.43 1.37 1.06 1.64H22a2 2 0 1 1 0 4h-.08c-.63.27-1.06.92-1.06 1.64Z"/></svg>
      ),
    },
  ];

  const handleSubmit = (event) => {
    event.preventDefault();
    setSaved(true);
    const timer = setTimeout(() => setSaved(false), 2000);
    return () => clearTimeout(timer);
  };

  return (
    <div className="min-h-screen bg-(--bg-1) pr-6 pl-[300px] py-8 text-(--text)">
      <DashboardSidebar
        heading="Study Controls"
        tagline="Student"
        links={navigationLinks}
        variant="light"
        footer="Dial in how LibraAI supports your coursework this term."
        SignOutComponent={SignOutButton}
      />

      <main className="space-y-8 rounded-3xl border border-(--stroke) bg-white p-10 shadow-[0_2px_20px_rgba(0,0,0,0.03)]">
          <header className="space-y-3 border-b border-zinc-200 pb-6">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-zinc-500">Student</p>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
              <p className="text-sm text-zinc-600">Choose how the assistant helps you stay organized and motivated.</p>
            </div>
          </header>

          <form onSubmit={handleSubmit} className="grid gap-8">
            <section className="space-y-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
              <h2 className="text-base font-semibold text-zinc-900">Focus & Productivity</h2>
              <div className="space-y-3 text-sm text-zinc-700">
                <label className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white px-4 py-3">
                  <span>Enable focus mode timer</span>
                  <input
                    type="checkbox"
                    checked={focusMode}
                    onChange={(event) => setFocusMode(event.target.checked)}
                    className="h-4 w-4 rounded border-zinc-300 text-zinc-900"
                  />
                </label>
                <label className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white px-4 py-3">
                  <span>Track weekly reading goals</span>
                  <input
                    type="checkbox"
                    checked={readingGoals}
                    onChange={(event) => setReadingGoals(event.target.checked)}
                    className="h-4 w-4 rounded border-zinc-300 text-zinc-900"
                  />
                </label>
                <label className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white px-4 py-3">
                  <span>Sync due dates to calendar</span>
                  <input
                    type="checkbox"
                    checked={syncCalendar}
                    onChange={(event) => setSyncCalendar(event.target.checked)}
                    className="h-4 w-4 rounded border-zinc-300 text-zinc-900"
                  />
                </label>
              </div>
            </section>

            <section className="space-y-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
              <h2 className="text-base font-semibold text-zinc-900">AI Output</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm">
                  <span className="text-zinc-700">Summary detail level</span>
                  <select
                    value={summaryLength}
                    onChange={(event) => setSummaryLength(event.target.value)}
                    className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
                  >
                    <option value="concise">Concise (3 bullets)</option>
                    <option value="standard">Standard (5 bullets)</option>
                    <option value="in-depth">In-depth review</option>
                  </select>
                </label>
              </div>
            </section>

            <div className="flex items-center justify-end gap-3">
              {saved && <span className="text-xs text-emerald-500">Saved</span>}
              <button
                type="submit"
                className="rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-100"
              >
                Save changes
              </button>
            </div>
          </form>
      </main>
    </div>
  );
}
