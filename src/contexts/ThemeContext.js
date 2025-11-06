"use client";

import { createContext, startTransition, useCallback, useContext, useEffect, useState } from "react";

const ThemeContext = createContext({
  darkMode: false,
  toggleDarkMode: () => {},
  setDarkModePreference: () => {},
});

export function ThemeProvider({ children, initialDarkMode = false }) {
  const [darkMode, setDarkModeState] = useState(initialDarkMode);
  const syncTheme = useCallback((isDark, { persist = true } = {}) => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.dataset.theme = isDark ? "dark" : "light";
    root.classList.toggle("dark", isDark);

    if (!persist) {
      return;
    }

    try {
      document.cookie = `theme=${isDark ? "dark" : "light"}; path=/; max-age=31536000`;
      localStorage.setItem("theme", isDark ? "dark" : "light");
    } catch (_) {
      // Silently ignore storage issues (e.g. privacy mode)
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const root = document.documentElement;

    const resolveInitial = () => {
      try {
        const storedTheme = localStorage.getItem("theme");
        if (storedTheme === "dark" || storedTheme === "light") {
          return storedTheme === "dark";
        }
      } catch (_) {
        // Ignore storage access issues and fall through to DOM/system checks
      }

      if (root.dataset.theme === "dark" || root.classList.contains("dark")) {
        return true;
      }

      if (typeof window.matchMedia === "function") {
        return window.matchMedia("(prefers-color-scheme: dark)").matches;
      }

      return false;
    };

    const resolvedDark = resolveInitial();
    if (resolvedDark !== darkMode) {
      startTransition(() => {
        setDarkModeState(resolvedDark);
      });
    }
    syncTheme(resolvedDark);

    const handleStorage = (event) => {
      if (event.key === "theme") {
        const isDark = event.newValue === "dark";
        setDarkModeState(isDark);
        syncTheme(isDark, { persist: false });
      }
    };

    const mediaQuery = typeof window.matchMedia === "function" ? window.matchMedia("(prefers-color-scheme: dark)") : null;
    const handleMediaChange = (event) => {
      try {
        const storedTheme = localStorage.getItem("theme");
        if (storedTheme) return;
      } catch (_) {
        // If storage is unavailable, honour the system preference change
      }

      setDarkModeState(event.matches);
      syncTheme(event.matches);
    };

    window.addEventListener("storage", handleStorage);
    if (mediaQuery) {
      if (typeof mediaQuery.addEventListener === "function") {
        mediaQuery.addEventListener("change", handleMediaChange);
      } else if (typeof mediaQuery.addListener === "function") {
        mediaQuery.addListener(handleMediaChange);
      }
    }

    return () => {
      window.removeEventListener("storage", handleStorage);
      if (mediaQuery) {
        if (typeof mediaQuery.removeEventListener === "function") {
          mediaQuery.removeEventListener("change", handleMediaChange);
        } else if (typeof mediaQuery.removeListener === "function") {
          mediaQuery.removeListener(handleMediaChange);
        }
      }
    };
  }, [darkMode, syncTheme]);

  const setDarkModePreference = useCallback((isDark, { persist = true } = {}) => {
    setDarkModeState(() => {
      syncTheme(isDark, { persist });
      return isDark;
    });
  }, [syncTheme]);

  const toggleDarkMode = useCallback(({ persist = true } = {}) => {
    setDarkModeState((prev) => {
      const next = !prev;
      syncTheme(next, { persist });
      return next;
    });
  }, [syncTheme]);

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode, setDarkModePreference }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
