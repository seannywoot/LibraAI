"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function BorrowedRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to My Library with borrowed tab
    router.replace("/student/library?tab=borrowed");
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600">Redirecting to My Library...</p>
      </div>
    </div>
  );
}
