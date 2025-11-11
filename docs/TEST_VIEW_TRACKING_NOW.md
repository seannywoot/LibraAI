# TEST VIEW TRACKING RIGHT NOW

## The Problem:

You viewed and bookmarked books, but only SEARCH interactions are being recorded. The view tracking code IS in the file, but it's not executing.

## Most Likely Cause:

**Browser JavaScript cache** - Even after hard refresh, the browser might still be using cached JavaScript.

---

## DEFINITIVE TEST (Do This Now):

### Step 1: Open Browser DevTools

1. Press `F12`
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Click **Clear storage** or **Clear site data**
4. Check ALL boxes
5. Click **Clear site data**

### Step 2: Close and Reopen Browser

1. **Completely close** the browser (all windows)
2. **Reopen** the browser
3. Go to `http://localhost:3000`

### Step 3: Login and Test

1. Login as `demo@student.com`
2. Open DevTools (F12)
3. Go to **Network** tab
4. Go to catalog: `http://localhost:3000/student/books`
5. **Click on ANY book** (e.g., "Sapiens")
6. **WATCH the Network tab**

### Step 4: What You Should See

Look for a request to: **`/api/student/books/track`**

**If you see it:**
```
Method: POST
Status: 200
Payload: {
  "eventType": "view",
  "bookId": "..."
}
```
✅ **Tracking is working!**

**If you DON'T see it:**
```
No request to /api/student/books/track
```
❌ **JavaScript still cached or error occurred**

---

## If You DON'T See the Request:

### Check Console for Errors:

1. Go to **Console** tab in DevTools
2. Look for red error messages
3. Common errors:
   - `getBehaviorTracker is not defined`
   - `tracker.trackBookView is not a function`
   - `Cannot read property 'trackBookView' of undefined`

### If You See Errors:

The JavaScript bundle is corrupted or cached. Do this:

```bash
# Stop dev server (Ctrl + C)

# Delete EVERYTHING
rm -rf .next
rm -rf node_modules/.cache

# Restart
npm run dev
```

Then close browser completely and reopen.

---

## Alternative: Test in Incognito Mode

1. Open **Incognito/Private window** (Ctrl + Shift + N)
2. Go to `http://localhost:3000`
3. Login as `demo@student.com`
4. Open DevTools (F12)
5. Go to Network tab
6. View a book
7. Check for `/api/student/books/track` request

**Incognito mode has NO cache**, so if it works here but not in regular browser, it's definitely a cache issue.

---

## After You See the Request:

Run this to verify:

```bash
node scripts/debug-user-interactions.js demo@student.com
```

Should now show:
```
View Interactions: 1 (or more)
  ✓ View interactions recorded
```

---

## Summary:

The code is correct. The issue is **browser caching**. You need to:

1. **Clear ALL browser data** (not just hard refresh)
2. **Close and reopen browser**
3. **Or use Incognito mode**
4. **Then test viewing a book**
5. **Check Network tab for tracking request**

If you see the POST request to `/api/student/books/track` with `eventType: "view"`, then tracking is working and categories will be captured!
