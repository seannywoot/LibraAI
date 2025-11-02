"use client";

import { useState } from "react";
import DashboardSidebar from "@/components/dashboard-sidebar";
import { getStudentLinks } from "@/components/navLinks";
import SignOutButton from "@/components/sign-out-button";

export default function StudentSettingsPage() {
  const [focusMode, setFocusMode] = useState(false);
  const [readingGoals, setReadingGoals] = useState(true);
  const [syncCalendar, setSyncCalendar] = useState(false);
  const [summaryLength, setSummaryLength] = useState("concise");
  const [saved, setSaved] = useState(false);

  const navigationLinks = getStudentLinks();

  const handleSubmit = (event) => {
    event.preventDefault();
    setSaved(true);
    const timer = setTimeout(() => setSaved(false), 2000);
    return () => clearTimeout(timer);
  };

  return (
    <div className="min-h-screen bg-(--bg-1) pr-6 pl-[300px] py-8 text-(--text)">
      <DashboardSidebar heading="LibraAI" links={navigationLinks} variant="light" SignOutComponent={SignOutButton} />

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
