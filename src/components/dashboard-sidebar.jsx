"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const baseLinkStyles =
  "group flex items-center justify-between rounded-xl px-4 py-2 text-sm font-medium transition";

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

  return (
    <aside
      className={`flex flex-col gap-6 rounded-3xl ${theme.panel} p-6 ${
        fixed
          ? "fixed left-4 top-4 h-[calc(100vh-2rem)] w-[260px] overflow-auto"
          : fullHeight
            ? "sticky top-4 self-start h-[calc(100vh-2rem)] overflow-auto"
            : ""
      }`}
      aria-label="Primary navigation"
    >
      <header className="space-y-2">
        {tagline ? (
          <p className={`text-xs font-semibold uppercase tracking-[0.3em] ${theme.headerAccent}`}>
            {tagline}
          </p>
        ) : null}
        <h1 className={`text-2xl font-semibold tracking-tight ${theme.title}`}>{heading}</h1>
      </header>

      <nav className={`flex flex-col gap-2 rounded-2xl ${theme.navBackground} p-3`}>
        {links.map((link) => {
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
                <span className="ml-2 rounded-md bg-emerald-500 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                  {link.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

  {footer ? <p className={`text-xs ${theme.subtleText}`}>{footer}</p> : null}

      {SignOutComponent ? (
        <div className="mt-auto pt-4">
          <SignOutComponent className={`w-full justify-center ${theme.signOutVariant}`} />
        </div>
      ) : null}
    </aside>
  );
}
