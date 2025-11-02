"use client";

import { useState, useEffect } from "react";
import Toast from "./Toast";

let toastId = 0;
let addToastCallback = null;

export function showToast(message, type = "info", duration = 3000) {
  if (addToastCallback) {
    addToastCallback({ id: ++toastId, message, type, duration });
  }
}

function ToastContainer({ position = "top-right" }) {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    addToastCallback = (toast) => {
      setToasts((prev) => [...prev, toast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, toast.duration);
    };
    return () => {
      addToastCallback = null;
    };
  }, []);

  const posClass = position === "top-left" ? "left-4" : "right-4";
  
  if (toasts.length === 0) return null;

  return (
    <div 
      className={`fixed top-4 ${posClass} z-50 flex max-h-[60vh] w-[min(92vw,26rem)] flex-col-reverse items-stretch gap-2 overflow-y-auto p-1`}
      role="region"
      aria-label="Notifications"
    >
      {toasts.map((t) => (
        <Toast
          key={t.id}
          show={true}
          type={t.type}
          title={t.message}
          duration={t.duration}
          onClose={() => setToasts((prev) => prev.filter((toast) => toast.id !== t.id))}
          floating={false}
        />
      ))}
    </div>
  );
}

export { ToastContainer };
export default ToastContainer;
