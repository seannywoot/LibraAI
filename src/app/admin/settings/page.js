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
    <div className="min-h-screen bg-slate-950 px-6 py-12 text-slate-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 lg:flex-row">
        <DashboardSidebar
          heading="Workspace Settings"
          tagline="Admin"
          links={navigationLinks}
          variant="admin"
          footer="Tune automation, backups, and maintenance policies for the library stack."
          SignOutComponent={SignOutButton}
        />

        <main className="flex-1 space-y-8 rounded-3xl border border-slate-800 bg-slate-900/70 p-10 shadow-2xl shadow-slate-950/70 backdrop-blur">
          <header className="space-y-3 border-b border-slate-800 pb-6">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-400">Admin</p>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-white">System Settings</h1>
              <p className="text-sm text-slate-400">Control how LibraAI keeps your campus library services running.</p>
            </div>
          </header>

          <form onSubmit={handleSubmit} className="grid gap-8">
            <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="text-base font-semibold text-white">Automation</h2>
              <div className="space-y-3 text-sm text-slate-300">
                <label className="flex items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3">
                  <span>Auto-approve low-risk requests</span>
                  <input
                    type="checkbox"
                    checked={autoApproveRequests}
                    onChange={(event) => setAutoApproveRequests(event.target.checked)}
                    className="h-4 w-4 rounded border-slate-700 text-white"
                  />
                </label>
                <label className="flex items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3">
                  <span>Send weekly executive digest</span>
                  <input
                    type="checkbox"
                    checked={weeklyDigest}
                    onChange={(event) => setWeeklyDigest(event.target.checked)}
                    className="h-4 w-4 rounded border-slate-700 text-white"
                  />
                </label>
              </div>
            </section>

            <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="text-base font-semibold text-white">Resilience</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm">
                  <span className="text-slate-300">Backup cadence</span>
                  <select
                    value={backupFrequency}
                    onChange={(event) => setBackupFrequency(event.target.value)}
                    className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-slate-100 outline-none transition focus:border-white/40 focus:bg-slate-950"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </label>
                <label className="grid gap-2 text-sm">
                  <span className="text-slate-300">Maintenance window</span>
                  <select
                    value={maintenanceWindow}
                    onChange={(event) => setMaintenanceWindow(event.target.value)}
                    className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-slate-100 outline-none transition focus:border-white/40 focus:bg-slate-950"
                  >
                    <option value="saturday">Saturday evening</option>
                    <option value="sunday">Sunday evening</option>
                    <option value="midweek">Mid-week off hours</option>
                  </select>
                </label>
              </div>
            </section>

            <div className="flex items-center justify-end gap-3">
              {saved && <span className="text-xs text-emerald-400">Saved</span>}
              <button
                type="submit"
                className="rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
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
