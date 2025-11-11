# Interaction Tracking Fixes

## Issues Found

### Issue 1: Book Views Not Being Tracked ❌
**Problem:** When users viewed book detail pages, no "view" interactions were recorded. Only "search" interactions were being tracked.

**Root Cause:** The book detail page (`src/app/student/books/[bookId]/page.js`) was NOT calling `trackBookView()` from the behavior tracker.

**Fix Applied:**
1. Added import: `import { getBehaviorTracker } from "@/lib/behavior-tracker";`
2. Added tracking call in `useEffect` when book loads:
   ```javascript
   // Track book view
   const tracker = getBehaviorTracker();
   tracker.trackBookView(book._id, {
     title: book.title,
     author: book.author,
     categories: book.categories,
     tags: book.tags
   });
   ```

---

### Issue 2: Database Name Not Explicitly Set ⚠️
**Problem:** APIs were using `client.db()` without specifying database name, relying on the URI default.

**Root Cause:** When `client.db()` is called without parameters, it uses the database from the MongoDB URI. While this works, it's better to be explicit.

**Fix Applied:**
Updated these files to explicitly use the configured database name:

1. **`src/app/api/student/books/track/route.js`**
   ```javascript
   const dbName = process.env.MONGODB_DB || process.env.MONGODB_DB_NAME || "test";
   const db = client.db(dbName);
   ```

2. **`src/app/api/student/books/bookmark/route.js`** (both POST and GET)
   ```javascript
   const dbName = process.env.MONGODB_DB || process.env.MONGODB_DB_NAME || "test";
   const db = client.db(dbName);
   ```

---

### Issue 3: Bookmarks Not Tracked as Interactions ❌
**Problem:** When users bookmarked books, it was stored in `bookmarks` collection but NOT tracked as an interaction in `user_interactions`.

**Root Cause:** The bookmark API only created bookmark records, didn't track the interaction for recommendations.

**Fix Applied:**
Added interaction tracking when bookmarking:
```javascript
// Track bookmark as an interaction
const now = new Date();
const expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days

await db.collection("user_interactions").insertOne({
  userId: user._id,
  userEmail: session.user.email,
  eventType: "bookmark",
  bookId: new ObjectId(bookId),
  bookTitle: book.title,
  bookAuthor: book.author,
  bookCategories: book.categories || [],
  bookTags: book.tags || [],
  timestamp: now,
  expiresAt,
});
```

---

### Issue 4: Tracking API Didn't Support Bookmark Events ❌
**Problem:** The tracking API only accepted "view" and "search" event types, not "bookmark".

**Fix Applied:**
Updated tracking API to support bookmark events:
1. Added "bookmark" to valid event types
2. Handle bookmark events same as view events (fetch book details)
3. Don't increment popularity score for bookmarks (only for views)

---

## Files Modified

### 1. `src/app/student/books/[bookId]/page.js`
- ✅ Added behavior tracker import
- ✅ Added `trackBookView()` call when book loads

### 2. `src/app/api/student/books/track/route.js`
- ✅ Explicitly set database name
- ✅ Added "bookmark" to valid event types
- ✅ Handle bookmark events

### 3. `src/app/api/student/books/bookmark/route.js`
- ✅ Explicitly set database name (POST and GET)
- ✅ Track bookmark as interaction

---

## Expected Behavior After Fixes

### When User Views a Book:
1. User clicks on book in catalog
2. Book detail page loads
3. `trackBookView()` is called
4. POST request to `/api/student/books/track` with `eventType: "view"`
5. Interaction stored in `test.user_interactions` collection
6. Book's `popularityScore` incremented
7. Cache invalidated
8. Next recommendation refresh includes this view

### When User Searches:
1. User types search query
2. After 300ms debounce
3. `trackSearch()` is called
4. POST request to `/api/student/books/track` with `eventType: "search"`
5. Interaction stored in `test.user_interactions` collection
6. Cache invalidated

### When User Bookmarks:
1. User clicks bookmark button
2. Bookmark stored in `test.bookmarks` collection
3. Interaction stored in `test.user_interactions` collection with `eventType: "bookmark"`
4. Cache invalidated
5. Recommendations updated to reflect interest

---

## Database Structure

