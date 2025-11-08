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
      const response = NextResponse.redirect(buildRedirect(request, destination));
      // Prevent caching to ensure fresh redirects
      response.headers.set('Cache-Control', 'no-store, must-revalidate');
      return response;
    }

    // Prevent non-admins from accessing admin routes
    if (pathname.startsWith("/admin") && role !== "admin") {
      console.log('[MIDDLEWARE] Non-admin trying to access admin route, redirecting to student dashboard');
      const response = NextResponse.redirect(buildRedirect(request, "/student/dashboard"));
      response.headers.set('Cache-Control', 'no-store, must-revalidate');
      return response;
    }

    // Redirect legacy /dashboard to role-specific dashboard
    if (pathname === "/dashboard") {
      const destination = role === "admin" ? "/admin/dashboard" : "/student/dashboard";
      console.log('[MIDDLEWARE] Redirecting from legacy /dashboard to:', destination);
      const response = NextResponse.redirect(buildRedirect(request, destination));
      response.headers.set('Cache-Control', 'no-store, must-revalidate');
      return response;
    }

    // Prevent admins from accessing student-specific routes
    if (pathname.startsWith("/student") && role === "admin") {
      console.log('[MIDDLEWARE] Admin trying to access student route, redirecting to admin dashboard');
      const response = NextResponse.redirect(buildRedirect(request, "/admin/dashboard"));
      response.headers.set('Cache-Control', 'no-store, must-revalidate');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*", "/admin/:path*", "/student/:path*", "/auth"],
};