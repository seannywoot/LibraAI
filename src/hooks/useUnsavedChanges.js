"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * Custom hook to handle unsaved changes warning
 * 
 * @param {boolean} hasUnsavedChanges - Whether there are unsaved changes
 * @returns {object} - { showDialog, pendingNavigation, handleNavigation, cancelNavigation, confirmNavigation }
 */
export function useUnsavedChanges(hasUnsavedChanges) {
  const router = useRouter();
  const [showDialog, setShowDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const isNavigatingRef = useRef(false);

  // Intercept navigation attempts
  const handleNavigation = useCallback((callback) => {
    if (hasUnsavedChanges && !isNavigatingRef.current) {
      setPendingNavigation(() => callback);
      setShowDialog(true);
      return false; // Prevent navigation
    }
    callback();
    return true; // Allow navigation
  }, [hasUnsavedChanges]);

  // Cancel navigation
  const cancelNavigation = useCallback(() => {
    setShowDialog(false);
    setPendingNavigation(null);
  }, []);

  // Confirm navigation
  const confirmNavigation = useCallback(() => {
    isNavigatingRef.current = true;
    setShowDialog(false);
    if (pendingNavigation) {
      pendingNavigation();
    }
    setPendingNavigation(null);
    // Reset flag after a short delay
    setTimeout(() => {
      isNavigatingRef.current = false;
    }, 100);
  }, [pendingNavigation]);

  // Create a safe navigation function
  const navigateTo = useCallback((path) => {
    handleNavigation(() => router.push(path));
  }, [handleNavigation, router]);

  // Create a safe back navigation function
  const navigateBack = useCallback(() => {
    handleNavigation(() => router.back());
  }, [handleNavigation, router]);

  return {
    showDialog,
    pendingNavigation,
    handleNavigation,
    cancelNavigation,
    confirmNavigation,
    navigateTo,
    navigateBack
  };
}
