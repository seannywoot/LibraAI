"use client";

import { useTheme } from "@/contexts/ThemeContext";
import { Moon, Sun } from "lucide-react";

export default function DarkModeToggle({ className = "" }) {
  const { darkMode, toggleDarkMode } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleDarkMode}
      className={`relative inline-flex h-10 w-20 items-center rounded-full border border-(--border-subtle) bg-(--surface-2) shadow-inner transition-colors dark:border-(--border-strong) dark:bg-(--surface-3) ${className}`}
      aria-label="Toggle dark mode"
      aria-pressed={darkMode}
      style={
        darkMode
          ? {
              boxShadow:
                "inset 0 2px 4px 0 rgba(15, 23, 42, 0.2), 0 0 0 1px var(--accent) inset",
            }
          : undefined
      }
    >
      <span
        className={`inline-flex h-8 w-8 transform items-center justify-center rounded-full bg-(--surface-1) shadow-md transition-transform ${
          darkMode ? "translate-x-11" : "translate-x-1"
        }`}
      >
        {darkMode ? (
          <Moon className="h-4 w-4 text-(--text-secondary)" />
        ) : (
          <Sun className="h-4 w-4 text-amber-500" />
        )}
      </span>
    </button>
  );
}
