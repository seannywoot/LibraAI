"use client";

import Toast from "./Toast";

export default function ToastContainer({
  toasts = [],
  onClose,
  position = "top-right",
  gap = 10,
}) {
  const posClass = position === "top-left" ? "left-4" : "right-4";
  return (
    <div className={`fixed top-4 ${posClass} z-50 flex max-h-[60vh] w-[min(92vw,26rem)] flex-col-reverse items-stretch gap-2 overflow-y-auto p-1`}
      role="region"
      aria-label="Notifications"
    >
      {toasts.map((t) => (
        <Toast
          key={t.id}
          show={true}
          type={t.type}
          title={t.title}
          description={t.description}
          duration={t.duration ?? 2500}
          onClose={() => onClose?.(t.id)}
          floating={false}
        />
      ))}
    </div>
  );
}
