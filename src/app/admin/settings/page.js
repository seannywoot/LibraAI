"use client";

import { useState } from "react";
import DashboardSidebar from "@/components/dashboard-sidebar";
import SignOutButton from "@/components/sign-out-button";

export default function AdminSettingsPage() {
  const [autoApproveRequests, setAutoApproveRequests] = useState(false);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [backupFrequency, setBackupFrequency] = useState("weekly");
  const [maintenanceWindow, setMaintenanceWindow] = useState("sunday");
  const [saved, setSaved] = useState(false);

  const navigationLinks = [
    { key: "admin-dashboard", label: "Dashboard", href: "/admin/dashboard", exact: true },
    { key: "admin-books", label: "Books", href: "/admin/books", exact: true },
    { key: "admin-add-book", label: "Add Book", href: "/admin/books/add", exact: true },
    { key: "admin-authors", label: "Authors", href: "/admin/authors", exact: true },
    { key: "admin-shelves", label: "Shelves", href: "/admin/shelves", exact: true },
    { key: "admin-profile", label: "Profile", href: "/admin/profile", exact: true },
    { key: "admin-settings", label: "Settings", href: "/admin/settings", exact: true },
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
        heading="Workspace Settings"
        tagline="Admin"
        links={navigationLinks}
        variant="light"
        footer="Tune automation, backups, and maintenance policies for the library stack."
        SignOutComponent={SignOutButton}
      />

      <main className="space-y-8 rounded-3xl border border-(--stroke) bg-white p-10 shadow-[0_2px_20px_rgba(0,0,0,0.03)]">
        <header className="space-y-3 border-b border-(--stroke) pb-6">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-zinc-500">Admin</p>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">System Settings</h1>
            <p className="text-sm text-zinc-600">Control how LibraAI keeps your campus library services running.</p>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="grid gap-8">
          <section className="space-y-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
            <h2 className="text-base font-semibold text-zinc-900">Automation</h2>
            <div className="space-y-3 text-sm text-zinc-700">
              <label className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white px-4 py-3">
                <span>Auto-approve low-risk requests</span>
                <input
                  type="checkbox"
                  checked={autoApproveRequests}
                  onChange={(event) => setAutoApproveRequests(event.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 text-zinc-900"
                />
              </label>
              <label className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white px-4 py-3">
                <span>Send weekly executive digest</span>
                <input
                  type="checkbox"
                  checked={weeklyDigest}
                  onChange={(event) => setWeeklyDigest(event.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 text-zinc-900"
                />
              </label>
            </div>
          </section>

          <section className="space-y-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
            <h2 className="text-base font-semibold text-zinc-900">Resilience</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm">
                <span className="text-zinc-700">Backup cadence</span>
                <select
                  value={backupFrequency}
                  onChange={(event) => setBackupFrequency(event.target.value)}
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm">
                <span className="text-zinc-700">Maintenance window</span>
                <select
                  value={maintenanceWindow}
                  onChange={(event) => setMaintenanceWindow(event.target.value)}
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
                >
                  <option value="saturday">Saturday evening</option>
                  <option value="sunday">Sunday evening</option>
                  <option value="midweek">Mid-week off hours</option>
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
