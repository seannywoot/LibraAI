# Bookmark Feature - Quick Reference

## For Students

### How to Bookmark a Book

**From Book Detail Page:**
1. Browse the catalog or search for a book
2. Click on a book to view its details
3. Click the **"Bookmark"** button (next to the borrow button)
4. The button will change to **"Bookmarked"** with a filled icon

**From Catalog (Quick Bookmark):**
1. Browse the catalog in grid or list view
2. Hover over any book card
3. Click the bookmark icon in the top-right corner of the card
4. Icon fills with amber color when bookmarked
5. No need to open the book detail page!

### How to View Bookmarked Books
1. Go to **My Library** page
2. Click the **"Bookmarked"** tab
3. See all your bookmarked books
4. Use search to filter bookmarked books
5. Switch between grid and list views

### How to Remove a Bookmark
1. Go to the book's detail page
2. Click the **"Bookmarked"** button
3. The bookmark will be removed

## For Developers

### API Endpoints

#### Toggle Bookmark
```javascript
POST /api/student/books/bookmark
Body: { bookId: "string" }
Response: { ok: true, bookmarked: true/false, message: "string" }
```

#### Check Bookmark Status
```javascript
GET /api/student/books/bookmark?bookId=<id>
Response: { ok: true, bookmarked: true/false }
```

#### Get Bookmarked Books
```javascript
GET /api/student/books/bookmarked?search=<optional>
Response: { ok: true, books: [...] }
```

### Database Schema

```javascript
// bookmarks collection
{
  _id: ObjectId,
  userId: ObjectId,        // Student who bookmarked
  bookId: ObjectId,        // Book that was bookmarked
  bookTitle: String,       // Cached book title
  bookAuthor: String,      // Cached book author
  createdAt: Date         // When bookmark was created
}
```

### Indexes

```javascript
// User's bookmarks sorted by date
{ userId: 1, createdAt: -1 }

// Unique constraint (one bookmark per user per book)
{ userId: 1, bookId: 1 } (unique)

// Find all users who bookmarked a book
{ bookId: 1 }
```

### Setup

```bash
# Create indexes and setup collection
node scripts/setup-bookmarks.js

# Test bookmark functionality
node scripts/test-bookmarks.js
```

### Component Usage

```javascript
// Import bookmark icon
import { Bookmark } from "@/components/icons";

// Toggle bookmark
async function handleToggleBookmark() {
  const res = await fetch("/api/student/books/bookmark", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ bookId: book._id }),
  });
  const data = await res.json();
  if (data.ok) {
    setIsBookmarked(data.bookmarked);
  }
}

// Check bookmark status
async function checkBookmarkStatus() {
  const res = await fetch(`/api/student/books/bookmark?bookId=${book._id}`);
  const data = await res.json();
  if (data.ok) {
    setIsBookmarked(data.bookmarked);
  }
}

// Bookmark button
<button onClick={handleToggleBookmark}>
  <Bookmark className={isBookmarked ? "fill-current" : ""} />
  {isBookmarked ? "Bookmarked" : "Bookmark"}
</button>
```

### Files Modified

**New Files:**
- `src/app/api/student/books/bookmark/route.js`
- `src/app/api/student/books/bookmarked/route.js`
- `scripts/setup-bookmarks.js`
- `scripts/test-bookmarks.js`

**Modified Files:**
- `src/components/icons.jsx` - Added Bookmark icon
- `src/app/student/library/page.js` - Added Bookmarked tab
- `src/app/student/books/[bookId]/page.js` - Added bookmark button

## Testing

### Manual Testing
1. ✅ Bookmark a book from detail page
2. ✅ See bookmark in My Library > Bookmarked tab
3. ✅ Remove bookmark from detail page
4. ✅ Bookmark disappears from Bookmarked tab
5. ✅ Search within bookmarked books
6. ✅ Switch between grid/list views
7. ✅ Bookmark state persists on refresh

### Automated Testing
```bash
node scripts/test-bookmarks.js
```

## Troubleshooting

### Bookmark button not working
- Check browser console for errors
- Verify user is logged in as student
- Check network tab for API response

### Bookmarked tab empty
- Verify bookmarks exist in database
- Check API response in network tab
- Ensure user ID matches bookmark userId

### Duplicate bookmarks
- Unique index should prevent this
- Run setup script to create indexes
- Check database for duplicate entries

## Performance

- Bookmarks are indexed for fast queries
- Search is performed on database, not in memory
- Cached book info reduces join queries
- Pagination can be added if needed

## Security

- Authentication required for all endpoints
- Students can only access their own bookmarks
- Book existence verified before bookmarking
- Invalid IDs rejected with proper error messages
