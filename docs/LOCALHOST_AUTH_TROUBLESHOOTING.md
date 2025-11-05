# Localhost Authentication Troubleshooting Guide

## Quick Fix Checklist

If you can't sign in on localhost, try these steps in order:

### 1. Clear Browser Data
```
1. Open DevTools (F12)
2. Go to Application tab
3. Click "Clear storage" on the left
4. Check all boxes
5. Click "Clear site data"
6. Refresh the page
```

### 2. Restart Dev Server
```bash
# Stop the server (Ctrl+C)
# Then start again
npm run dev
```

### 3. Try Incognito/Private Mode
This helps identify if browser extensions or cached data are causing issues.

### 4. Verify Environment Variables
```bash
node scripts/check-localhost-auth.mjs
```

## Common Issues & Solutions

### Issue: "Invalid credentials" Error

**Symptoms:**
- Error message shows "Invalid credentials"
- Mentions remaining attempts

**Causes:**
1. Wrong password (case-sensitive!)
2. Account locked due to failed attempts
3. Database connection issue

**Solutions:**
```bash
# 1. Verify demo credentials:
Student: student@demo.edu / ReadSmart123
Admin: admin@libra.ai / ManageStacks!

# 2. Check if account is locked:
# Restart dev server to clear locks
npm run dev

# 3. Check database connection:
node scripts/diagnose-auth.js
```

### Issue: No Redirect After Login

**Symptoms:**
- Click "Sign in" button
- Page doesn't redirect
- Stays on /auth page

**Causes:**
1. Session cookie not being set
2. Browser blocking cookies
3. NEXTAUTH_URL mismatch

**Solutions:**
```bash
# 1. Check .env.local has:
NEXTAUTH_URL=http://localhost:3000

# 2. Clear cookies:
# DevTools → Application → Cookies → Delete all

# 3. Check browser console for errors
# Look for cookie warnings or CORS errors

# 4. Try different browser
```

### Issue: "Account Locked" Error

**Symptoms:**
- Error message about account being locked
- Mentions waiting X minutes

**Cause:**
- Too many failed login attempts (5+)
- Brute force protection activated

**Solution:**
```bash
# Option 1: Wait 15 minutes
# Locks expire automatically

# Option 2: Restart dev server
# Clears in-memory locks immediately
npm run dev
```

### Issue: "Session Expired" Message

**Symptoms:**
- Redirected to login with "session expired" message
- Happens immediately after login

**Causes:**
1. Old session data in sessionStorage
2. Clock skew between client/server
3. Session validation issue

**Solutions:**
```bash
# 1. Clear sessionStorage:
# DevTools → Console → Run:
sessionStorage.clear()

# 2. Restart dev server:
npm run dev

# 3. Check system time is correct
```

### Issue: Stuck Loading / No Response

**Symptoms:**
- Button shows "Signing in..."
- Never completes
- No error message

**Causes:**
1. API route not responding
2. MongoDB connection timeout
3. Network issue

**Solutions:**
```bash
# 1. Check terminal for errors
# Look for MongoDB connection errors

# 2. Test MongoDB connection:
node scripts/diagnose-auth.js

# 3. Check Network tab in DevTools:
# Look for failed /api/auth/callback/credentials call

# 4. Restart dev server:
npm run dev
```

## Debug Mode

### Enable Detailed Logging

The auth system now includes detailed logging. When you attempt to log in, check your **terminal** (not browser console) for logs like:

```
[AUTH] Authorize called with email: student@demo.edu
[AUTH] DB user lookup: student@demo.edu found
[AUTH] Password validation: success
[AUTH] Login successful for: student@demo.edu role: student
```

### What to Look For

**Successful Login:**
```
[AUTH] Authorize called with email: student@demo.edu
[AUTH] DB user lookup: student@demo.edu found
[AUTH] Password validation: success
[AUTH] Login successful for: student@demo.edu role: student
```

**Wrong Password:**
```
[AUTH] Authorize called with email: student@demo.edu
[AUTH] DB user lookup: student@demo.edu found
[AUTH] Password validation: failed
[AUTH] No user resolved, recording failed attempt
```

