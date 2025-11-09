# Bookmark Feature - Remaining Pages Implementation Guide

## Pages That Need Bookmark Feature

### 1. My Library Page - Borrowed Books Section
**File**: `src/app/student/library/page.js`
**Status**: ✅ Already has bookmarked tab, borrowed books section needs bookmark buttons

**Implementation**:
```javascript
// Add state
const [bookmarkedBorrowedBooks, setBookmarkedBorrowedBooks] = useState(new Set());

// Load bookmark status for borrowed books
async function loadBorrowedBookmarks(bookIds) {
  const checks = await Promise.all(
    bookIds.map(id => 
      fetch(`/api/student/books/bookmark?bookId=${id}`)
        .then(res => res.json())
    )
  );
  const bookmarked = new Set();
  checks.forEach(({ bookId, bookmarked: isBookmarked }) => {
    if (isBookmarked) bookmarked.add(bookId);
  });
  setBookmarkedBorrowedBooks(bookmarked);
}

// Add bookmark button to borrowed book cards
<button
  onClick={(e) => handleToggleBookmark(transaction.bookId, e)}
  className={`p-2 rounded-full ${
    bookmarkedBorrowedBooks.has(transaction.bookId)
      ? "bg-amber-100 text-amber-600"
      : "bg-gray-100 text-gray-400"
  }`}
>
  <Bookmark className={`h-4 w-4 ${
    bookmarkedBorrowedBooks.has(transaction.bookId) ? "fill-current" : ""
  }`} />
</button>
```

### 2. Shelf Detail Page
**File**: `src/app/student/shelves/[shelfId]/page.js`
**Status**: ⏳ Needs bookmark feature

**Current State**:
- Shows books from a specific shelf
- Has borrow functionality
- Uses similar card layout to catalog

**Implementation Steps**:
1. Add bookmark icon import
2. Add bookmark state management
3. Add `loadBookmarkStatus()` function
4. Add `handleToggleBookmark()` function
5. Add bookmark button to book cards (similar to catalog)

**Code Pattern**:
```javascript
import { Bookmark } from "@/components/icons";

const [bookmarkedBooks, setBookmarkedBooks] = useState(new Set());
const [bookmarking, setBookmarking] = useState(null);

// In loadBooks(), after setting items:
if (data.items && data.items.length > 0) {
  loadBookmarkStatus(data.items.map(b => b._id));
}

// Add bookmark button next to borrow button
<div className="flex items-center gap-3">
  {/* Borrow button */}
  <BorrowConfirmButton ... />
  
  {/* Bookmark button */}
  <button
    onClick={(e) => handleToggleBookmark(book._id, e)}
    disabled={bookmarking === book._id}
    className={`p-2 rounded-full ${
      bookmarkedBooks.has(book._id)
        ? "bg-amber-100 text-amber-600"
        : "bg-gray-100 text-gray-400"
    }`}
  >
    <Bookmark className={`h-4 w-4 ${
      bookmarkedBooks.has(book._id) ? "fill-current" : ""
    }`} />
  </button>
</div>
```

### 3. Authors Page
**File**: `src/app/student/authors/page.js`
**Status**: ℹ️ Shows authors, not books

**Note**: This page shows a list of authors, not individual books. No bookmark feature needed here unless there's an author detail page that shows their books.

**Check for**: `src/app/student/authors/[authorId]/page.js` or similar

### 4. Shelves Page
**File**: `src/app/student/shelves/page.js`
**Status**: ℹ️ Shows shelves, not books

**Note**: This page shows a list of shelves, not individual books. No bookmark feature needed here. The shelf detail page (above) is where books are shown.

## Implementation Priority

### High Priority
1. ✅ **Catalog Page** - DONE
2. ✅ **Book Detail Page** - DONE
3. ✅ **My Library - Bookmarked Tab** - DONE
4. ⏳ **Shelf Detail Page** - Needs implementation
5. ⏳ **My Library - Borrowed Books** - Needs bookmark buttons

