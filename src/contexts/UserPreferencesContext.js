"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

const UserPreferencesContext = createContext({
  name: "",
  emailNotifications: true,
  updatePreferences: () => {},
});

export function UserPreferencesProvider({ children }) {
  const [preferences, setPreferences] = useState({
    name: "",
    emailNotifications: true,
  });

  const updatePreferences = useCallback((updates) => {
    setPreferences((prev) => ({
      ...prev,
      ...updates,
    }));
  }, []);

  // Listen for storage events from other tabs (same browser sync)
  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key === "userPreferences" && event.newValue) {
        try {
          const prefs = JSON.parse(event.newValue);
          setPreferences((prev) => ({
            ...prev,
            ...prefs,
          }));
        } catch (err) {
          // Ignore parse errors
        }
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return (
    <UserPreferencesContext.Provider value={{ ...preferences, updatePreferences }}>
      {children}
    </UserPreferencesContext.Provider>
  );
}

export function useUserPreferences() {
  const context = useContext(UserPreferencesContext);
  if (context === undefined) {
    throw new Error("useUserPreferences must be used within a UserPreferencesProvider");
  }
  return context;
}