### Collections Used:

**`test.user_interactions`** - All user interactions
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  userEmail: String,
  eventType: "view" | "search" | "bookmark",
  
  // For view and bookmark events:
  bookId: ObjectId,
  bookTitle: String,
  bookAuthor: String,
  bookCategories: Array,
  bookTags: Array,
  
  // For search events:
  searchQuery: String,
  searchFilters: Object,
  
  timestamp: Date,
  expiresAt: Date  // TTL index - auto-delete after 90 days
}
```

**`test.bookmarks`** - User bookmarks (separate from interactions)
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  bookId: ObjectId,
  bookTitle: String,
  bookAuthor: String,
  createdAt: Date
}
```

---

## Verification Steps

### Step 1: Clear Old Data (Optional)
```bash
# If you want to start fresh
# Connect to MongoDB and run:
db.user_interactions.deleteMany({ userEmail: "demo@student.com" })
```

### Step 2: Test Book Views
1. Login as `demo@student.com`
2. Go to catalog: `http://localhost:3000/student/books`
3. Click on a book to view details
4. Open DevTools Network tab
5. Look for POST to `/api/student/books/track`
6. Check payload: `{ eventType: "view", bookId: "..." }`
7. Status should be 200

### Step 3: Verify in Database
```bash
node scripts/verify-interaction-tracking.js demo@student.com
```

Should now show:
```
📈 Interactions by Type:
  view: X
  search: Y
  bookmark: Z
```

### Step 4: Test Bookmarks
1. On book detail page, click bookmark button
2. Check Network tab for POST to `/api/student/books/bookmark`
3. Status should be 200
4. Run verification script again
5. Should see bookmark interactions

### Step 5: Check Recommendations
```bash
node scripts/check-user-recommendations.js demo@student.com
```

Should now show personalized recommendations based on:
- Books viewed
- Searches performed
- Books bookmarked

---

## Testing Checklist

### Book Views:
- [ ] View a book detail page
- [ ] Network tab shows POST to `/api/student/books/track`
- [ ] Payload has `eventType: "view"`
- [ ] Status is 200
- [ ] Database shows view interaction
- [ ] Recommendations update

### Searches:
- [ ] Search for books in catalog
- [ ] Network tab shows POST to `/api/student/books/track`
- [ ] Payload has `eventType: "search"`
- [ ] Status is 200
- [ ] Database shows search interaction

### Bookmarks:
- [ ] Click bookmark button
- [ ] Network tab shows POST to `/api/student/books/bookmark`
- [ ] Status is 200
- [ ] Database shows bookmark in `bookmarks` collection
- [ ] Database shows bookmark in `user_interactions` collection
- [ ] Recommendations update

---

## Common Issues

### Issue: Still Only Seeing Search Interactions

**Cause:** Browser cache - old JavaScript still loaded

**Fix:**
```bash
# Hard refresh browser
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)

# Or restart dev server
rm -rf .next
npm run dev
```

### Issue: Network Request Fails

**Cause:** Not logged in or session expired

**Fix:**
- Log out and log back in
- Check session is valid

### Issue: Database Shows Wrong Collection

**Cause:** Environment variable not set correctly

**Fix:**
- Check `.env.local` has `MONGODB_DB_NAME=test`
- Restart dev server after changing env vars

---

## Summary

### What Was Fixed:
1. ✅ Book views now tracked when viewing book details
2. ✅ Database name explicitly set in all APIs
3. ✅ Bookmarks now tracked as interactions
4. ✅ Tracking API supports bookmark events

### What to Test:
1. View books → Check for "view" interactions
2. Search books → Check for "search" interactions
3. Bookmark books → Check for "bookmark" interactions
4. Verify all stored in `test.user_interactions`

### Expected Result:
- All three interaction types recorded
- Recommendations personalized based on all interactions
- Cache invalidates after each interaction
- Auto-refresh shows updated recommendations

---

## Next Steps

1. **Clear browser cache** (Ctrl + Shift + R)
2. **Test book views** - Click on books
3. **Verify tracking** - Run verification script
4. **Check recommendations** - Should be personalized
5. **Monitor** - Keep Network tab open to watch requests

The tracking system is now complete and should properly record all user interactions!
