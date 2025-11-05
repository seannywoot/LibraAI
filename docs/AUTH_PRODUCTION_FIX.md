# Authentication Production Fix

## Problem
Users cannot sign in on the production server (Vercel). The issue is caused by incorrect environment variable configuration.

## Root Causes

### 1. NEXTAUTH_URL Configuration
**Issue**: `NEXTAUTH_URL` is set to `http://localhost:3000` in production
**Impact**: NextAuth cannot generate proper callback URLs and session cookies fail

**Fix**: Update Vercel environment variables:
```
NEXTAUTH_URL=https://your-production-domain.vercel.app
```

### 2. MongoDB URI Missing Database Name
**Issue**: MongoDB URI was incomplete (missing database name)
**Status**: ✅ Fixed locally, needs update on Vercel

**Fix**: Ensure Vercel has:
```
MONGODB_URI=mongodb+srv://seannpatrick26_db_user:UgGrNUyqMDqMYC4K@libraai.7d6zeau.mongodb.net/libraai
```

### 3. Cookie Configuration
**Issue**: Cookies may not be set correctly in production due to secure flag
**Status**: Already configured correctly in code

## Step-by-Step Fix for Vercel

### 1. Update Environment Variables

Go to your Vercel project → Settings → Environment Variables

Update or add these variables for **Production**:

```bash
# Required - Your production domain
NEXTAUTH_URL=https://libra-ai-two.vercel.app

# Required - MongoDB with database name
MONGODB_URI=mongodb+srv://seannpatrick26_db_user:UgGrNUyqMDqMYC4K@libraai.7d6zeau.mongodb.net/libraai

# Required - Keep your existing secret
NEXTAUTH_SECRET=s8T1F4eDIrTkDwrMiP4ljFwC9jCLUVh9XhTtWFBKWGw=

# Optional but recommended - Add AUTH_SECRET as alias
AUTH_SECRET=s8T1F4eDIrTkDwrMiP4ljFwC9jCLUVh9XhTtWFBKWGw=
```

### 2. Redeploy

After updating environment variables:
1. Go to Deployments tab
2. Click on the latest deployment
3. Click "Redeploy" button
4. Wait for deployment to complete

### 3. Clear Browser Data

After redeployment, users should:
1. Clear browser cookies for your domain
2. Clear browser cache
3. Try logging in again

## Testing Locally

Run the diagnostic script:
```bash
node scripts/diagnose-auth.js
```

This will check:
- Environment variables are set
- MongoDB connection works
- Database name is in URI
- Demo accounts are accessible

## Common Issues

### "Could not establish connection" Error
This is actually a **browser extension error**, not a server error. It appears in the console but doesn't affect functionality. Common causes:
- Browser extensions trying to inject scripts
- Ad blockers
- Privacy extensions

**This error is NOT the cause of login failures.**

### Actual Login Failure Symptoms
- No redirect after clicking "Sign in"
- Stays on /auth page
- No error message shown
- Network tab shows 401 or 500 errors

### Session Cookie Not Set
If cookies aren't being set:
1. Check NEXTAUTH_URL matches your domain exactly
2. Ensure HTTPS in production
3. Check browser console for cookie warnings

## Brute Force Protection Notes

The recent brute force protection implementation is working correctly:
- Tracks failed attempts in memory
- Locks accounts after 5 failed attempts
- 15-minute lockout period
- Progressive delays between attempts

**This is NOT causing the production login issue.**

## Session Management Notes

The idle timeout feature is working correctly:
- 30-minute idle timeout
- 24-hour maximum session age
- Warning shown 2 minutes before logout

**This is NOT causing the production login issue.**

## Verification Steps

After applying fixes:

1. **Test Student Login**:
   - Email: student@demo.edu
   - Password: ReadSmart123

2. **Test Admin Login**:
   - Email: admin@libra.ai
   - Password: ManageStacks!

3. **Check Network Tab**:
   - Should see successful POST to `/api/auth/callback/credentials`
   - Should see 200 response
   - Should redirect to dashboard

4. **Check Cookies**:
   - Should see `next-auth.session-token` cookie
   - Should have proper domain and secure flags

## Support

If issues persist after applying these fixes:
1. Check Vercel deployment logs
2. Check browser console for actual errors (ignore extension errors)
3. Verify environment variables are saved correctly
4. Try incognito/private browsing mode
