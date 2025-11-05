# Quick Start: Testing Authentication

## ✅ Fix Applied

The authentication issue has been resolved. Here's what was fixed:

1. **MongoDB URI** - Added database name to the connection string
2. **Debug Logging** - Added detailed logs to track auth flow
3. **Troubleshooting Tools** - Created scripts and documentation

## 🚀 Test Now

### Step 1: Restart Dev Server
```bash
npm run dev
```

### Step 2: Clear Browser Data
1. Open http://localhost:3000/auth
2. Press F12 (DevTools)
3. Go to Application tab
4. Click "Clear storage"
5. Click "Clear site data"
6. Refresh the page

### Step 3: Login
Use these demo credentials:

**Student:**
- Email: `student@demo.edu`
- Password: `ReadSmart123`

**Admin:**
- Email: `admin@libra.ai`
- Password: `ManageStacks!`

### Step 4: Watch Terminal
You should see logs like:
```
[AUTH] Authorize called with email: student@demo.edu
[AUTH] DB user lookup: student@demo.edu found
[AUTH] Password validation: success
[AUTH] Login successful for: student@demo.edu role: student
```

## 🔍 If Login Fails

### Quick Checks
```bash
# 1. Verify setup
node scripts/check-localhost-auth.mjs

# 2. Test database
node scripts/diagnose-auth.js

# 3. Test auth flow
node scripts/test-auth-flow.js
```

### Common Solutions

**"Invalid credentials" error:**
- Check password is exactly: `ReadSmart123` (case-sensitive)
- Restart dev server to clear any locks

**No redirect after login:**
- Clear browser cookies
- Try incognito mode
- Check terminal for [AUTH] logs

**"Account locked" error:**
- Restart dev server (clears locks immediately)
- Or wait 15 minutes

## 📚 Full Documentation

For detailed troubleshooting:
- Read: `docs/LOCALHOST_AUTH_TROUBLESHOOTING.md`
- Read: `docs/AUTH_FIX_SUMMARY.md`

## ✨ What's Working

✅ MongoDB connection
✅ Demo accounts (student & admin)
✅ Password verification
✅ Session management
✅ Brute force protection
✅ Role-based routing
✅ Debug logging

## 🎯 Expected Behavior

**Successful Login:**
1. Enter credentials
2. Click "Sign in"
3. See [AUTH] logs in terminal
4. Redirect to dashboard
5. Session cookie set

**Failed Login:**
1. Enter wrong password
2. See error message
3. See [AUTH] logs showing failure
4. Remaining attempts shown

## 💡 Tips

- Passwords are case-sensitive
- Watch terminal for [AUTH] logs
- Clear browser data if stuck
- Use incognito to test fresh
- Restart server to clear locks

## 🆘 Still Need Help?

Run diagnostics and share output:
```bash
node scripts/check-localhost-auth.mjs
node scripts/diagnose-auth.js
```

Check terminal for [AUTH] logs when attempting login.