**User Not Found:**
```
[AUTH] Authorize called with email: test@example.com
[AUTH] DB user lookup: test@example.com not found
[AUTH] Trying demo accounts for: test@example.com
[AUTH] No user resolved, recording failed attempt
```

**Account Locked:**
```
[AUTH] Authorize called with email: student@demo.edu
[AUTH] Account locked: student@demo.edu
```

**Role Mismatch:**
```
[AUTH] Authorize called with email: admin@libra.ai
[AUTH] DB user lookup: admin@libra.ai found
[AUTH] Password validation: success
[AUTH] Role mismatch: admin vs expected student
```

## Testing Steps

### 1. Basic Login Test

```bash
# 1. Start dev server
npm run dev

# 2. Open browser to http://localhost:3000/auth

# 3. Open DevTools (F12)

# 4. Try student login:
Email: student@demo.edu
Password: ReadSmart123

# 5. Watch terminal for [AUTH] logs

# 6. Check browser Network tab for API calls
```

### 2. Database Test

```bash
# Verify MongoDB connection and demo accounts
node scripts/diagnose-auth.js
```

### 3. Auth Flow Test

```bash
# Test complete authentication flow
node scripts/test-auth-flow.js
```

### 4. Environment Check

```bash
# Verify all configuration
node scripts/check-localhost-auth.mjs
```

## Browser DevTools Checklist

### Console Tab
- [ ] No JavaScript errors
- [ ] No "Failed to fetch" errors
- [ ] No CORS errors

### Network Tab
- [ ] POST to `/api/auth/callback/credentials` returns 200
- [ ] Response includes redirect URL
- [ ] No 401 or 500 errors

### Application Tab
- [ ] Cookie `next-auth.session-token` is set after login
- [ ] Cookie has correct domain (localhost)
- [ ] Cookie is not expired

### Storage Tab
- [ ] sessionStorage has `session-start` after login
- [ ] sessionStorage has `last-activity` after login

## Environment Variables

Required in `.env.local`:

```bash
# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/test
MONGODB_DB_NAME=test

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here

# Other (optional for auth)
GEMINI_API_KEY=your-key-here
```

## Demo Credentials

### Student Account
```
Email: student@demo.edu
Password: ReadSmart123
```

### Admin Account
```
Email: admin@libra.ai
Password: ManageStacks!
```

**Note:** Passwords are case-sensitive!

## Still Having Issues?

### Collect Debug Information

1. **Terminal Output:**
   - Copy all [AUTH] logs from terminal
   - Include any error messages

2. **Browser Console:**
   - Copy any errors (ignore extension errors)
   - Include network request details

3. **Environment:**
   - Run: `node scripts/check-localhost-auth.mjs`
   - Copy the output

4. **Database:**
   - Run: `node scripts/diagnose-auth.js`
   - Copy the output

### Reset Everything

If all else fails, try a complete reset:

```bash
# 1. Stop dev server
# Press Ctrl+C

# 2. Clear browser data
# DevTools → Application → Clear storage

# 3. Delete node_modules and reinstall
rm -rf node_modules
npm install

# 4. Restart dev server
npm run dev

# 5. Try login in incognito mode
```

## Changes Made to Fix Auth

### 1. Fixed MongoDB URI
- Added database name to URI in `.env.local`
- Changed from: `mongodb+srv://...mongodb.net/`
- Changed to: `mongodb+srv://...mongodb.net/test`

### 2. Added Debug Logging
- Added [AUTH] logs throughout auth flow
- Logs appear in terminal when attempting login
- Helps identify exactly where auth fails

### 3. Verified Configuration
- NEXTAUTH_URL correctly set to localhost:3000
- NEXTAUTH_SECRET is set
- Cookie configuration correct for development

## Security Features

The auth system includes these security features:

### Brute Force Protection
- Max 5 failed attempts
- 15-minute lockout after 5 failures
- Progressive delays between attempts
- Automatic cleanup of expired locks

### Session Management
- 24-hour maximum session age
- 30-minute idle timeout
- Warning shown 2 minutes before idle logout
- Automatic session cleanup

### Password Security
- Bcrypt hashing
- Case-sensitive passwords
- No password hints or recovery without email

These features are working correctly and should not prevent normal login.
