# What to Check in Production

## Open Browser DevTools (F12)

### Console Tab - What You Should See

When you click "Sign in", you should see:

```javascript
✅ SignIn result: { ok: true, error: undefined, url: undefined, status: 200 }
✅ Redirecting to: /student/dashboard
```

### Console Tab - What Indicates a Problem

```javascript
❌ SignIn result: { ok: false, error: "CredentialsSignin", ... }
   → Authentication failed - check credentials

❌ SignIn result: { ok: false, error: "Configuration", ... }
   → NextAuth configuration issue - check NEXTAUTH_URL

❌ SignIn result: { ok: true, ... }
   Redirecting to: /student/dashboard
   (but page doesn't redirect)
   → Check if there's a JavaScript error after this

❌ TypeError: Cannot read property 'href' of undefined
   → JavaScript error in redirect code
```

### Network Tab - What to Check

1. **Find the login request:**
   - Filter by "callback"
   - Look for: `POST /api/auth/callback/credentials`

2. **Check the response:**
   ```
   ✅ Status: 200 OK
   ✅ Response body: { "url": "http://localhost:3000/student/dashboard" }
   
   OR
   
   ❌ Status: 401 Unauthorized
      → Authentication failed
   
   ❌ Status: 500 Internal Server Error
      → Server error - check Vercel logs
   ```

3. **Check session request:**
   - Look for: `GET /api/auth/session`
   - Should return: `{ "user": { "email": "...", "role": "..." } }`

### Application Tab - Cookies

1. Go to: Application → Cookies → Your domain

2. **Production should have:**
   ```
   Name: __Secure-next-auth.session-token
   Value: (long encrypted string)
   Domain: .libra-ai-two.vercel.app
   Path: /
   Secure: ✓
   HttpOnly: ✓
   SameSite: Lax
   ```

3. **Development should have:**
   ```
   Name: next-auth.session-token
   Value: (long encrypted string)
   Domain: localhost
   Path: /
   Secure: (empty)
   HttpOnly: ✓
   SameSite: Lax
   ```

4. **If cookie is missing:**
   - Check NEXTAUTH_URL matches your domain exactly
   - Check Network tab for Set-Cookie header
   - Try in incognito mode (extensions might block)

## Common Scenarios

### Scenario 1: Everything Looks Good But No Redirect
```
Console: ✅ SignIn result: { ok: true }
Console: ✅ Redirecting to: /student/dashboard
Network: ✅ 200 OK
Cookie: ✅ Set
Result: ❌ Stays on login page
```

**Possible causes:**
- Browser extension blocking navigation
- JavaScript error after redirect (check console)
- Middleware redirecting back to login

**Try:**
- Incognito mode
- Different browser
- Check for errors after "Redirecting to" log

### Scenario 2: Authentication Fails
```
Console: ❌ SignIn result: { ok: false, error: "CredentialsSignin" }
Network: ❌ 401 Unauthorized
```

**Possible causes:**
- Wrong credentials
- Database connection issue
- Password hash mismatch

**Try:**
- Use exact demo credentials
- Check Vercel logs for MongoDB errors
- Verify MONGODB_URI includes database name

### Scenario 3: No Cookie Set
```
Console: ✅ SignIn result: { ok: true }
Network: ✅ 200 OK
Cookie: ❌ Missing
Result: ❌ Stays on login page
```

**Possible causes:**
- NEXTAUTH_URL mismatch
- Cookie domain issue
- Secure flag issue

**Try:**
- Verify NEXTAUTH_URL exactly matches domain
- Check Network tab → Response Headers → Set-Cookie
- Try in incognito mode

### Scenario 4: Server Error
```
Console: ❌ SignIn result: { ok: false, error: "Configuration" }
Network: ❌ 500 Internal Server Error
```

**Possible causes:**
- Missing NEXTAUTH_SECRET
- MongoDB connection failed
- Server-side error

**Try:**
- Check Vercel function logs
- Verify all environment variables are set
- Check MongoDB Atlas is accessible

## Quick Checklist

Before asking for help, verify:

- [ ] Checked Console tab for "SignIn result" log
- [ ] Checked Console tab for "Redirecting to" log
- [ ] Checked Console tab for any errors (ignore extension errors)
- [ ] Checked Network tab for `/api/auth/callback/credentials` status
- [ ] Checked Network tab response body
- [ ] Checked Application tab for session cookie
- [ ] Tried in incognito mode
- [ ] Cleared cookies and cache
- [ ] Verified NEXTAUTH_URL in Vercel matches domain exactly
- [ ] Verified MONGODB_URI includes `/libraai` at end

## Share This Information

If still not working, share screenshots of:

1. **Console tab** showing:
   - "SignIn result" log
   - "Redirecting to" log
   - Any errors

2. **Network tab** showing:
   - POST to `/api/auth/callback/credentials`
   - Status code and response body

3. **Application → Cookies** showing:
   - Whether session cookie exists
   - Cookie details

4. **Vercel function logs** showing:
   - Any errors from `/api/auth/*` routes
   - Last 20-30 lines

This will help identify exactly where the issue is.
