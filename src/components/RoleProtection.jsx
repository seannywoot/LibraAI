"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";

/**
 * Client-side role-based route protection component
 * Prevents users from accessing wrong panels via back/forward buttons or URL manipulation
 * 
 * @param {Object} props
 * @param {string} props.requiredRole - Required role ('admin' or 'student')
 * @param {React.ReactNode} props.children - Child components to render if authorized
 */
export default function RoleProtection({ requiredRole, children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Wait for session to load
    if (status === "loading") return;

    // Not authenticated - redirect to login
    if (status === "unauthenticated" || !session?.user) {
      console.log('[ROLE PROTECTION] No session, redirecting to auth');
      router.replace(`/auth?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    // Check role mismatch
    const userRole = session.user.role;
    if (userRole !== requiredRole) {
      const correctDashboard = userRole === "admin" ? "/admin/dashboard" : "/student/dashboard";
      console.log(`[ROLE PROTECTION] Role mismatch. User is ${userRole}, required ${requiredRole}. Redirecting to ${correctDashboard}`);
      router.replace(correctDashboard);
    }
  }, [status, session, requiredRole, router, pathname]);

  // Handle browser navigation (back/forward buttons)
  useEffect(() => {
    const handlePopState = () => {
      if (status === "authenticated" && session?.user) {
        const userRole = session.user.role;
        if (userRole !== requiredRole) {
          const correctDashboard = userRole === "admin" ? "/admin/dashboard" : "/student/dashboard";
          console.log(`[ROLE PROTECTION] Navigation detected. Role mismatch, redirecting to ${correctDashboard}`);
          router.replace(correctDashboard);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [status, session, requiredRole, router]);

  // Show loading state while checking
  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-gray-900 border-r-transparent" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <p className="mt-4 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated or wrong role
  if (status === "unauthenticated" || !session?.user || session.user.role !== requiredRole) {
    return null;
  }

  // Authorized - render children
  return <>{children}</>;
}
