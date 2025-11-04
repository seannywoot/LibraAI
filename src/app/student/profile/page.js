"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import DashboardSidebar from "@/components/dashboard-sidebar";
import { getStudentLinks } from "@/components/navLinks";
import SignOutButton from "@/components/sign-out-button";
import Toast from "@/components/Toast";

export default function StudentProfilePage() {
  const { data: session, update } = useSession();
  const [name, setName] = useState("Study Explorer");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [studyReminders, setStudyReminders] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [toasts, setToasts] = useState([]);

  const pushToast = (toast) => {
    const id = Date.now() + Math.random();
    const t = { id, duration: 2500, show: true, ...toast };
    setToasts((prev) => [t, ...prev]);
    // Auto-remove after duration
    if (t.duration) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== id));
      }, t.duration + 100); // small buffer after auto-close inside Toast
    }
  };

  // Initialize name from session when available
  useEffect(() => {
    if (session?.user?.name) {
      setName(session.user.name);
    }
  }, [session?.user?.name]);

  const navigationLinks = getStudentLinks();

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Failed to save changes");
      }
      // Update client session so name is in sync everywhere without re-auth
      try { await update({ name }); } catch (e) { /* ignore non-fatal */ }
      pushToast({ type: "success", title: "Changes saved", description: "Your profile was updated." });
    } catch (err) {
      pushToast({ type: "error", title: "Save failed", description: err?.message || "Unknown error" });
    }
  };

  return (
    <div className="min-h-screen bg-(--bg-1) pr-6 pl-[300px] py-8 text-(--text)">
      <DashboardSidebar heading="LibraAI" links={navigationLinks} variant="light" SignOutComponent={SignOutButton} />

      <main className="space-y-8 rounded-3xl border border-(--stroke) bg-white p-10 shadow-[0_2px_20px_rgba(0,0,0,0.03)]">
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
                    className="cursor-not-allowed rounded-xl border border-zinc-200 bg-zinc-100 px-4 py-3 text-zinc-500"
                    type="text"
                    value={session?.user?.role === "admin" ? "Admin" : "Student"}
                    disabled
                    aria-readonly
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
              <button
                type="submit"
                className="rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-100"
              >
                Save changes
              </button>
            </div>
          </form>
          <div className="fixed top-4 right-4 z-50 flex max-h-[60vh] w-[min(92vw,26rem)] flex-col-reverse items-stretch gap-2 overflow-y-auto p-1">
            {toasts.map((t) => (
              <Toast
                key={t.id}
                show={t.show}
                type={t.type}
                title={t.title}
                description={t.description}
                duration={t.duration}
                onClose={() => setToasts((prev) => prev.filter((toast) => toast.id !== t.id))}
                floating={false}
              />
            ))}
          </div>
      </main>
    </div>
  );
}
