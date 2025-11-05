# Debug Production Login Issue

## Current Symptoms
- URL changes to dashboard URL but doesn't actually navigate
- Stays on login page
- Using demo accounts (fallback, not from database)

## Recent Changes Made

### 1. Fixed Client-Side Redirect
Changed from `router.replace()` to `window.location.href` for hard navigation after login.

**Why**: Client-side routing can fail if the session isn't fully established yet.

### 2. Updated Cookie Configuration
Added proper secure cookie naming for production.

**Why**: Production requires `__Secure-` prefix for secure cookies.

### 3. Enhanced Middleware
Added fallback for AUTH_SECRET and improved auth page detection.

**Why**: Ensures token validation works even if NEXTAUTH_SECRET isn't set.

## Debugging Steps for Production

### Step 1: Check Browser Console
Open DevTools (F12) and look for:

```
❌ Ignore: "Could not establish connection" - This is a browser extension error
✅ Look for: Any errors related to:
   - /api/auth/callback/credentials
   - /api/auth/session
   - Cookie warnings
   - CORS errors
```

### Step 2: Check Network Tab
1. Open DevTools → Network tab
2. Try logging in
3. Look for these requests:

```
POST /api/auth/callback/credentials
Expected: 200 OK
Response should contain: { url: "/student/dashboard" } or similar

GET /api/auth/session
Expected: 200 OK
Response should contain: { user: { email, role, ... } }
```

If you see:
- **401 Unauthorized**: Session not created properly
- **500 Internal Server Error**: Check Vercel logs
- **No redirect**: Cookie not being set

### Step 3: Check Cookies
In DevTools → Application → Cookies → Your domain

Look for:
```
Production:
__Secure-next-auth.session-token

Development:
next-auth.session-token
```

If cookie is missing:
- NEXTAUTH_URL might be wrong
- Cookie domain mismatch
- Secure flag issue

### Step 4: Check Vercel Function Logs
1. Go to Vercel Dashboard
2. Click your project
3. Go to Deployments → Latest → View Function Logs
4. Filter by `/api/auth`

Look for:
```
❌ MongoDB connection errors
❌ "Missing NEXTAUTH_SECRET"
❌ "Invalid token"
❌ Any stack traces
```

### Step 5: Verify Environment Variables
In Vercel Dashboard → Settings → Environment Variables

**Must have for Production:**
```bash
NEXTAUTH_URL=https://libra-ai-two.vercel.app
MONGODB_URI=mongodb+srv://...mongodb.net/libraai
NEXTAUTH_SECRET=s8T1F4eDIrTkDwrMiP4ljFwC9jCLUVh9XhTtWFBKWGw=
```

**Common mistakes:**
- ❌ NEXTAUTH_URL has trailing slash
- ❌ NEXTAUTH_URL is still localhost
- ❌ MONGODB_URI missing database name
- ❌ Variables set for wrong environment (Preview instead of Production)

## Quick Fixes to Try

### Fix 1: Clear Everything and Retry
```bash
# In browser:
1. Clear all cookies for your domain
2. Clear cache (Ctrl+Shift+Delete)
3. Close all tabs
4. Open in incognito mode
5. Try logging in
```

### Fix 2: Force Redeploy
```bash
# In Vercel:
1. Go to Deployments
2. Click latest deployment
3. Click "Redeploy"
4. Wait for completion
5. Try again
```

### Fix 3: Check for Redirect Loops
If the page keeps refreshing:
1. Check middleware.js is not creating loops
2. Check SessionProvider is not forcing logout
3. Check browser console for "Too many redirects"

## Testing Locally

Run these commands to verify local setup:

```bash
# Test authentication flow
node scripts/test-auth-flow.js

# Test MongoDB connection
node scripts/diagnose-auth.js

# Start dev server
npm run dev

# Try logging in at http://localhost:3000/auth
```

## Common Production Issues

### Issue 1: Cookie Not Set
**Symptom**: Login seems to work but no cookie appears

**Causes**:
- NEXTAUTH_URL doesn't match actual domain
- Cookie secure flag mismatch
- SameSite policy blocking cookie

**Fix**:
```bash
# Verify NEXTAUTH_URL exactly matches your domain
NEXTAUTH_URL=https://libra-ai-two.vercel.app
# No trailing slash!
# Must be HTTPS in production!
```

### Issue 2: Session Not Persisting
**Symptom**: Cookie is set but session doesn't work

**Causes**:
- NEXTAUTH_SECRET mismatch between environments
- JWT token validation failing
- Session callback returning null

**Fix**:
```bash
# Ensure same secret everywhere
NEXTAUTH_SECRET=s8T1F4eDIrTkDwrMiP4ljFwC9jCLUVh9XhTtWFBKWGw=
AUTH_SECRET=s8T1F4eDIrTkDwrMiP4ljFwC9jCLUVh9XhTtWFBKWGw=
```

### Issue 3: Redirect Not Working
**Symptom**: URL changes but page doesn't navigate

**Causes**:
- Client-side routing failing
- Middleware blocking navigation
- SessionProvider interfering

**Fix**: Already applied - using `window.location.href` instead of `router.replace()`

### Issue 4: Middleware Blocking Access
**Symptom**: Redirects back to login immediately

**Causes**:
- Token not being read correctly
- NEXTAUTH_SECRET mismatch in middleware
- Cookie name mismatch

**Fix**: Already applied - added AUTH_SECRET fallback in middleware

## What to Share for Further Help

If still not working, share:

1. **Browser Console Output** (screenshot or text)
   - Filter to show only errors
   - Ignore extension errors

2. **Network Tab for Login Request**
   - POST to /api/auth/callback/credentials
   - Response status and body

3. **Vercel Function Logs**
   - Any errors from /api/auth routes
   - Last 20-30 lines

4. **Cookie Status**
   - Screenshot of Application → Cookies
   - Show if session token exists

5. **Environment Variables**
   - Confirm NEXTAUTH_URL value (hide secrets)
   - Confirm which environment (Production/Preview/Development)

## Expected Behavior

### Successful Login Flow:
1. User enters credentials
2. POST to `/api/auth/callback/credentials` → 200 OK
3. Cookie `__Secure-next-auth.session-token` is set
4. Browser navigates to `/student/dashboard` or `/admin/dashboard`
5. Middleware validates token
6. Dashboard page loads
7. SessionProvider starts tracking activity

### What You're Seeing:
1. User enters credentials
2. POST to `/api/auth/callback/credentials` → ??? (check this)
3. Cookie ??? (check if set)
4. URL changes but no navigation
5. Stays on login page

**The key is finding where this flow breaks.**
