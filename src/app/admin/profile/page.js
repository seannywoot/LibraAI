"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import DashboardSidebar from "@/components/dashboard-sidebar";
import { getAdminLinks } from "@/components/navLinks";
import SignOutButton from "@/components/sign-out-button";
import Toast from "@/components/Toast";
import DarkModeToggle from "@/components/DarkModeToggle";
import { useTheme } from "@/contexts/ThemeContext";
import { useUserPreferences } from "@/contexts/UserPreferencesContext";

export default function AdminProfilePage() {
  const { data: session, update } = useSession();
  const [name, setName] = useState("Library Steward");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [toasts, setToasts] = useState([]);
  const { setDarkModePreference } = useTheme();
  const { name: contextName, emailNotifications: contextEmailNotifications, updatePreferences } = useUserPreferences();
  const preferencesLoadedRef = useRef(false);
  const isEditingRef = useRef(false);

  // Sync with context (real-time updates from other browsers/tabs)
  // Only update if we're not currently editing
  useEffect(() => {
    if (contextName && !isEditingRef.current) {
      setName(contextName);
    }
  }, [contextName]);

  useEffect(() => {
    if (!isEditingRef.current) {
      setEmailNotifications(contextEmailNotifications);
    }
  }, [contextEmailNotifications]);

  useEffect(() => {
    if (session?.user?.name) setName(session.user.name);
  }, [session?.user?.name]);

  useEffect(() => {
    const loadPreferences = async () => {
      if (preferencesLoadedRef.current) return;
      
      try {
        const res = await fetch("/api/user/profile");
        const data = await res.json().catch(() => ({}));
        if (data?.ok && data?.user) {
          if (typeof data.user.emailNotifications === "boolean") {
            setEmailNotifications(data.user.emailNotifications);
          }
          // Don't load theme here - SessionProvider handles it
          preferencesLoadedRef.current = true;
        }
      } catch (err) {
        console.warn("Failed to load admin preferences:", err);
      }
    };

    if (session?.user?.email) {
      loadPreferences();
    }
  }, [session?.user?.email]);

  const pushToast = (toast) => {
    const id = Date.now() + Math.random();
    const t = { id, duration: 2500, show: true, ...toast };
    setToasts((prev) => [t, ...prev]);
    if (t.duration) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== id));
      }, t.duration + 100);
    }
  };

  const navigationLinks = getAdminLinks();

  const handleDarkModeChange = async (nextValue) => {
    const newTheme = nextValue ? "dark" : "light";
    
    // Update theme immediately in UI and localStorage
    setDarkModePreference(nextValue, { persist: true });
    
    // Save to database in background (session will sync automatically)
    try {
      await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ theme: newTheme }),
      });
    } catch (err) {
      console.error("Failed to save theme preference:", err);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    isEditingRef.current = true;
    
    try {
      const payload = { name, emailNotifications };

      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Failed to save changes");
      }

      // Broadcast changes to other tabs/browsers via localStorage
      const prefs = { name, emailNotifications };
      try {
        localStorage.setItem("userPreferences", JSON.stringify(prefs));
      } catch (err) {
        // Ignore storage errors
      }
      updatePreferences(prefs);

      pushToast({ type: "success", title: "Changes saved", description: "Your profile and notification preferences were updated." });
    } catch (err) {
      pushToast({ type: "error", title: "Save failed", description: err?.message || "Unknown error" });
    } finally {
      // Allow context updates again after a short delay
      setTimeout(() => {
        isEditingRef.current = false;
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen bg-(--bg-1) pr-6 pl-[300px] py-8 text-(--text)">
      <DashboardSidebar heading="LibraAI" links={navigationLinks} variant="light" SignOutComponent={SignOutButton} />

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
                  className="cursor-not-allowed rounded-xl border border-zinc-200 bg-zinc-100 px-4 py-3 text-zinc-500"
                  type="text"
                  value="Admin"
                  disabled
                  aria-readonly
                />
              </label>
            </div>
            <label className="grid gap-2 text-sm">
              <span className="text-zinc-700">Email (notifications will be sent here)</span>
              <input
                className="cursor-not-allowed rounded-xl border border-zinc-200 bg-zinc-100 px-4 py-3 text-zinc-500"
                type="email"
                value={session?.user?.email || ""}
                disabled
                aria-readonly
              />
            </label>
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
              <div className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white px-4 py-3">
                <div className="flex flex-col">
                  <span>Dark mode</span>
                  <span className="text-xs text-zinc-500">Toggle the app theme</span>
                </div>
                <DarkModeToggle className="ml-2" onChange={handleDarkModeChange} />
              </div>
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
