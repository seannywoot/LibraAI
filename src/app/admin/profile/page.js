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
    <div className="min-h-screen bg-(--bg-1) pr-6 pl-[300px] py-8 text-(--text)">
      <DashboardSidebar
        heading="Account Controls"
        tagline="Admin"
        links={navigationLinks}
        variant="light"
        footer="Adjust your admin profile and workspace preferences."
        SignOutComponent={SignOutButton}
      />

      <main className="space-y-8 rounded-3xl border border-(--stroke) bg-white p-10 shadow-[0_2px_20px_rgba(0,0,0,0.03)]">
        <header className="space-y-3 border-b border-(--stroke) pb-6">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-zinc-500">Admin</p>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Profile & Settings</h1>
            <p className="text-sm text-zinc-600">Update your display name and workspace preferences.</p>
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
                  value="Admin"
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
                <span>Weekly engagement report</span>
                <input
                  type="checkbox"
                  checked={weeklyReport}
                  onChange={(e) => setWeeklyReport(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 text-zinc-900"
                />
              </label>
              <label className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white px-4 py-3">
                <span>Enable beta features</span>
                <input
                  type="checkbox"
                  checked={betaFeatures}
                  onChange={(e) => setBetaFeatures(e.target.checked)}
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
  );
}
