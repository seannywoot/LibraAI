"use client";

export default function CategoryBadge({ label, variant = "default" }) {
  const variants = {
    default: "bg-blue-100 text-blue-800",
    category: "bg-blue-100 text-blue-800",
    tag: "bg-purple-100 text-purple-800",
    gray: "bg-gray-100 text-gray-700",
  };

  const className = variants[variant] || variants.default;

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}
