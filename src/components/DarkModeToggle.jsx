"use client";

import { useTheme } from "@/contexts/ThemeContext";
import { Moon, Sun } from "lucide-react";

export default function DarkModeToggle({ className = "", value, onChange, persist = true }) {
  const { darkMode, toggleDarkMode, setDarkModePreference } = useTheme();
  const isControlled = typeof value === "boolean";
  const isDark = isControlled ? value : darkMode;

  const handleToggle = () => {
    if (typeof onChange === "function") {
      onChange(!isDark);
      return;
    }

    if (persist === false) {
      setDarkModePreference(!isDark, { persist: false });
      return;
    }

    toggleDarkMode({ persist });
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`relative inline-flex h-10 w-20 items-center rounded-full border border-(--border-subtle) bg-(--surface-2) shadow-inner transition-colors dark:border-(--border-strong) dark:bg-(--surface-3) ${className}`}
      aria-label="Toggle dark mode"
      aria-pressed={isDark}
      style={
        isDark
          ? {
              boxShadow:
                "inset 0 2px 4px 0 rgba(15, 23, 42, 0.2), 0 0 0 1px var(--accent) inset",
            }
          : undefined
      }
    >
      <span
        className={`inline-flex h-8 w-8 transform items-center justify-center rounded-full bg-(--surface-1) shadow-md transition-transform ${
          isDark ? "translate-x-11" : "translate-x-1"
        }`}
      >
        {isDark ? (
          <Moon className="h-4 w-4 text-(--text-secondary)" />
        ) : (
          <Sun className="h-4 w-4 text-amber-500" />
        )}
      </span>
    </button>
  );
}
