"use client";

import { useState } from "react";
import { LogOut } from "@/components/icons";
import { signOut } from "next-auth/react";
import { clearSessionStorage } from "@/lib/session-handler";

export default function SignOutButton({ className = "" }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (isLoading) {
      return;
    }

    setIsLoading(true);

    try {
      // Clear session storage before signing out
      clearSessionStorage();
      await signOut({ callbackUrl: "/auth" });
    } catch (error) {
      setIsLoading(false);
      console.error(error);
    }
  };

  const baseClass = "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-70";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      className={`${baseClass} ${className}`.trim()}
    >
      {isLoading ? (
        "Signing out..."
      ) : (
        <>
          <LogOut className="h-4 w-4" />
          <span>Sign out</span>
        </>
      )}
    </button>
  );
}