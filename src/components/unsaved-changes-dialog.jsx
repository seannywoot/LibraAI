"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmDialog from "./confirm-dialog";

/**
 * UnsavedChangesDialog - Shows a warning when user tries to leave a form with unsaved changes
 * 
 * @param {boolean} hasUnsavedChanges - Whether there are unsaved changes
 * @param {boolean} showDialog - Whether to show the dialog
 * @param {function} onConfirm - Callback when user confirms leaving
 * @param {function} onCancel - Callback when user cancels
 * @param {string} title - Dialog title (optional)
 * @param {string} description - Dialog description (optional)
 */
export default function UnsavedChangesDialog({
  hasUnsavedChanges,
  showDialog,
  onConfirm,
  onCancel,
  title = "Unsaved Changes",
  description = "You have unsaved changes. Are you sure you want to leave? Any unsaved changes will be lost."
}) {
  const router = useRouter();
  const [showPopstateDialog, setShowPopstateDialog] = useState(false);
  const isNavigatingRef = useRef(false);

  // Warn user before closing/refreshing browser tab
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = ""; // Chrome requires returnValue to be set
      return ""; // Some browsers show this message
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  // Intercept browser back/forward button
  useEffect(() => {
    if (!hasUnsavedChanges || isNavigatingRef.current) return;

    // Push a dummy state to intercept back button
    window.history.pushState(null, "", window.location.href);

    const handlePopState = (e) => {
      if (isNavigatingRef.current) return;

      // Prevent navigation
      window.history.pushState(null, "", window.location.href);
      
      // Show dialog
      setShowPopstateDialog(true);
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [hasUnsavedChanges]);

  const handlePopstateConfirm = () => {
    isNavigatingRef.current = true;
    setShowPopstateDialog(false);
    // Go back after confirming
    window.history.back();
  };

  const handlePopstateCancel = () => {
    setShowPopstateDialog(false);
    // Stay on page - already pushed state back
  };

  return (
    <>
      <ConfirmDialog
        open={showDialog}
        title={title}
        description={description}
        confirmLabel="Leave Anyway"
        cancelLabel="Stay on Page"
        destructive
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
      
      <ConfirmDialog
        open={showPopstateDialog}
        title={title}
        description={description}
        confirmLabel="Leave Anyway"
        cancelLabel="Stay on Page"
        destructive
        onConfirm={handlePopstateConfirm}
        onCancel={handlePopstateCancel}
      />
    </>
  );
}
