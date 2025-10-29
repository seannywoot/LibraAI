"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignOutButton({ className = "" }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (isLoading) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Logout failed");
      }

      router.replace("/auth");
    } catch (error) {
      setIsLoading(false);
      console.error(error);
    }
  };

  const baseClass = "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-70";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      className={`${baseClass} ${className}`.trim()}
    >
      {isLoading ? "Signing out..." : "Sign out"}
    </button>
  );
}