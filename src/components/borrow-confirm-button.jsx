"use client";

import { startTransition, useEffect, useState, useCallback, useRef } from "react";

/**
 * BorrowConfirmButton renders a borrow trigger that asks for explicit confirmation via an anchored popover.
 * The caller provides the asynchronous confirm handler and loading state.
 */
export default function BorrowConfirmButton({
  onConfirm,
  disabled = false,
  busy = false,
  className = "",
  wrapperClassName = "",
  children,
  borrowLabel = "Borrow",
  confirmingLabel = "Confirm?",
  confirmingTitle = "Confirm Borrow Request",
  confirmingMessage = "This sends a borrow request to the librarian for approval.",
  confirmButtonLabel = "Confirm",
  cancelButtonLabel = "Cancel",
  busyLabel = "Borrowing...",
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event) {
      if (event.key === "Escape") {
        event.stopPropagation();
        setOpen(false);
      }
    }

    function onPointerDown(event) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("touchstart", onPointerDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("touchstart", onPointerDown);
    };
  }, [open]);

  useEffect(() => {
    if (!disabled || !open || busy) return;
    startTransition(() => setOpen(false));
  }, [disabled, open, busy]);

  const handleTriggerClick = useCallback(() => {
    if (disabled || busy) return;
    setOpen((prev) => !prev);
  }, [disabled, busy]);

  const handleClose = useCallback(() => {
    if (busy) return;
    setOpen(false);
  }, [busy]);

  const handleConfirm = useCallback(async () => {
    if (typeof onConfirm !== "function" || busy) return;
    try {
      const result = onConfirm();
      if (result && typeof result.then === "function") {
        await result;
      }
      setOpen(false);
    } catch {
      // Keep the popover open so the parent can surface errors (e.g., via toasts).
    }
  }, [onConfirm, busy]);

  const label = busy ? busyLabel : open ? confirmingLabel : borrowLabel;

  const containerClass = wrapperClassName
    ? `relative ${wrapperClassName}`
    : "relative inline-flex";

  return (
    <div ref={containerRef} className={containerClass}>
      <button
        type="button"
        onClick={handleTriggerClick}
        disabled={disabled || busy}
        className={className}
      >
        {children || label}
      </button>

      {open && (
        <div className="absolute bottom-full right-0 z-30 mb-2 w-64" role="presentation">
          <div
            className="relative rounded-xl border border-zinc-200 bg-white p-4 shadow-xl"
            role="dialog"
            aria-modal="true"
          >
            <div
              className="absolute -bottom-1 right-5 h-3 w-3 rotate-45 border-r border-b border-zinc-200 bg-white"
              aria-hidden="true"
            />
            <h2 className="text-sm font-semibold text-zinc-900">{confirmingTitle}</h2>
            <p className="mt-2 text-xs text-zinc-600">{confirmingMessage}</p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 disabled:opacity-50"
                disabled={busy}
              >
                {cancelButtonLabel}
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="rounded-lg border border-emerald-600 bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                disabled={busy}
              >
                {busy ? busyLabel : confirmButtonLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
