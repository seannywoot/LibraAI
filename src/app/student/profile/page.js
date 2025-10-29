"use client";

import { useState } from "react";
import DashboardSidebar from "@/components/dashboard-sidebar";
import SignOutButton from "@/components/sign-out-button";

export default function StudentProfilePage() {
  const [name, setName] = useState("Study Explorer");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [studyReminders, setStudyReminders] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [saved, setSaved] = useState(false);

  const navigationLinks = [
    { key: "student-dashboard", label: "Dashboard", href: "/student/dashboard", exact: true },
    { key: "student-profile", label: "Profile", href: "/student/profile", exact: true },
    { key: "student-settings", label: "Settings", href: "/student/settings", exact: true },
  ];

  const handleSubmit = (event) => {
    event.preventDefault();
    setSaved(true);
    const timer = setTimeout(() => setSaved(false), 2000);
    return () => clearTimeout(timer);
  };

  return (
    <div className="min-h-screen bg-zinc-100 px-6 py-12 text-zinc-900">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 lg:flex-row">
        <DashboardSidebar
          heading="Personal Settings"
          tagline="Student"
          links={navigationLinks}
          variant="student"
          footer="Keep your study preferences tuned for the semester."
          SignOutComponent={SignOutButton}
        />

        <main className="flex-1 space-y-8 rounded-3xl border border-zinc-200 bg-white p-10 shadow-2xl shadow-zinc-900/5">
          <header className="space-y-3 border-b border-zinc-200 pb-6">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-zinc-500">Student</p>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight">Profile & Settings</h1>
              <p className="text-sm text-zinc-600">Update your name and personalize your study experience.</p>
            </div>
          </header>

          <form onSubmit={handleSubmit} className="grid gap-8">
            <section className="space-y-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
              <h2 className="text-base font-semibold text-zinc-900">Profile</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm">
                  <span className="text-zinc-700">Full name</span>
                  <input
                    className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                  />
                </label>
                <label className="grid gap-2 text-sm">
                  <span className="text-zinc-700">Role</span>
                  <input
                    className="rounded-xl border border-zinc-200 bg-zinc-100 px-4 py-3 text-zinc-500"
                    type="text"
                    value="Student"
                    readOnly
                  />
                </label>
              </div>
            </section>

            <section id="settings" className="space-y-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
              <h2 className="text-base font-semibold text-zinc-900">Settings</h2>
              <div className="space-y-3 text-sm text-zinc-700">
                <label className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white px-4 py-3">
                  <span>Email notifications</span>
                  <input
                    type="checkbox"
                    checked={emailNotifications}
                    onChange={(e) => setEmailNotifications(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-300 text-zinc-900"
                  />
                </label>
                <label className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white px-4 py-3">
                  <span>Study reminders</span>
                  <input
                    type="checkbox"
                    checked={studyReminders}
                    onChange={(e) => setStudyReminders(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-300 text-zinc-900"
                  />
                </label>
                <label className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white px-4 py-3">
                  <span>Dark mode preference</span>
                  <input
                    type="checkbox"
                    checked={darkMode}
                    onChange={(e) => setDarkMode(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-300 text-zinc-900"
                  />
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
    </div>
  );
}
