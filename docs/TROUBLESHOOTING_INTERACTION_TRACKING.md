# Troubleshooting: Interaction Tracking

## Problem

User interactions (book views, searches) are not being tracked or stored in the database.

---

## Quick Diagnosis

Run this script to check if tracking is working:

```bash
node scripts/verify-interaction-tracking.js
```

This will show:
- Total interactions in database
- Recent interactions
- Any tracking issues
- Index status

---

## Common Issues & Solutions

### Issue 1: No Interactions in Database

**Symptoms:**
- Script shows "0 total interactions"
- Recommendations are generic (not personalized)
- No data in `user_interactions` collection

**Possible Causes:**

#### A. Tracking API Not Being Called

**Check:**
1. Open browser DevTools (F12)
2. Go to Network tab
3. View a book or search
4. Look for POST to `/api/student/books/track`

**If you DON'T see the request:**
- Behavior tracker not initialized
- JavaScript errors preventing tracking
- Code not loaded (browser cache issue)

**Solution:**
```bash
# Hard refresh browser
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)

# Or restart dev server
rm -rf .next
npm run dev
```

#### B. Tracking API Failing

**Check:**
1. Open Network tab
2. Find `/api/student/books/track` request
3. Check status code

**If status is 401 (Unauthorized):**
- User not logged in
- Session expired
- Authentication issue

**Solution:**
- Log out and log back in
- Check session configuration
- Verify NextAuth setup

**If status is 400 (Bad Request):**
- Missing required fields
- Invalid data format

**Solution:**
- Check browser console for errors
- Verify behavior tracker is sending correct data

**If status is 500 (Server Error):**
- Database connection issue
- Server error

**Solution:**
- Check server logs
- Verify MongoDB connection
- Check `.env.local` has correct MONGODB_URI

#### C. Database Connection Issue

**Check:**
```bash
# Test MongoDB connection
node scripts/verify-interaction-tracking.js
```

**If connection fails:**
- MongoDB not running
- Wrong connection string
- Network issue

**Solution:**
- Verify MongoDB is running
- Check MONGODB_URI in `.env.local`
- Test connection with MongoDB Compass

---

### Issue 2: Tracking Works But No Recent Activity

**Symptoms:**
- Old interactions exist
- No new interactions in last hour
- Script shows "No recent activity"

**Possible Causes:**

#### A. Users Not Browsing

**Check:**
- Are users actually viewing books?
- Are users searching?

**Solution:**
- Test manually by viewing books
- Check if pages are loading correctly

#### B. Tracking Stopped Working

**Check:**
1. View a book
2. Check Network tab
3. Look for tracking request

**If no request:**
- JavaScript error occurred
- Behavior tracker crashed
- Code was reverted

**Solution:**
- Check browser console for errors
- Restart dev server
- Verify code is correct

---

### Issue 3: Tracking API Returns Errors

**Symptoms:**
- Network tab shows failed requests
- Console shows error messages
- Status codes 400, 401, 404, 500

**Solutions by Status Code:**

#### 401 Unauthorized
```
Problem: User not authenticated
Solution: Log in as student user
```

#### 400 Bad Request
```
Problem: Invalid data sent to API
Check: Browser console for error details
Solution: Verify behavior tracker code
```

#### 404 Not Found (Book)
```
Problem: Trying to track non-existent book
Check: Book ID is valid
Solution: Only track existing books
```

#### 429 Rate Limit
```
Problem: Too many requests
Check: Rate limiter configuration
Solution: Wait and retry, or adjust rate limits
```

#### 500 Server Error
```
Problem: Server or database error
Check: Server logs for details
Solution: Fix database connection or server issue
```

---

### Issue 4: Interactions Stored But Missing Data

**Symptoms:**
- Interactions exist but incomplete
- Missing book titles, categories, etc.
- Script shows "missing information" warnings

**Possible Causes:**

#### A. Book Data Incomplete

**Check:**
```bash
# Verify book has required fields
node scripts/verify-interaction-tracking.js
```

**Solution:**
- Ensure books have title, author, categories
- Run Google Books enrichment if needed

#### B. API Not Fetching Book Details

**Check:**
- Look at stored interaction documents
- See if bookTitle, bookAuthor are present

**Solution:**
- Verify tracking API fetches book details
- Check `src/app/api/student/books/track/route.js`

---

### Issue 5: Old Interactions Not Cleaned Up

**Symptoms:**
- Interactions older than 90 days still exist
- Database growing too large
- Script shows "old interactions" warning

**Possible Cause:**
- TTL index not created or not working

**Solution:**
```bash
# Create TTL index
node scripts/setup-interaction-indexes.js
```

The TTL index automatically deletes interactions after 90 days.

---

## Verification Steps

### Step 1: Check Frontend Tracking

