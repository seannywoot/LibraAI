"use client";

import { useEffect } from "react";

export default function Toast({
  show,
  onClose,
  title = "",
  description = "",
  type = "success", // 'success' | 'error' | 'info'
  duration = 2500,
  position = "top-right", // 'top-right' | 'top-left' - only used when floating
  floating = true, // when false, render without fixed wrapper for container stacking
}) {
  useEffect(() => {
    if (!show || !duration) return;
    const t = setTimeout(() => onClose?.(), duration);
    return () => clearTimeout(t);
  }, [show, duration, onClose]);

  if (!show) return null;

  const colorMap = {
    success: {
      ring: "ring-emerald-200",
      badge: "bg-emerald-500",
      text: "text-emerald-900",
    },
    error: {
      ring: "ring-rose-200",
      badge: "bg-rose-500",
      text: "text-rose-900",
    },
    info: {
      ring: "ring-sky-200",
      badge: "bg-sky-500",
      text: "text-sky-900",
    },
  }[type] || colorMap?.info;

  const posClass = position === "top-left" ? "left-4" : "right-4";

  const content = (
    <div
      className={`flex max-w-sm items-start gap-3 rounded-xl border border-zinc-200 bg-white/95 px-4 py-3 shadow-[0_6px_30px_rgba(0,0,0,0.08)] backdrop-blur ring-1 ${colorMap.ring}`}
    >
      <span className={`mt-1 inline-flex h-2.5 w-2.5 flex-none rounded-full ${colorMap.badge}`} aria-hidden />
      <div className="min-w-0 flex-1">
        {title ? (
          <p className={`truncate text-sm font-semibold ${colorMap.text}`}>{title}</p>
        ) : null}
        {description ? (
          <p className="mt-0.5 truncate text-xs text-zinc-600">{description}</p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onClose}
        className="ml-2 inline-flex h-6 w-6 flex-none items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"
        aria-label="Close notification"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-4 w-4"
        >
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );

  if (!floating) return content;

  return (
    <div
      className={`fixed top-4 ${posClass} z-50`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {content}
    </div>
  );
}