### Medium Priority
6. ⏳ **Author Detail Page** - If it exists and shows books

### Low Priority
- Authors list page - Shows authors, not books
- Shelves list page - Shows shelves, not books

## Reusable Code Pattern

For any page that displays books, follow this pattern:

### 1. Imports
```javascript
import { Bookmark } from "@/components/icons";
import { showToast } from "@/components/ToastContainer";
```

### 2. State
```javascript
const [bookmarkedBooks, setBookmarkedBooks] = useState(new Set());
const [bookmarking, setBookmarking] = useState(null);
```

### 3. Load Bookmark Status
```javascript
async function loadBookmarkStatus(bookIds) {
  if (!bookIds || bookIds.length === 0) return;
  
  try {
    const bookmarkChecks = await Promise.all(
      bookIds.map(async (bookId) => {
        const res = await fetch(`/api/student/books/bookmark?bookId=${bookId}`, {
          cache: "no-store",
        });
        const data = await res.json().catch(() => ({}));
        return { bookId, bookmarked: data?.bookmarked || false };
      })
    );
    
    const newBookmarked = new Set();
    bookmarkChecks.forEach(({ bookId, bookmarked }) => {
      if (bookmarked) newBookmarked.add(bookId);
    });
    setBookmarkedBooks(newBookmarked);
  } catch (e) {
    console.error("Failed to load bookmark status:", e);
  }
}
```

### 4. Toggle Bookmark
```javascript
async function handleToggleBookmark(bookId, e) {
  e.preventDefault();
  e.stopPropagation();
  
  setBookmarking(bookId);
  try {
    const res = await fetch("/api/student/books/bookmark", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ bookId }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.ok)
      throw new Error(data?.error || "Failed to toggle bookmark");

    const newBookmarked = new Set(bookmarkedBooks);
    if (data.bookmarked) {
      newBookmarked.add(bookId);
    } else {
      newBookmarked.delete(bookId);
    }
    setBookmarkedBooks(newBookmarked);
    
    showToast(data.message, "success");
  } catch (e) {
    showToast(e?.message || "Failed to toggle bookmark", "error");
  } finally {
    setBookmarking(null);
  }
}
```

### 5. UI Component
```javascript
{/* Bookmark Button */}
<button
  onClick={(e) => handleToggleBookmark(book._id, e)}
  disabled={bookmarking === book._id}
  className={`p-2 rounded-full transition-colors ${
    bookmarkedBooks.has(book._id)
      ? "bg-amber-100 text-amber-600 hover:bg-amber-200"
      : "bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
  } disabled:opacity-50`}
  title={bookmarkedBooks.has(book._id) ? "Remove bookmark" : "Bookmark this book"}
>
  <Bookmark className={`h-4 w-4 ${bookmarkedBooks.has(book._id) ? "fill-current" : ""}`} />
</button>
```

## Testing Checklist

For each page where bookmarks are added:

- [ ] Bookmark button appears on all book cards
- [ ] Bookmark status loads correctly
- [ ] Clicking bookmark toggles state
- [ ] Visual feedback is correct (amber when bookmarked)
- [ ] Toast notifications appear
- [ ] Bookmark state persists on page refresh
- [ ] Works with search/filters
- [ ] Works with pagination
- [ ] No console errors
- [ ] Doesn't interfere with other buttons (borrow, etc.)

## Summary

The bookmark feature has been successfully implemented on:
- ✅ Catalog page (list and grid views)
- ✅ Book detail page
- ✅ My Library bookmarked tab
- ✅ Recommendation cards (all instances)

Remaining pages that show books and need bookmarks:
- ⏳ Shelf detail page (`src/app/student/shelves/[shelfId]/page.js`)
- ⏳ My Library borrowed books section (add bookmark buttons)
- ⏳ Author detail page (if it exists)

The implementation pattern is consistent and reusable across all pages.
