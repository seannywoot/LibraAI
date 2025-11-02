"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { User, Settings, LogOut, ChevronRight } from "@/components/icons";

// Remove horizontal padding so items align with the header's left edge (aside has p-6 already)
// Add w-full so each row is a full-width clickable target
const baseLinkStyles =
  "group flex w-full items-center justify-start rounded-xl px-0 py-2 text-sm font-medium transition";

const VARIANTS = {
  admin: {
    background: "bg-slate-950",
    panel: "border border-slate-800/80 bg-slate-900/70 shadow-2xl shadow-slate-950/70",
    headerAccent: "text-slate-300",
    title: "text-white",
    navBackground: "border border-slate-800 bg-slate-900/60",
    defaultLink: "text-slate-300 hover:bg-white/5 hover:text-white",
    activeLink: "bg-white/10 text-white",
    subtleText: "text-slate-500",
    divider: "border-slate-800/80",
    signOutVariant: "border border-white/20 bg-white/10 text-white hover:bg-white/20",
  },
  student: {
    background: "bg-zinc-100",
    panel: "border border-zinc-200 bg-white shadow-2xl shadow-zinc-900/5",
    headerAccent: "text-zinc-500",
    title: "text-zinc-900",
    navBackground: "border border-zinc-200 bg-zinc-50",
    defaultLink: "text-zinc-600 hover:bg-white hover:text-zinc-900",
    activeLink: "bg-white text-zinc-900 shadow",
    subtleText: "text-zinc-500",
    divider: "border-zinc-200",
    signOutVariant: "border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-100",
  },
  // Light variant matching the attached design palette
  light: {
    background: "bg-(--bg-1)",
    panel:
      "border border-(--stroke) bg-(--bg-1) shadow-[0_2px_20px_rgba(0,0,0,0.03)]",
    headerAccent: "text-(--subtext)",
    title: "text-(--text)",
    navBackground: "border border-(--stroke) bg-(--bg-1)",
    defaultLink:
      "text-(--subtext) hover:bg-(--bg-2) hover:text-(--text)",
    activeLink: "bg-(--bg-2) text-(--text)",
    subtleText: "text-(--subtext)",
    divider: "border-(--stroke)",
    signOutVariant:
      "border border-(--stroke) bg-(--bg-1) text-(--text) hover:bg-(--bg-2)",
  },
};

export default function DashboardSidebar({
  heading,
  tagline,
  links,
  variant = "light",
  footer,
  SignOutComponent,
  fullHeight = true,
  fixed = true,
}) {
  const pathname = usePathname();
  const theme = VARIANTS[variant] ?? VARIANTS.student;
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown on outside click or route change
  useEffect(() => {
    function onDocClick(e) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // We intentionally avoid calling setState directly on route changes to satisfy strict lint rules.

  const role = session?.user?.role === "admin" ? "admin" : "student";
  const profileHref = role === "admin" ? "/admin/profile" : "/student/profile";
  const settingsHref = role === "admin" ? "/admin/settings" : "/student/settings";

  // Filter out profile/settings from the main nav to match the new UX
  const filteredLinks = Array.isArray(links)
    ? links.filter((l) => {
        const label = (l?.label || "").toString().toLowerCase();
        if (["profile", "settings", "sign out", "signout", "logout"].includes(label)) return false;
        return true;
      })
    : [];

  // Remove any border-related tokens from the nav background so the nav box has no stroke
  const navBackground = (theme.navBackground || "").replace(/\bborder[^\s]*\b/g, "").replace(/\s+/g, " ").trim();

  return (
      <aside
      className={`flex flex-col gap-6 rounded-3xl ${theme.panel} p-6 ${
        fixed
          ? "fixed left-4 top-4 h-[calc(100vh-2rem)] w-60 overflow-auto"
          : fullHeight
            ? "sticky top-4 self-start h-[calc(100vh-2rem)] overflow-auto"
            : ""
      }`}
      aria-label="Primary navigation"
    >
      <header className="space-y-2">
        <p className={`text-xs font-semibold uppercase tracking-[0.3em] ${theme.headerAccent}`}>
          {tagline ?? (session?.user?.role === "admin" ? "Admin" : "Student")}
        </p>
        <h1 className={`text-2xl font-semibold tracking-tight ${theme.title}`}>LibraAI</h1>
      </header>

  {/* Remove horizontal padding from the nav container to align with header */}
  <nav className={`flex flex-col gap-2 rounded-2xl ${navBackground} py-2 px-0`}>
        {filteredLinks.map((link) => {
          const rawHref = typeof link.href === "string" ? link.href : link.href?.pathname ?? "/";
          const normalizedHref = rawHref.split("?")[0].split("#")[0];
          const matchTarget = link.matchPath ?? normalizedHref;
          const isActive = link.exact ? pathname === matchTarget : pathname.startsWith(matchTarget);
          const linkClasses = `${baseLinkStyles} ${isActive ? theme.activeLink : theme.defaultLink}`;
          const key = link.key ?? (typeof link.href === "string" ? link.href : link.href?.pathname ?? link.label);

          return (
            <Link key={key} href={link.href} className={linkClasses} aria-current={isActive ? "page" : undefined}>
              <span className="flex items-center gap-3">
                {link.icon ? (
                  <span className="text-(--text)/60 transition-colors group-hover:text-(--text)">
                    {link.icon}
                  </span>
                ) : null}
                <span>{link.label}</span>
              </span>
              {link.badge ? (
                <span className="ml-auto rounded-md bg-emerald-500 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                  {link.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

  {/* Footer description intentionally removed for a cleaner, consistent sidebar */}

      {/* Account section at the bottom with dropdown */}
      <div ref={menuRef} className="mt-auto pt-2 relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`w-full ${theme.defaultLink} ${baseLinkStyles} rounded-xl`}
          aria-haspopup="menu"
          aria-expanded={open ? "true" : "false"}
        >
          <span className="flex items-center gap-3">
            {/* Simple avatar using initial */}
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-(--bg-2) text-(--text) font-semibold">
              {(session?.user?.name || "?").slice(0, 1)}
            </span>
            <span className="flex min-w-0 flex-col text-left">
              <span className="truncate font-medium text-(--text)">{session?.user?.name || "Account"}</span>
              <span className="truncate text-xs text-(--subtext)">{session?.user?.email || ""}</span>
            </span>
          </span>
          <ChevronRight className={`h-4 w-4 transition-transform ${open ? "rotate-90" : ""}`} />
        </button>

        {open ? (
          <div
            role="menu"
            className={`absolute bottom-14 left-0 right-0 z-50 rounded-2xl ${theme.navBackground} p-2 shadow-lg`}
          >
            <Link
              href={profileHref}
              role="menuitem"
              className={`${baseLinkStyles} ${theme.defaultLink}`}
              onClick={() => setOpen(false)}
            >
              <span className="flex items-center gap-3"><User className="h-4 w-4" /> Profile</span>
            </Link>
            <Link
              href={settingsHref}
              role="menuitem"
              className={`${baseLinkStyles} ${theme.defaultLink}`}
              onClick={() => setOpen(false)}
            >
              <span className="flex items-center gap-3"><Settings className="h-4 w-4" /> Settings</span>
            </Link>
            <div className={`my-1 border-t ${theme.divider}`} />
            {SignOutComponent ? (
              <SignOutComponent className={`w-full justify-start ${theme.signOutVariant}`} />
            ) : (
              <div className={`${baseLinkStyles} ${theme.signOutVariant} inline-flex`}>
                <LogOut className="h-4 w-4" />
                <span>Sign out</span>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </aside>
  );
}
