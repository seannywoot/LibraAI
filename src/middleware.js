import { NextResponse } from "next/server";

const SESSION_COOKIE = "libraai-session";

function buildRedirect(request, pathname) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  return url;
}

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get(SESSION_COOKIE)?.value;

  const requiresAuth =
    pathname.startsWith("/dashboard") || pathname.startsWith("/admin") || pathname.startsWith("/student");

  if (!session && requiresAuth) {
    const loginUrl = buildRedirect(request, "/auth");
    const originalPath = `${pathname}${request.nextUrl.search}`;
    if (originalPath && originalPath !== "/auth") {
      loginUrl.searchParams.set("redirect", originalPath);
    }
    return NextResponse.redirect(loginUrl);
  }

  if (session) {
    if (pathname.startsWith("/auth")) {
      const destination = session === "admin" ? "/admin/dashboard" : "/student/dashboard";
      return NextResponse.redirect(buildRedirect(request, destination));
    }

    if (pathname.startsWith("/admin") && session !== "admin") {
      return NextResponse.redirect(buildRedirect(request, "/dashboard"));
    }

    if (pathname.startsWith("/dashboard")) {
      // Normalize legacy /dashboard to the correct destination based on role
      const destination = session === "admin" ? "/admin/dashboard" : "/student/dashboard";
      return NextResponse.redirect(buildRedirect(request, destination));
    }

    // Prevent admins from accessing student-specific routes
    if (pathname.startsWith("/student") && session === "admin") {
      return NextResponse.redirect(buildRedirect(request, "/admin/dashboard"));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/student/:path*", "/auth"],
};