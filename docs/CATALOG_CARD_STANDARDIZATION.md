# Catalog Card Standardization Guide

## Goal
Standardize all book cards across shelves and authors pages to match the catalog page design.

## Current State

### Catalog Page (Target Design)
- Book cover placeholder (aspect-2/3)
- Title (2 lines, text-sm, font-semibold)
- Author (text-[11px], line-clamp-1)
- Year (text-[11px])
- Description (text-[10px], 2 lines, if available)
- Status chip
- Borrow button (full width, stacked)
- Bookmark button (full width, stacked below borrow)

### Shelves Page (Current)
- No book cover
- Title, author, year, publisher in compact format
- Status chip and buttons on same line (horizontal)
- Needs to match catalog design

### Authors Page (Current)
- No book cover
- Title, author, year, publisher, shelf location
- Status chip and buttons on same line (horizontal)
- Needs to match catalog design

## Required Changes

### 1. Shelves Page (`src/app/student/shelves/[shelfId]/page.js`)

Replace the book card structure with:

```jsx
{items.map((book) => {
  const isBorrowingThis = borrowing === book._id;
  const lockedByOther = Boolean(borrowing) && !isBorrowingThis;
  const isBookmarked = bookmarkedBooks.has(book._id);
  const isBookmarkingThis = bookmarking === book._id;
  return (
    <div key={book._id} className="rounded-lg border border-gray-200 bg-white p-3 hover:shadow-md transition-shadow">
      <Link href={`/student/books/${book._id}`} className="block cursor-pointer">
        {/* Book Cover */}
        <div className="w-full aspect-2/3 rounded bg-gray-200 flex items-center justify-center text-gray-400 text-[10px] font-medium mb-2">
          Book Cover
        </div>

        {/* Book Details */}
        <div className="flex-1 flex flex-col">
          <h3 className="text-sm font-semibold text-gray-900 mb-1 leading-snug line-clamp-2">
            {book.title}
          </h3>
          <p className="text-[11px] text-gray-600 mb-1 line-clamp-1">
            {book.author}
          </p>
          <div className="text-[11px] text-gray-500 mb-2">
            {book.year && <span>{book.year}</span>}
          </div>

          {/* Description */}
          {book.description && (
            <p className="text-[10px] text-gray-600 mb-2 line-clamp-2 leading-relaxed">
              {book.description}
            </p>
          )}

          {/* Status */}
          <div className="mb-2">
            <StatusChip status={book.status} />
          </div>
        </div>
      </Link>

      {/* Action Buttons */}
      <div className="mt-auto space-y-2" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
        {/* Borrow Button */}
        {book.status === "available" && !["reference-only", "staff-only"].includes(book.loanPolicy || "") ? (
          <BorrowConfirmButton
            onConfirm={() => handleBorrow(book._id)}
            disabled={lockedByOther}
            busy={isBorrowingThis}
            className="w-full rounded-md bg-black px-4 py-2 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-50 transition-colors"
            wrapperClassName="w-full"
            borrowLabel="Borrow"
            confirmingLabel="Confirm?"
            confirmingTitle="Submit Borrow Request"
            confirmingMessage={`Send a borrow request for "${book.title}"?`}
            confirmButtonLabel="Submit Request"
            busyLabel="Borrowing..."
          />
        ) : /* ... other status messages ... */}
        
        {/* Bookmark Button */}
        <button
          onClick={(e) => handleToggleBookmark(book._id, e)}
          disabled={isBookmarkingThis}
          className={`w-full flex items-center justify-center gap-1.5 rounded-md px-4 py-2 text-xs font-medium transition-colors border ${
            isBookmarked
              ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
              : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
          } disabled:opacity-50`}
        >
          <Bookmark className={`h-3 w-3 ${isBookmarked ? "fill-current" : ""}`} />
          {isBookmarked ? "Bookmarked" : "Bookmark"}
        </button>
      </div>
    </div>
  );
})}
```

### 2. Authors Page (`src/app/student/authors/[authorId]/page.js`)

Apply the same structure as above.

## Key Changes

### Visual Structure
1. **Add book cover placeholder** - aspect-2/3 ratio
2. **Vertical layout** - Stack all elements vertically
3. **Consistent typography**:
   - Title: text-sm, font-semibold, 2 lines
   - Author: text-[11px], 1 line
   - Year: text-[11px]
   - Description: text-[10px], 2 lines
4. **Full-width buttons** - Stacked vertically with space-y-2
5. **Bookmark button** - Full width with icon + text

### Styling
- Card: `rounded-lg border border-gray-200 bg-white p-3`
- Hover: `hover:shadow-md transition-shadow`
- Buttons: Full width, stacked, consistent sizing

### Behavior
- Book info area is clickable link
- Action buttons prevent click-through
- Bookmark shows filled icon when active

## Benefits

1. **Consistency** - Same card design across all pages
2. **Better UX** - Familiar interface everywhere
3. **More Information** - Book cover and description visible
4. **Clearer Actions** - Full-width buttons are easier to click
5. **Professional Look** - Matches modern design patterns

## Implementation Steps

1. Update shelves page card structure
2. Update authors page card structure
3. Test on different screen sizes
4. Verify all buttons work correctly
5. Check bookmark status loads properly
6. Ensure navigation works as expected

## Testing Checklist

- [ ] Book cover placeholder displays
- [ ] Title truncates to 2 lines
- [ ] Author truncates to 1 line
- [ ] Description shows (if available)
- [ ] Status chip displays correctly
- [ ] Borrow button works
- [ ] Bookmark button works
- [ ] Card link navigates to book detail
- [ ] Buttons don't trigger navigation
- [ ] Responsive on mobile/tablet/desktop
- [ ] Hover effects work
- [ ] Loading states display correctly

## Summary

This standardization will create a consistent, professional book browsing experience across all pages in the application. Users will see the same familiar card design whether they're browsing the catalog, exploring a shelf, or viewing an author's books.
