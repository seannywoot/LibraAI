# START HERE: Test Interaction Tracking

## ✅ Code is Ready!

The tracking code has been successfully implemented. Now you need to **test it** to create the first interactions.

---

## 🚀 Quick Start (5 minutes)

### Step 1: Hard Refresh Browser (CRITICAL!)

**The browser is caching old JavaScript. You MUST do this:**

**Windows/Linux:**
```
Press: Ctrl + Shift + R
```

**Mac:**
```
Press: Cmd + Shift + R
```

**Or:**
1. Open DevTools (F12)
2. Right-click browser refresh button
3. Select "Empty Cache and Hard Reload"

---

### Step 2: Login

Go to: `http://localhost:3000`

Login as: `demo@student.com`

---

### Step 3: Open DevTools

Press `F12` to open DevTools

Go to **Network** tab

Keep it open!

---

### Step 4: View a Book

1. Go to catalog: `http://localhost:3000/student/books`
2. **Click on ANY book** to view its details
3. Wait for page to load

---

### Step 5: Check Network Tab

Look for a request to: **`/api/student/books/track`**

**What you should see:**
```
Method: POST
Status: 200
Payload: {
  "eventType": "view",
  "bookId": "..."
}
Response: {
  "ok": true,
  "interactionId": "..."
}
```

**If you see this:** ✅ Tracking is working!

**If you DON'T see this:** ❌ See troubleshooting below

---

### Step 6: Verify in Database

Run this command:

```bash
node scripts/verify-interaction-tracking.js demo@student.com
```

**Expected output:**
```
✓ Connected to MongoDB
✓ Collection 'user_interactions' exists

📊 Total Interactions: 1

📈 Interactions by Type:
  view: 1

🕐 Recent Interactions (Last 10):
  1. VIEW - [timestamp]
     User: demo@student.com
     Book: [book title] by [author]
```

**If you see this:** ✅ Everything is working!

---

## 🔍 Troubleshooting

### Problem: No `/api/student/books/track` request in Network tab

**Cause:** Browser still has old JavaScript cached

**Fix:**
1. Hard refresh again: `Ctrl + Shift + R`
2. Or restart dev server:
   ```bash
   # Stop server (Ctrl + C)
   rm -rf .next
   npm run dev
   ```
3. Then try viewing a book again

---

### Problem: Request shows but status is 401 (Unauthorized)

**Cause:** Not logged in or session expired

**Fix:**
1. Log out
2. Log back in as `demo@student.com`
3. Try again

---

### Problem: Request shows but status is 404 (Not Found)

**Cause:** Book doesn't exist in database

**Fix:**
1. Try a different book
2. Make sure you have books in your database

---

### Problem: Request shows 200 but no data in database

**Cause:** Database connection or name issue

**Fix:**
1. Check `.env.local` has:
   ```
   MONGODB_URI=mongodb+srv://...
   MONGODB_DB_NAME=test
   ```
2. Restart dev server
3. Try again

---

### Problem: JavaScript error in Console

**Cause:** Code error or missing dependency

**Fix:**
1. Check Console tab for error message
2. Copy the error
3. Check if `getBehaviorTracker` is defined:
   ```javascript
   typeof getBehaviorTracker
   // Should output: "function"
   ```

---

## 🧪 Manual API Test

If viewing a book doesn't work, test the API directly:

1. Open Console tab (F12)
2. Paste this code:

```javascript
fetch('/api/student/books/track', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    eventType: 'search',
    searchQuery: 'test'
  })
})
.then(r => r.json())
.then(data => console.log('Result:', data))
.catch(err => console.error('Error:', err));
```

3. Press Enter

**Expected:** `Result: { ok: true, interactionId: '...' }`

**If this works:** API is fine, issue is with frontend tracking

**If this fails:** API has an issue, check server logs

---

## 📋 Complete Test Checklist

### Test Book Views:
- [ ] Hard refresh browser (Ctrl + Shift + R)
- [ ] Login as demo@student.com
- [ ] Open DevTools Network tab
- [ ] Go to catalog
- [ ] Click on a book
- [ ] See POST to /api/student/books/track
- [ ] Status is 200
- [ ] Run verification script
- [ ] See "view" interaction in database

### Test Searches:
- [ ] Go to catalog
- [ ] Type in search box
- [ ] Wait 300ms
- [ ] See POST to /api/student/books/track
- [ ] Payload has eventType: "search"
- [ ] Run verification script
- [ ] See "search" interaction in database

### Test Bookmarks:
- [ ] On book detail page
- [ ] Click bookmark button
- [ ] See POST to /api/student/books/bookmark
- [ ] Status is 200
- [ ] Run verification script
- [ ] See "bookmark" interaction in database

---

## ✅ Success Indicators

You'll know everything is working when:

1. **Network tab shows tracking requests**
   - POST to /api/student/books/track
   - Status 200
   - Response: { ok: true, ... }

2. **Database has interactions**
   - Verification script shows interactions
   - Multiple event types (view, search, bookmark)
   - Recent timestamps

3. **Recommendations update**
   - Dashboard shows "Updated just now"
   - Refresh button works
   - Recommendations change based on views

---

## 🎯 What to Do Right Now

1. **Hard refresh browser:** `Ctrl + Shift + R`
2. **View a book:** Click any book in catalog
3. **Check Network tab:** Look for tracking request
4. **Run script:** `node scripts/verify-interaction-tracking.js demo@student.com`

If you see interactions in the database, **it's working!** 🎉

If not, follow the troubleshooting steps above.

---

## 📞 Need More Help?

Run the manual test guide:
```bash
node scripts/test-tracking-manually.js
```

This will show you detailed step-by-step instructions.

---

## 🔑 Key Points

- **Code is ready** - all changes are in place
- **Browser cache** - must hard refresh to load new code
- **Test by using** - view books, search, bookmark
- **Verify in database** - run verification script
- **Collection created automatically** - when first interaction is tracked

The collection doesn't exist yet because **no one has viewed a book with the new code**. Once you view a book (after hard refresh), the collection will be created automatically!
