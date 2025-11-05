# Complete Seeding Guide

This guide covers the complete seeding system for books, shelves, and authors in LibraAI.

## Quick Start

1. Navigate to `http://localhost:3000/admin/seed`
2. Click **"Fix Index"** (if you encounter any errors)
3. Click **"Seed Authors"** to create 48 authors with biographies
4. Click **"Seed Books & Shelves"** to create 48 books and 24 shelves

## What Gets Seeded

### Books (48 total)
- 12 categories: Fiction, Science, Technology, History, Biography, Self-Help, Business, Non-Fiction, Arts, Education, Children, Young Adult
- Multiple formats: Physical books and eBooks
- Various statuses: Available, Checked-out, Reserved
- Real book data: Actual titles, authors, ISBNs, publishers

### Shelves (24 total)
- Codes: A1-A3, B1-B3, C1-C3, D1-D2, E1-E2, F1-F2, G1-G2, H1-H2, I1-I2, J1-J2, K1-K2, L1-L2
- Organized by floor and section
- Linked to books via shelf codes

### Authors (48 total)
- One for each unique author in the book collection
- Complete biographies
- Linked to books via author names

## Seeding Order

**Recommended order:**
1. Fix Index (if needed)
2. Seed Authors
3. Seed Books & Shelves

This ensures all data is properly linked and indexed.

## Features

### Books & Shelves
- **Upsert Logic**: Safe to run multiple times (updates by ISBN)
- **Auto-generated Barcodes**: Each book gets a unique barcode
- **Shelf Creation**: Shelves are automatically created with locations
- **Book-Shelf Linking**: Books are linked to shelves via shelf codes

### Authors
- **Upsert Logic**: Updates existing authors with missing bios
- **Name Normalization**: Proper case-insensitive searching
- **Book Counts**: Automatically calculated from book collection
- **Rich Biographies**: Detailed information about each author

## Viewing Seeded Data

### Student Views
- **Books**: `/student/books` - Browse all books with filters
- **Shelves**: `/student/shelves` - Browse shelves with book counts
  - Click shelf → View books on that shelf
- **Authors**: `/student/authors` - Browse authors with book counts
  - Click author → View books by that author

### Admin Views
- **Books**: `/admin/books` - Full CRUD operations
- **Shelves**: `/admin/shelves` - Manage shelves
- **Authors**: `/admin/authors` - Manage authors
  - Click author → View and manage their books

## Data Relationships

```
Authors (48)
  ↓ (linked by name)
Books (48)
  ↓ (linked by shelf code)
Shelves (24)
```

### How Linking Works

**Books → Authors**
```javascript
// Books have an author field that matches the author name
book.author === author.name
// Example: "Harper Lee"
```

**Books → Shelves**
```javascript
// Books have a shelf field that matches the shelf code
book.shelf === shelf.code
// Example: "A1"
```

## Database Collections

### books
```javascript
{
  _id: ObjectId,
  title: "To Kill a Mockingbird",
  author: "Harper Lee",        // Links to authors.name
  shelf: "A1",                  // Links to shelves.code
  isbn: "9780061120084",
  year: 1960,
  publisher: "Harper Perennial",
  format: "Physical Book",
  category: "Fiction",
  status: "available",
  loanPolicy: "standard",
  barcode: "BC-123456",
  createdAt: Date,
  updatedAt: Date
}
```

### shelves
```javascript
{
  _id: ObjectId,
  code: "A1",                   // Unique shelf code
  codeLower: "a1",
  name: "Shelf A1",
  nameLower: "shelf a1",
  location: "Main Floor - Fiction Section",
  locationLower: "main floor - fiction section",
  createdAt: Date,
  updatedAt: Date
}
```

### authors
```javascript
{
  _id: ObjectId,
  name: "Harper Lee",           // Matches books.author
  nameLower: "harper lee",
  bio: "American novelist best known for...",
  createdAt: Date,
  updatedAt: Date
}
```

## Troubleshooting

### Duplicate Key Errors

If you see errors like:
```
E11000 duplicate key error collection: test.shelves index: codeLower_1 dup key: { codeLower: null }
```

**Solution:**
1. Click **"Fix Index"** on the seed page
2. This will drop and recreate indexes with proper sparse settings
3. Then run the seed again

### Books Not Showing on Shelves

**Check:**
1. Books have a valid `shelf` field (not null)
2. Shelf code exists in the shelves collection
3. Shelf code matches exactly (case-sensitive)

**Fix:**
- Re-run "Seed Books & Shelves" to ensure proper linking

### Authors Not Showing Book Counts

**Check:**
1. Books have an `author` field
2. Author name matches exactly (case-sensitive)
3. Author exists in authors collection

**Fix:**
- Re-run "Seed Authors" to ensure all authors exist
- Check that book author names match canonical author names

### Missing Biographies

**Fix:**
- Run "Seed Authors" again
- It will update existing authors with missing bios

## API Endpoints

### Seeding
- `POST /api/admin/books/seed` - Seed books and shelves
- `POST /api/admin/authors/seed` - Seed authors
- `POST /api/admin/shelves/fix-index` - Fix database indexes
- `POST /api/admin/shelves/cleanup` - Clean up invalid shelves

### Viewing Data
- `GET /api/student/books` - List books with filters
- `GET /api/student/shelves` - List shelves with book counts
- `GET /api/student/shelves/[shelfId]/books` - Books on a shelf
- `GET /api/student/authors` - List authors with book counts
- `GET /api/student/authors/[authorId]/books` - Books by an author

## Best Practices

1. **Always fix indexes first** if you encounter errors
2. **Seed authors before books** for better data consistency
3. **Run seeds multiple times** if needed - they're idempotent
4. **Check the results** after seeding to verify data
5. **Use the admin views** to verify all relationships are correct

## Data Statistics

After seeding, you should have:
- **48 books** across 12 categories
- **24 shelves** across 4 floors
- **48 authors** with complete biographies
- **100% linking** between books, shelves, and authors

## Next Steps

After seeding:
1. Test the student book browsing interface
2. Try filtering books by category, format, and availability
3. Browse shelves and view books on each shelf
4. Explore authors and their books
5. Test the recommendation system with diverse data
6. Try the search functionality
7. Test borrowing workflows
