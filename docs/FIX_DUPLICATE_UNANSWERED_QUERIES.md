# Fix Duplicate Unanswered Queries

## Problem

You're seeing multiple separate entries for the same question in the Unanswered Queries page:
- "What are the books?" appears 3 times
- "how about you?" appears 2 times

**This is wrong!** Each unique query should appear only ONCE with a `totalAttempts` count.

## Root Cause

The issue was in the duplicate detection logic in `src/app/api/chat/analytics/unanswered/route.js`:

1. **Regex escaping issue** - Special characters in queries weren't being escaped
2. **ConversationId matching** - Null conversationId wasn't being handled properly

## Fix Applied

### Code Changes

**File:** `src/app/api/chat/analytics/unanswered/route.js`

**Before:**
```javascript
const existingLog = await unansweredQueriesCollection.findOne({
  userId: logEntry.userId,
  query: { $regex: new RegExp(`^${query}$`, 'i') },
  conversationId: conversationId || null,
  resolved: false
});
```

**After:**
```javascript
// Escape special regex characters
const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Build proper query
const findQuery = {
  userId: logEntry.userId,
  query: { $regex: new RegExp(`^${escapedQuery}$`, 'i') },
  resolved: false
};

// Handle null conversationId properly
if (conversationId) {
  findQuery.conversationId = conversationId;
} else {
  findQuery.conversationId = null;
}

const existingLog = await unansweredQueriesCollection.findOne(findQuery);
```

## Clean Up Existing Duplicates

### Option 1: Run Cleanup Script (Recommended)

```bash
# Set your MongoDB connection string
export MONGODB_URI="your_mongodb_connection_string"

# Run the cleanup script
node scripts/cleanup-duplicate-unanswered-queries.js
```

**What it does:**
- Finds all duplicate entries (same user + query + conversationId)
- Merges them into single entries
- Calculates correct `totalAttempts` count
- Keeps oldest entry, deletes duplicates
- Shows summary of what was cleaned

**Example output:**
```
Found 5 groups with duplicates

Merging: "What are the books?"
  User: Seanny
  Duplicates: 3
  Total Attempts: 3
  ✓ Merged into 1 entry, deleted 2 duplicates

Merging: "how about you?"
  User: Aaronpogi
  Duplicates: 2
  Total Attempts: 2
  ✓ Merged into 1 entry, deleted 1 duplicate

=== Cleanup Summary ===
Groups merged: 2
Duplicate entries deleted: 3
✓ Cleanup complete!
```

### Option 2: Manual Database Cleanup

If you prefer to clean up manually:

```javascript
// Connect to MongoDB
use library_database

// Find duplicates
db.unanswered_queries.aggregate([
  { $match: { resolved: false } },
  {
    $group: {
      _id: {
        userId: '$userId',
        query: { $toLower: '$query' },
        conversationId: '$conversationId'
      },
      count: { $sum: 1 },
      docs: { $push: '$$ROOT' }
    }
  },
  { $match: { count: { $gt: 1 } } }
])

// For each duplicate group, manually:
// 1. Keep one entry
// 2. Update totalAttempts to sum of all
// 3. Delete the rest
```

### Option 3: Delete All and Start Fresh

If you want to start clean:

```javascript
// Connect to MongoDB
use library_database

// Delete all unanswered queries
db.unanswered_queries.deleteMany({})

// Confirm
db.unanswered_queries.countDocuments() // Should return 0
```

## Verify Fix

After cleanup, test the system:

### Test 1: New Queries Should Not Duplicate

1. Go to chat page
2. Ask: "test question 1"
3. Ask: "test question 1" again (same question)
4. Ask: "test question 1" again (third time)
5. Go to `/admin/analytics/unanswered-queries`
6. **Expected:** Only ONE entry for "test question 1" with `totalAttempts: 3`

### Test 2: Different Queries Should Be Separate

1. Ask: "test question 2"
2. Ask: "test question 3" (different)
3. Go to analytics page
4. **Expected:** TWO separate entries (one for each question)

### Test 3: Auto-Resolution Works

1. Ask: "test question 4" twice
2. Ask: "different question" (move on)
3. Go to analytics page
4. Toggle to "Resolved" tab
5. **Expected:** "test question 4" appears in resolved list

## Expected Behavior

### Correct Display:

```
Unanswered Queries Analytics

Most Problematic Queries:
┌─────────────────────┬─────────────┬────────────────┬─────────────┐
│ Query               │ Occurrences │ Total Attempts │ Users       │
├─────────────────────┼─────────────┼────────────────┼─────────────┤
│ What are the books? │ 1           │ 3              │ 1 (Seanny)  │
│ how about you?      │ 1           │ 2              │ 1 (Aaronp.) │
└─────────────────────┴─────────────┴────────────────┴─────────────┘
```

### Wrong Display (What you saw):

```
Unanswered Queries Analytics

Recent Queries:
- What are the books? (Seanny, 11/11/2025)
- What are the books? (Seanny, 11/11/2025)  ← DUPLICATE
- What are the books? (Seanny, 11/11/2025)  ← DUPLICATE
- how about you? (Aaronpogi, 11/10/2025)
- how about you? (Aaronpogi, 11/10/2025)    ← DUPLICATE
```

## Prevention

The fix ensures:
- ✅ Special characters in queries are properly escaped
- ✅ Null conversationId is handled correctly
- ✅ Case-insensitive matching works properly
- ✅ Existing entries are updated, not duplicated
- ✅ `totalAttempts` counter increments correctly

## Monitoring

After the fix, monitor:
1. **No new duplicates** - Same query should only appear once
2. **Correct attempt counts** - `totalAttempts` should increment
3. **Proper grouping** - Queries grouped by user + query + conversation

## Troubleshooting

### Still seeing duplicates?

**Check:**
1. Code was properly updated (check git diff)
2. Server was restarted after code changes
3. Cleanup script ran successfully
4. MongoDB connection is correct

### Cleanup script fails?

**Common issues:**
- MongoDB connection string incorrect
- Database name wrong
- Collection doesn't exist yet
- Permission issues

**Solution:**
```bash
# Test connection first
node -e "const {MongoClient} = require('mongodb'); new MongoClient(process.env.MONGODB_URI).connect().then(() => console.log('OK')).catch(console.error)"
```

## Summary

**What was wrong:**
- Duplicate entries created for same query
- No proper deduplication logic

**What was fixed:**
- Regex escaping for special characters
- Proper null conversationId handling
- Update existing entries instead of creating new ones

**What to do now:**
1. Run cleanup script to merge existing duplicates
2. Test with new queries
3. Verify only one entry per unique query

---

**Status:** ✅ FIXED
**Action Required:** Run cleanup script
**Expected Result:** One entry per unique query with correct attempt count
