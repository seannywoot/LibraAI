"use client";

import { createContext, useContext, useState, useCallback } from "react";

const UnsavedChangesContext = createContext({
  hasUnsavedChanges: false,
  setHasUnsavedChanges: () => {},
  navigationHandler: null,
  setNavigationHandler: () => {},
});

export function UnsavedChangesProvider({ children }) {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [navigationHandler, setNavigationHandler] = useState(null);

  return (
    <UnsavedChangesContext.Provider
      value={{
        hasUnsavedChanges,
        setHasUnsavedChanges,
        navigationHandler,
        setNavigationHandler,
      }}
    >
      {children}
    </UnsavedChangesContext.Provider>
  );
}

export function useUnsavedChangesContext() {
  return useContext(UnsavedChangesContext);
}