1. **Open browser DevTools (F12)**
2. **Go to Console tab**
3. **Type:**
   ```javascript
   // Check if tracker exists
   console.log(typeof getBehaviorTracker);
   // Should output: "function"
   ```

4. **View a book**
5. **Check Network tab**
6. **Look for:** POST to `/api/student/books/track`
7. **Status should be:** 200

### Step 2: Check Database

```bash
# Check if interactions are stored
node scripts/verify-interaction-tracking.js

# Check for specific user
node scripts/verify-interaction-tracking.js user@example.com
```

### Step 3: Check API Endpoint

1. **Navigate to:** `http://localhost:3000/student/books`
2. **Open Console (F12)**
3. **Run test:**
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
   .then(data => console.log('Result:', data));
   ```

4. **Expected:** `{ ok: true, interactionId: '...' }`

### Step 4: Verify Recommendations Update

```bash
# Check if recommendations use interactions
node scripts/check-user-recommendations.js user@example.com
```

---

## Debug Mode

### Enable Verbose Logging

Add to behavior tracker (`src/lib/behavior-tracker.js`):

```javascript
async trackBookView(bookId, bookData) {
  console.log('📊 Tracking view:', bookId, bookData);
  // ... rest of code
}

async trackSearch(query, filters) {
  console.log('🔍 Tracking search:', query, filters);
  // ... rest of code
}
```

### Check API Logs

Look at server console for:
```
Track interaction failed: [error message]
```

### Monitor Network Requests

1. Open DevTools Network tab
2. Filter by "track"
3. Watch for requests as you browse
4. Check request/response details

---

## Testing Checklist

### Frontend:
- [ ] Behavior tracker initialized
- [ ] trackBookView() called on book view
- [ ] trackSearch() called on search
- [ ] No JavaScript errors
- [ ] Network requests show 200 status

### Backend:
- [ ] API endpoint exists and responds
- [ ] Authentication working
- [ ] MongoDB connected
- [ ] Interactions being inserted
- [ ] No server errors

### Database:
- [ ] user_interactions collection exists
- [ ] Documents being inserted
- [ ] Indexes created
- [ ] TTL index working
- [ ] Data complete (no missing fields)

---

## Quick Fixes

### Fix 1: Restart Everything
```bash
# Stop dev server (Ctrl + C)
rm -rf .next
npm run dev

# Hard refresh browser
Ctrl + Shift + R
```

### Fix 2: Create Indexes
```bash
node scripts/setup-interaction-indexes.js
```

### Fix 3: Test Manually
```bash
# View a book
# Search for something
# Then check:
node scripts/verify-interaction-tracking.js
```

### Fix 4: Check Logs
```bash
# Server logs (in terminal running dev server)
# Browser console (F12)
# Network tab (F12)
```

---

## Expected Behavior

### When Viewing a Book:
1. User clicks on book
2. Book detail page loads
3. Behavior tracker calls `trackBookView()`
4. POST request to `/api/student/books/track`
5. API validates and stores interaction
6. Returns `{ ok: true, interactionId: '...' }`
7. Cache invalidates
8. Next recommendation refresh uses new data

### When Searching:
1. User types search query
2. After 300ms debounce
3. Behavior tracker calls `trackSearch()`
4. POST request to `/api/student/books/track`
5. API stores search interaction
6. Cache invalidates
7. Recommendations update

---

## Still Not Working?

### Collect Debug Info:

1. **Browser Console Output:**
   - Any errors?
   - Any warnings?

2. **Network Tab:**
   - Screenshot of failed request
   - Request payload
   - Response body

3. **Server Logs:**
   - Any error messages?
   - Stack traces?

4. **Database Check:**
   ```bash
   node scripts/verify-interaction-tracking.js
   ```
   - Copy output

5. **Code Verification:**
   - Is behavior tracker code correct?
   - Is tracking API code correct?
   - Were files modified?

### Get Help:

With the debug info above:
1. Check documentation
2. Review code changes
3. Test in different browser
4. Try incognito mode

---

## Prevention

### Best Practices:

1. **Always test tracking after code changes**
   ```bash
   node scripts/verify-interaction-tracking.js
   ```

2. **Monitor tracking in development**
   - Keep Network tab open
   - Watch for tracking requests
   - Check for errors

3. **Set up indexes properly**
   ```bash
   node scripts/setup-interaction-indexes.js
   ```

4. **Regular verification**
   - Check interaction count daily
   - Verify recent activity
   - Monitor for errors

---

## Summary

**Most Common Issue:** Tracking API not being called due to browser cache

**Quick Fix:** Hard refresh browser (Ctrl + Shift + R)

**Verification:** Run `node scripts/verify-interaction-tracking.js`

**If Still Broken:** Check browser console and Network tab for errors
