"use client";

import { useState } from "react";
import DashboardSidebar from "@/components/dashboard-sidebar";
import SignOutButton from "@/components/sign-out-button";

export default function AdminProfilePage() {
  const [name, setName] = useState("Library Steward");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(true);
  const [betaFeatures, setBetaFeatures] = useState(false);
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
          heading="Account Controls"
          tagline="Admin"
          links={navigationLinks}
          variant="admin"
          footer="Adjust your admin profile and workspace preferences."
          SignOutComponent={SignOutButton}
        />

        <main className="flex-1 space-y-8 rounded-3xl border border-slate-800 bg-slate-900/70 p-10 shadow-2xl shadow-slate-950/70 backdrop-blur">
          <header className="space-y-3 border-b border-slate-800 pb-6">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-400">Admin</p>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-white">Profile & Settings</h1>
              <p className="text-sm text-slate-400">Update your display name and workspace preferences.</p>
            </div>
          </header>

          <form onSubmit={handleSubmit} className="grid gap-8">
            <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="text-base font-semibold text-white">Profile</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm">
                  <span className="text-slate-300">Full name</span>
                  <input
                    className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-slate-100 outline-none transition focus:border-white/40 focus:bg-slate-950"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                  />
                </label>
                <label className="grid gap-2 text-sm">
                  <span className="text-slate-300">Role</span>
                  <input
                    className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-slate-400"
                    type="text"
                    value="Admin"
                    readOnly
                  />
                </label>
              </div>
            </section>

            <section id="settings" className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="text-base font-semibold text-white">Settings</h2>
              <div className="space-y-3 text-sm text-slate-300">
                <label className="flex items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3">
                  <span>Email notifications</span>
                  <input
                    type="checkbox"
                    checked={emailNotifications}
                    onChange={(e) => setEmailNotifications(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-700 text-white"
                  />
                </label>
                <label className="flex items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3">
                  <span>Weekly engagement report</span>
                  <input
                    type="checkbox"
                    checked={weeklyReport}
                    onChange={(e) => setWeeklyReport(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-700 text-white"
                  />
                </label>
                <label className="flex items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3">
                  <span>Enable beta features</span>
                  <input
                    type="checkbox"
                    checked={betaFeatures}
                    onChange={(e) => setBetaFeatures(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-700 text-white"
                  />
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
