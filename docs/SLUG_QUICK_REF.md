# Slug Implementation - Quick Reference

## What Changed?

URLs now use human-readable slugs instead of MongoDB ObjectIDs for better SEO and user experience.

## URL Examples

| Type | Old URL | New URL |
|------|---------|---------|
| Author | `/admin/authors/507f1f77bcf86cd799439011` | `/admin/authors/jane-doe` |
| Shelf | `/admin/shelves/507f1f77bcf86cd799439012` | `/admin/shelves/a3` |
| Book | `/student/books/507f1f77bcf86cd799439013` | `/student/books/the-great-gatsby-f-scott-fitzgerald` |

## Migration Steps

### 1. Add Slugs to Existing Data

Run the migration script to add slugs to all existing books, authors, and shelves:

```bash
node scripts/add-slugs.js
```

This will:
- Add slugs to all books without them
- Add slugs to all authors without them
- Add slugs to all shelves without them
- Handle slug collisions automatically

### 2. Verify the Changes

After running the migration:

1. **Check Admin Pages:**
   - Go to `/admin/authors` and click on an author name
   - URL should now be `/admin/authors/author-name` instead of `/admin/authors/507f...`
   - Go to `/admin/shelves` and click on a shelf code
   - URL should now be `/admin/shelves/shelf-code` instead of `/admin/shelves/507f...`

2. **Check Student Pages:**
   - Go to `/student/books` and click on a book
   - URL should now be `/student/books/book-title-author-name` instead of `/student/books/507f...`
   - Check bookmarked books in `/student/library`
   - Check borrowed books in `/student/library`

3. **Test Backward Compatibility:**
   - Old ObjectID URLs should still work
   - Try accessing `/student/books/507f1f77bcf86cd799439013` (use an actual ID from your database)
   - Should redirect or display the book correctly

## How It Works

### Slug Generation

**Books:**
```javascript
// Format: title-author
"The Great Gatsby" by "F. Scott Fitzgerald"
→ "the-great-gatsby-f-scott-fitzgerald"
```

**Authors:**
```javascript
// Format: name
"Jane Doe"
→ "jane-doe"
```

**Shelves:**
```javascript
// Format: code
"A3"
→ "a3"
```

### API Lookup Priority

All API routes follow this lookup order:
1. Try to find by `slug` (new method)
2. Fall back to `code` (for shelves only)
3. Fall back to `_id` (ObjectID - old method)

This ensures backward compatibility with existing links.

### Automatic Slug Generation

New records automatically get slugs:
- Creating a new book → slug generated from title + author
- Creating a new author → slug generated from name
- Creating a new shelf → slug generated from code

## Troubleshooting

### Issue: Old URLs Not Working

**Solution:** The API routes support both slug and ObjectID lookups. If old URLs aren't working, check:
1. The ObjectID is valid
2. The record exists in the database
3. Check browser console for errors

### Issue: Duplicate Slugs

**Solution:** The system automatically handles collisions by appending numbers:
- `the-great-gatsby-f-scott-fitzgerald`
- `the-great-gatsby-f-scott-fitzgerald-1`
- `the-great-gatsby-f-scott-fitzgerald-2`

### Issue: Special Characters in Slugs

**Solution:** The `slugify()` function removes special characters:
- Spaces → hyphens
- Special chars → removed
- Multiple hyphens → single hyphen
- Leading/trailing hyphens → removed

## Code Examples

### Creating a Link with Slug

```javascript
// In React components
<Link href={`/student/books/${encodeURIComponent(book.slug || book._id)}`}>
  {book.title}
</Link>
```

### API Route with Slug Support

```javascript
// Try slug first, fall back to ObjectID
let book = await books.findOne({ slug: bookId });

if (!book && ObjectId.isValid(bookId)) {
  book = await books.findOne({ _id: new ObjectId(bookId) });
}
```

## Files Modified

### Frontend
- `src/app/admin/authors/page.js`
- `src/app/admin/shelves/page.js`
- `src/app/student/books/page.js`
- `src/app/student/books/[bookId]/page.js`
- `src/app/student/library/page.js`
- `src/components/recommendations-sidebar.jsx`

### Backend
- `src/app/api/admin/authors/route.js`
- `src/app/api/admin/authors/[id]/books/route.js`
- `src/app/api/admin/shelves/route.js`
- `src/app/api/admin/shelves/[id]/books/route.js`
- `src/app/api/student/books/[bookId]/route.js`
- `src/app/api/student/books/borrowed/route.js`

### Utilities
- `src/lib/slug.js` (already existed)

### Scripts
- `scripts/add-slugs.js` (new migration script)

## Next Steps

1. Run the migration script: `node scripts/add-slugs.js`
2. Test the application thoroughly
3. Monitor for any issues with slug generation
4. Consider adding custom slug editing in admin interface (future enhancement)
