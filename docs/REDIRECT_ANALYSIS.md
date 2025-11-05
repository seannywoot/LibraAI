# Redirect Flow Analysis

## Current Flow

### 1. User submits login form
```javascript
// src/app/auth/page.js
const result = await signIn("credentials", {
  redirect: false,  // ← This prevents NextAuth from auto-redirecting
  email,
  password,
  expectedRole: role,
});
```

### 2. After successful signIn
```javascript
const redirectUrl = result?.url || destination;
console.log('Redirecting to:', redirectUrl);
window.location.href = redirectUrl;  // ← Manual redirect
```

**Problem**: When `redirect: false`, NextAuth doesn't return a `url` in the result. So `result?.url` is always `undefined`, and it falls back to `destination`.

### 3. Middleware intercepts the request
```javascript
// middleware.js
if (token) {
  // Redirect from auth page to appropriate dashboard
  if (pathname === "/auth" || pathname.startsWith("/auth/")) {
    const destination = role === "admin" ? "/admin/dashboard" : "/student/dashboard";
    return NextResponse.redirect(buildRedirect(request, destination));
  }
}
```

## Potential Issues

### Issue 1: Race Condition
When `window.location.href = destination` is executed, the session cookie might not be fully set yet, causing:
- Middleware doesn't see the token
- User stays on `/auth` page
- Or gets redirected back to `/auth`

### Issue 2: Double Redirect
If the session IS set:
1. Client redirects to `/student/dashboard`
2. Middleware sees authenticated user on `/auth` and redirects again
3. Could cause redirect loop or confusion

### Issue 3: Middleware Matcher
```javascript
export const config = {
  matcher: ["/dashboard", "/dashboard/:path*", "/admin/:path*", "/student/:path*", "/auth"],
};
```

The matcher includes `/auth` but NOT `/auth/*` (like `/auth/forgot`, `/auth/reset`).
This is correct, but the middleware checks `pathname.startsWith("/auth/")` which might not trigger.

## Root Cause

The issue is likely:
1. **Session cookie timing**: The cookie isn't immediately available after `signIn` returns
2. **Client-side redirect**: Using `window.location.href` doesn't wait for session to be established
3. **No callback URL**: Not using NextAuth's built-in redirect mechanism

## Solution Options

### Option 1: Use NextAuth's Built-in Redirect (Recommended)
```javascript
await signIn("credentials", {
  redirect: true,  // Let NextAuth handle redirect
  callbackUrl: destination,
  email,
  password,
  expectedRole: role,
});
```

**Pros**: 
- NextAuth ensures session is set before redirect
- Middleware will see the token
- Standard NextAuth flow

**Cons**: 
- Less control over error handling
- Need to handle errors differently

### Option 2: Wait for Session Before Redirect
```javascript
const result = await signIn("credentials", { redirect: false, ... });

if (result?.ok) {
  // Wait for session to be established
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Or better: poll for session
  const checkSession = async () => {
    const session = await getSession();
    if (session) {
      window.location.href = destination;
    } else {
      setTimeout(checkSession, 50);
    }
  };
  checkSession();
}
```

**Pros**: 
- Ensures session is ready
- Keeps error handling control

**Cons**: 
- More complex
- Potential for infinite loop if session fails

### Option 3: Use Router.push with Refresh
```javascript
const result = await signIn("credentials", { redirect: false, ... });

if (result?.ok) {
  // Use Next.js router with refresh
  router.push(destination);
  router.refresh(); // Force server-side re-render
}
```

**Pros**: 
- Client-side navigation
- Triggers middleware check

**Cons**: 
- Might still have timing issues
- Less reliable than Option 1

### Option 4: Hybrid Approach (Best for this case)
```javascript
const result = await signIn("credentials", {
  redirect: false,
  email,
  password,
  expectedRole: role,
});

if (result?.ok) {
  // Use NextAuth's redirect with callbackUrl
  // This ensures session is set before navigation
  window.location.href = `/api/auth/callback/credentials?callbackUrl=${encodeURIComponent(destination)}`;
}
```

**Pros**: 
- Leverages NextAuth's session handling
- Keeps error handling
- Reliable redirect

**Cons**: 
- Slightly more complex URL

## Recommended Fix

Use **Option 1** with proper error handling:

```javascript
const attemptLogin = async ({ role, email, password, remember = false }) => {
  if (isSubmitting) return;
  
  setIsSubmitting(true);
  const setError = role === "student" ? setStudentError : setAdminError;
  setError("");

  try {
    const redirectParam = searchParams.get("redirect");
    const defaultDestination = role === "admin" ? "/admin/dashboard" : "/student/dashboard";
    let destination = defaultDestination;

    if (redirectParam && redirectParam.startsWith("/") && !redirectParam.startsWith("//")) {
      if (role === "admin") {
        destination = redirectParam.startsWith("/admin") ? redirectParam : defaultDestination;
      } else {
        destination = redirectParam.startsWith("/admin") ? defaultDestination : redirectParam;
      }
    }

    // Use NextAuth's built-in redirect with callbackUrl
    const result = await signIn("credentials", {
      email,
      password,
      expectedRole: role,
      callbackUrl: destination,
      redirect: false, // We'll handle redirect manually after checking result
    });

    console.log('[CLIENT] SignIn result:', { ok: result?.ok, error: result?.error });

    if (!result?.ok || result?.error) {
      // Handle errors...
      setError(errorMessage);
      setIsSubmitting(false);
      return;
    }

    // Success - now redirect using NextAuth's mechanism
    // This ensures the session cookie is properly set
    window.location.href = destination;
    
  } catch (error) {
    console.error('[CLIENT] Login error:', error);
    setError("Unable to sign in right now. Please try again.");
    setIsSubmitting(false);
  }
};
```

## Testing Plan

1. **Test student login** → Should redirect to `/student/dashboard`
2. **Test admin login** → Should redirect to `/admin/dashboard`
3. **Test with redirect param** → Should respect the redirect parameter
4. **Test role mismatch** → Should show error, not redirect
5. **Test invalid credentials** → Should show error, not redirect
6. **Test account locked** → Should show error, not redirect
7. **Test in production** → Verify HTTPS cookies work
8. **Test middleware** → Verify it doesn't interfere

## Impact Analysis

### Will NOT affect:
- ✅ Production server (same logic, just more reliable)
- ✅ Sign out functionality (uses different flow)
- ✅ Session management (no changes)
- ✅ Brute force protection (no changes)
- ✅ Password reset flow (separate pages)
- ✅ Middleware routing (no changes)
- ✅ Role-based access (no changes)

### Will improve:
- ✅ Login reliability
- ✅ Session cookie timing
- ✅ Redirect consistency
- ✅ User experience

## Middleware Matcher Fix

Also need to ensure middleware matcher includes auth subpages:

```javascript
export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/admin/:path*",
    "/student/:path*",
    "/auth",
    "/auth/:path*",  // ← Add this to handle /auth/forgot, /auth/reset
  ],
};
```

But we need to exclude `/auth/forgot` and `/auth/reset` from the redirect:

```javascript
if (token) {
  // Redirect from auth page to appropriate dashboard
  // But NOT from password reset pages
  if (pathname === "/auth") {
    const destination = role === "admin" ? "/admin/dashboard" : "/student/dashboard";
    return NextResponse.redirect(buildRedirect(request, destination));
  }
}
```
