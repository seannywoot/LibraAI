# Admin Shelves Page - 500 Error Fix

## Problems Fixed

### Issue 1: 500 Internal Server Error on Add/Edit
The admin shelves page was throwing "500 Internal Server Error" when trying to:
- Add a new shelf
- Edit shelf information

The error message indicated: "an existing index has the same name as the requested index"

### Issue 2: "Not Found" Error When Editing
After fixing the 500 error, editing shelves returned a "Not found" error when saving changes.

### Issue 3: 404 Error When Deleting Shelves with Books
When attempting to delete a shelf that has books linked to it, the API returned a 404 "Not Found" error instead of the expected 409 conflict error with a clear message.

## Root Causes

### Issue 1: Index Creation Error
The API routes were calling `createIndex()` on every request to ensure the unique index on `codeLower` existed. However, MongoDB throws an error if you try to create an index that already exists with the same name, even if the index definition is identical.

### Issue 2: Params Not Awaited
In Next.js 15+, the `params` object in dynamic routes is now a Promise and must be awaited. The code was accessing `params.id` directly instead of awaiting it first, causing the ID to be undefined and resulting in "not found" errors.

### Issue 3: Malformed Regex in DELETE Route
The regex pattern used to check if books reference a shelf code was corrupted, causing the DELETE operation to fail with unclear errors. The regex escape sequence was malformed, preventing proper validation of book references.

## Solutions

### Fix 1: Idempotent Index Creation
Modified both API routes to check if the index exists before attempting to create it.

### Fix 2: Await Params
Updated all methods in the dynamic route to properly await the `params` object.

### Fix 3: Correct Regex Pattern
Fixed the regex escape sequence in the DELETE method to properly validate book references before allowing shelf deletion.

### Files Changed
1. `src/app/api/admin/shelves/route.js` (POST method - index fix)
2. `src/app/api/admin/shelves/[id]/route.js` (GET, PUT, DELETE methods - all fixes applied)
3. `src/app/admin/shelves/page.js` (Added toast notifications)
4. `src/app/admin/authors/page.js` (Added toast notifications)

### Implementation Details

#### Fix 1: Index Creation
```javascript
// Before: This would fail if index already existed
await shelves.createIndex({ codeLower: 1 }, { unique: true });

// After: Check first, then create only if needed
try {
  const indexes = await shelves.indexes();
  const hasCodeLowerIndex = indexes.some(idx => idx.name === 'codeLower_1');
  if (!hasCodeLowerIndex) {
    await shelves.createIndex({ codeLower: 1 }, { unique: true });
  }
} catch (indexErr) {
  // Index might already exist, continue
  console.log("Index creation note:", indexErr.message);
}
```

#### Fix 2: Params Handling
```javascript
// Before: Direct access (Next.js 15+ incompatible)
export async function PUT(request, { params }) {
  const _id = safeObjectId(params.id);
  // ...
}

// After: Await params first
export async function PUT(request, { params }) {
  const { id } = await params;
  const _id = safeObjectId(id);
  // ...
}
```

#### Fix 3: Regex Pattern in DELETE
```javascript
// Before: Malformed regex (caused errors)
const codeRegex = new RegExp(`^${shelf.code.replace(/[.*+?^${}()|[\]\\]/g, "\\[UUID]")}$`, "i");

// After: Correct regex escape
const codeRegex = new RegExp(`^${shelf.code.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
```

#### Fix 4: Toast Notifications
Replaced browser `alert()` calls with professional toast notifications:
```javascript
// Before
catch (e) { alert(e?.message || "Error"); }

// After
catch (e) { showToast(e?.message || "Failed to add shelf", "error"); }
```

## Testing
After these fixes, you should be able to:
- ✅ Add new shelves without errors
- ✅ Edit existing shelf information
- ✅ Delete shelves that have no books
- ✅ Get proper error message when trying to delete shelves with books
- ✅ The unique constraint on shelf codes still works properly

## Technical Details
- The index `codeLower_1` ensures shelf codes are unique (case-insensitive)
- The fix makes index creation idempotent - safe to call multiple times
- No database migration needed - existing indexes remain unchanged
