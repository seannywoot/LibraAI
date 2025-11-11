# Interaction Tracking - Quick Check

## How to Verify Tracking is Working

### Step 1: Run Verification Script (30 seconds)

```bash
node scripts/verify-interaction-tracking.js
```

**What it checks:**
- ✅ If interactions are being stored
- ✅ Total interaction count
- ✅ Recent activity (last hour)
- ✅ Data completeness
- ✅ Index status

**Expected Output:**
```
✓ Connected to MongoDB
✓ Collection 'user_interactions' exists

📊 Total Interactions: 150

📈 Interactions by Type:
  view: 120
  search: 30

🕐 Recent Interactions (Last 10):
  1. VIEW - 11/12/2025, 2:30:00 PM
     User: student@example.com
     Book: The Great Gatsby by F. Scott Fitzgerald
  ...

✓ Tracking is working!
```

---

### Step 2: Test in Browser (1 minute)

1. **Open your app:** `http://localhost:3000`
2. **Login as student**
3. **Open DevTools:** Press F12
4. **Go to Network tab**
5. **View a book** (click on any book)
6. **Look for:** POST request to `/api/student/books/track`
7. **Check status:** Should be 200

**If you see the request with status 200:** ✅ Tracking is working!

**If you DON'T see the request:** ❌ Tracking is not working

---

### Step 3: Check Database Directly (Optional)

If you have MongoDB Compass or mongo shell:

```javascript
// Connect to your database
use personal-library

// Check collection exists
db.getCollectionNames()
// Should include "user_interactions"

// Count interactions
db.user_interactions.countDocuments()
// Should be > 0

// See recent interactions
db.user_interactions.find().sort({timestamp: -1}).limit(5)
```

---

## Common Scenarios

### Scenario 1: No Interactions Found

**Output:**
```
❌ Collection 'user_interactions' does not exist!
   This means no interactions have been tracked yet.
```

**Cause:** Tracking has never worked or collection was deleted

**Fix:**
1. Test manually by viewing a book
2. Check browser console for errors
3. Check Network tab for failed requests
4. See `TROUBLESHOOTING_INTERACTION_TRACKING.md`

---

### Scenario 2: Old Interactions Only

**Output:**
```
📊 Total Interactions: 50
📊 Interactions in last hour: 0
⚠️  No recent activity - users may not be browsing
```

**Cause:** Tracking worked before but stopped

**Fix:**
1. Hard refresh browser (Ctrl + Shift + R)
2. Restart dev server
3. Test manually
4. Check for JavaScript errors

---

### Scenario 3: Tracking Working!

**Output:**
```
✓ Tracking is working!
  150 total interactions
  12 in last hour
  Recommendations should be personalized
```

**Result:** Everything is good! ✅

---

## Quick Test Commands

### Test Tracking API:
```bash
node scripts/test-tracking-api.js
```

### Verify Interactions:
```bash
node scripts/verify-interaction-tracking.js
```

### Check Specific User:
```bash
node scripts/verify-interaction-tracking.js user@example.com
```

### Check Recommendations:
```bash
node scripts/check-user-recommendations.js user@example.com
```

---

## What to Look For

### ✅ Good Signs:
- Collection exists
- Total interactions > 0
- Recent activity (last hour) > 0
- All interactions have user info
- All view interactions have book info
- Indexes are created

### ⚠️ Warning Signs:
- No recent activity
- Missing user information
- Missing book information
- No indexes
- Old interactions not cleaned up

### ❌ Bad Signs:
- Collection doesn't exist
- Total interactions = 0
- API returns errors
- JavaScript errors in console
- Network requests fail

---

## Next Steps

### If Tracking is Working:
1. ✅ Interactions are being stored
2. ✅ Recommendations should be personalized
3. ✅ Cache invalidation should work
4. ✅ Auto-refresh should show updated recommendations

### If Tracking is NOT Working:
1. Read `TROUBLESHOOTING_INTERACTION_TRACKING.md`
2. Check browser console for errors
3. Check Network tab for failed requests
4. Verify code is correct
5. Hard refresh browser
6. Restart dev server

---

## Files to Check

### Frontend:
- `src/lib/behavior-tracker.js` - Tracking logic
- `src/app/student/books/page.js` - Catalog tracking
- `src/app/student/books/[bookId]/page.js` - Book detail tracking

### Backend:
- `src/app/api/student/books/track/route.js` - Tracking API

### Scripts:
- `scripts/verify-interaction-tracking.js` - Verification
- `scripts/test-tracking-api.js` - API testing
- `scripts/setup-interaction-indexes.js` - Index setup

### Documentation:
- `TROUBLESHOOTING_INTERACTION_TRACKING.md` - Detailed troubleshooting
- `INTERACTION_TRACKING_CHECK.md` - This file

---

## Summary

**To check if tracking is working:**

```bash
# Quick check
node scripts/verify-interaction-tracking.js

# If shows interactions: ✅ Working
# If shows 0 interactions: ❌ Not working
```

**To fix if not working:**

```bash
# 1. Hard refresh browser
Ctrl + Shift + R

# 2. Restart dev server
rm -rf .next
npm run dev

# 3. Test manually
# View a book, check Network tab

# 4. Run verification again
node scripts/verify-interaction-tracking.js
```

**Most common issue:** Browser cache - hard refresh fixes it!
