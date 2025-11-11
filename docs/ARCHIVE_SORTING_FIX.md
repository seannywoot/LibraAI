# Archive Sorting Fix

## Issue

The archives page was showing transactions sorted by `requestedAt` and `borrowedAt` instead of `archivedAt`, making it difficult to find recently archived items.

## Solution

Updated the API to sort by `archivedAt` (newest first) when displaying archived transactions.

### Changes Made

**File:** `src/app/api/admin/transactions/route.js`

**Before:**
```javascript
const [items, total] = await Promise.all([
  transactions.find(query).sort({ requestedAt: -1, borrowedAt: -1 }).skip(skip).limit(pageSize).toArray(),
  transactions.countDocuments(query),
]);
```

**After:**
```javascript
// Sort by archivedAt if showing archived, otherwise by requestedAt/borrowedAt
const sortOrder = showArchived 
  ? { archivedAt: -1, requestedAt: -1 }
  : { requestedAt: -1, borrowedAt: -1 };

const [items, total] = await Promise.all([
  transactions.find(query).sort(sortOrder).skip(skip).limit(pageSize).toArray(),
  transactions.countDocuments(query),
]);
```

## Behavior

### Main Transactions Page (`/admin/transactions`)
- Sorts by `requestedAt` and `borrowedAt` (newest first)
- Shows active (non-archived) transactions

### Archives Page (`/admin/transactions/archives`)
- Sorts by `archivedAt` (newest archived first)
- Shows only archived transactions
- Most recently archived items appear at the top

## Verification

Run the test script to verify sorting:

```bash
node scripts/test-archive-sorting.js
```

**Expected Output:**
- Transactions listed from newest to oldest archived date
- Sort order verification passes
- Shows date range of archived items

**Sample Output:**
```
1. "A People's History of the United States"
   Archived: 11/11/2025, 10:15:53 AM

2. "How Children Learn"
   Archived: 11/11/2025, 12:41:31 AM

3. "Atomic Habits"
   Archived: 11/11/2025, 12:35:34 AM
```

## Benefits

1. **Better UX** - Admins can easily find recently archived transactions
2. **Logical Order** - Archives sorted by when they were archived, not when they were requested
3. **Consistent** - Main page sorts by request date, archives sort by archive date
4. **Efficient** - Uses existing `archivedAt` index for fast queries

## Testing

- [x] API sorts correctly when `showArchived=true`
- [x] Main transactions page still sorts by request date
- [x] Archives page shows newest archived first
- [x] Pagination works correctly with new sort order
- [x] Search and filters work with new sort order

## Related Files

- `src/app/api/admin/transactions/route.js` - API with sorting logic
- `src/app/admin/transactions/archives/page.js` - Archives page UI
- `scripts/test-archive-sorting.js` - Verification script
