import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

function buildRedirect(request, pathname) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  return url;
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Get the token - using the environment variable or fallback
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET
  });
  
  const role = token?.role;

  const requiresAuth =
    pathname.startsWith("/dashboard") || pathname.startsWith("/admin") || pathname.startsWith("/student");

  // If no token and route requires auth, redirect to login
  if (!token && requiresAuth) {
    const loginUrl = buildRedirect(request, "/auth");
    const originalPath = `${pathname}${request.nextUrl.search}`;
    if (originalPath && originalPath !== "/auth") {
      loginUrl.searchParams.set("redirect", originalPath);
    }
    return NextResponse.redirect(loginUrl);
  }

  // If user is authenticated
  if (token) {
    // Redirect from auth page to appropriate dashboard
    // But allow password reset pages (/auth/forgot, /auth/reset)
    if (pathname === "/auth") {
      const destination = role === "admin" ? "/admin/dashboard" : "/student/dashboard";
      console.log('[MIDDLEWARE] Authenticated user on /auth, redirecting to:', destination);
      return NextResponse.redirect(buildRedirect(request, destination));
    }

    // Prevent non-admins from accessing admin routes
    if (pathname.startsWith("/admin") && role !== "admin") {
      return NextResponse.redirect(buildRedirect(request, "/student/dashboard"));
    }

    // Redirect legacy /dashboard to role-specific dashboard
    if (pathname === "/dashboard") {
      const destination = role === "admin" ? "/admin/dashboard" : "/student/dashboard";
      return NextResponse.redirect(buildRedirect(request, destination));
    }

    // Prevent admins from accessing student-specific routes
    if (pathname.startsWith("/student") && role === "admin") {
      return NextResponse.redirect(buildRedirect(request, "/admin/dashboard"));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*", "/admin/:path*", "/student/:path*", "/auth"],
};