"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { User, Settings, LogOut, ChevronRight, Menu, X } from "@/components/icons";
import { useUserPreferences } from "@/contexts/UserPreferencesContext";

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
      "text-(--subtext) hover:bg-orange-50 hover:text-orange-600",
    // Use theme variables so active state follows light/dark correctly
    activeLink: "bg-[var(--sidebar-active-bg)] text-[var(--sidebar-active-text)]",
    subtleText: "text-(--subtext)",
    divider: "border-(--stroke)",
    signOutVariant:
      "border border-(--stroke) bg-(--bg-1) text-(--text) hover:bg-orange-50",
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
  onNavigate, // Optional navigation interceptor for unsaved changes
}) {
  const pathname = usePathname();
  const router = useRouter();
  const theme = VARIANTS[variant] ?? VARIANTS.student;
  const { data: session } = useSession();
  const { name: contextName } = useUserPreferences();
  const [open, setOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false); // State for mobile/tablet sidebar
  const menuRef = useRef(null);
  const asideRef = useRef(null);

  // Handle navigation with optional interception
  const handleLinkClick = (e, href) => {
    if (onNavigate) {
      e.preventDefault();
      const targetHref = typeof href === "string" ? href : href?.pathname ?? "/";
      onNavigate(() => router.push(targetHref));
    }
  };

  // Use context name if available, otherwise fall back to session
  const displayName = contextName || session?.user?.name || "Account";

  // Close dropdown on outside click or route change
  useEffect(() => {
    function onDocClick(e) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // Ensure content does not sit underneath the fixed sidebar on ≥1440px.
  // If the immediate <main> sibling doesn't already provide sufficient
  // left spacing, we add a runtime padding-left of 300px.
  useEffect(() => {
    function applyOrRemoveContentPadding() {
      try {
        const el = asideRef.current;
        if (!el) return;

        const isWide = typeof window !== "undefined" && window.matchMedia("(min-width: 1440px)").matches;
        // Find first <main> sibling after the aside within the same parent
        const parent = el.parentElement;
        if (!parent) return;
        let sib = el.nextElementSibling;
        while (sib && sib.tagName.toLowerCase() !== "main") sib = sib.nextElementSibling;

        if (!sib) return;

        if (isWide) {
          const computed = window.getComputedStyle(sib);
          const padLeft = parseFloat(computed.paddingLeft || "0");
          // Only add padding if existing left padding is small (< 200px)
          if (padLeft < 200) {
            sib.style.setProperty("padding-left", "300px");
          }
          // Remove any runtime mobile navbar spacing
          if (sib.style) sib.style.removeProperty("padding-top");
        } else {
          // Remove any runtime padding we may have added on smaller screens
          if (sib.style) {
            sib.style.removeProperty("padding-left");
          }
          // Ensure content clears the fixed mobile navbar
          const computed = window.getComputedStyle(sib);
          const padTop = parseFloat(computed.paddingTop || "0");
          const nav = document.querySelector('nav[data-mobile-navbar]');
          const navHeight = nav ? nav.offsetHeight : 64;
          const desired = Math.max(80, navHeight + 16); // add breathing room
          if (padTop < desired - 4) {
            sib.style.setProperty("padding-top", `${desired}px`);
          }
        }
      } catch (_) {
        // no-op if DOM access fails
      }
    }

    applyOrRemoveContentPadding();
    window.addEventListener("resize", applyOrRemoveContentPadding);
    const t = setTimeout(applyOrRemoveContentPadding, 50);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", applyOrRemoveContentPadding);
    };
  }, []);

  // We intentionally avoid calling setState directly on route changes to satisfy strict lint rules.

  const role = session?.user?.role === "admin" ? "admin" : "student";
  const profileHref = role === "admin" ? "/admin/profile" : "/student/profile";

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
    <>
      {/* Mobile/Tablet Navbar - Only visible below 1024px */}
      <nav data-mobile-navbar className="fixed top-0 left-0 right-0 z-50 min-[1440px]:hidden bg-white border-b border-zinc-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl hover:bg-zinc-50 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6 text-zinc-900" />
          </button>
          <div className="flex items-center gap-1">
            <img src="/libraai-logo.png" alt="LibraAI" className="h-10 w-auto object-contain" />
            <h1 className="text-lg font-semibold text-zinc-900 -ml-1">LibraAI</h1>
          </div>
          <div className="w-10" /> {/* Spacer for center alignment */}
        </div>
      </nav>

      {/* Backdrop overlay - Only on mobile/tablet when sidebar is open */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 min-[1440px]:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        ref={asideRef}
        className={`flex flex-col gap-6 rounded-3xl ${theme.panel} p-6 
          ${fixed
            ? `fixed left-4 top-4 h-[calc(100vh-2rem)] w-60 overflow-auto z-50
                 transition-transform duration-300 ease-in-out
                 ${sidebarOpen ? 'translate-x-0' : '-translate-x-[280px]'}
                 min-[1440px]:translate-x-0`
            : fullHeight
              ? "sticky top-4 self-start h-[calc(100vh-2rem)] overflow-auto"
              : ""
          }`}
        aria-label="Primary navigation"
      >
        {/* Close button - Only visible on mobile and tablet */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="min-[1440px]:hidden absolute top-4 right-4 p-2 rounded-lg hover:bg-zinc-100 transition-colors"
          aria-label="Close menu"
        >
          <X className="h-5 w-5 text-zinc-600" />
        </button>

        <header className="space-y-2">
          <p className={`text-xs font-semibold uppercase tracking-[0.3em] ${theme.headerAccent}`}>
            {tagline ?? (session?.user?.role === "admin" ? "Admin" : "Student")}
          </p>
          <div className="flex items-center gap-0 -ml-3">
            <img src="/libraai-logo.png" alt="LibraAI" className="h-12 w-auto object-contain" />
            <h1 className={`text-2xl font-semibold tracking-tight ${theme.title} -ml-1`}>LibraAI</h1>
          </div>
        </header >

        {/* Remove horizontal padding from the nav container to align with header */}
        < nav className={`flex flex-col gap-2 rounded-2xl ${navBackground} py-2 px-0`
        }>
          {
            filteredLinks.map((link) => {
              const rawHref = typeof link.href === "string" ? link.href : link.href?.pathname ?? "/";
              const normalizedHref = rawHref.split("?")[0].split("#")[0];
              const matchTarget = link.matchPath ?? normalizedHref;
              const isActive = link.exact ? pathname === matchTarget : pathname.startsWith(matchTarget);
              const linkClasses = `${baseLinkStyles} ${isActive ? theme.activeLink : theme.defaultLink}`;
              const key = link.key ?? (typeof link.href === "string" ? link.href : link.href?.pathname ?? link.label);

              return (
                <Link
                  key={key}
                  href={link.href}
                  className={linkClasses}
                  aria-current={isActive ? "page" : undefined}
                  onClick={(e) => {
                    handleLinkClick(e, link.href);
                    // Close sidebar on mobile/tablet when a link is clicked
                    setSidebarOpen(false);
                  }}
                >
                  <span className="flex items-center gap-3">
                    {link.icon ? (
                      <span className="transition-colors">
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
            })
          }
        </nav >

        {/* Footer description intentionally removed for a cleaner, consistent sidebar */}

        {/* Account section at the bottom with dropdown */}
        <div ref={menuRef} className="mt-auto pt-2 relative">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className={`w-full ${theme.defaultLink} ${baseLinkStyles} rounded-xl px-2 overflow-visible`}
            aria-haspopup="menu"
            aria-expanded={open ? "true" : "false"}
          >
            <span className="flex flex-1 min-w-0 items-center gap-3">
              {/* Simple avatar using initial - ensure full circle with spacing */}
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-(--btn-primary) text-white font-semibold">
                {displayName.slice(0, 1)}
              </span>
              <span className="flex min-w-0 flex-col text-left">
                <span className="truncate font-medium text-(--text)">{displayName}</span>
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
              {/* Profile & Settings moved from sidebar into account menu */}
              <Link
                href={profileHref}
                className={`${baseLinkStyles} ${theme.defaultLink} rounded-lg`}
                role="menuitem"
                onClick={(e) => {
                  handleLinkClick(e, profileHref);
                  // Close sidebar on mobile/tablet
                  setSidebarOpen(false);
                }}
              >
                <Settings className="h-4 w-4 mr-3" />
                <span>Profile & Settings</span>
              </Link>
              <div className="my-1 h-px w-full bg-(--stroke)/60" />
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
      </aside >
    </>
  );
}
