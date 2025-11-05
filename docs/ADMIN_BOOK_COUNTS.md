# Admin Book Counts Display

## Overview

The admin interface now displays book counts for both authors and shelves, making it easy to see how many books are associated with each entity.

## Authors Page (`/admin/authors`)

### Features

**Summary Statistics (Header)**
- Total number of authors
- Total number of books across all authors
- Displayed in colored badges at the top of the page

**Table Display**
- **Name Column**: Author name (clickable to view details)
- **Books Column**: Shows book count with visual badge
  - Number displayed in a rounded badge
  - Text showing "book" or "books"
  - Clickable to view author's books
- **Bio Column**: Author biography
- **Actions Column**: Edit and Delete buttons

### Book Count Display
```
┌─────────────────────────────────────────┐
│ [5] 5 books                             │
│  ↑    ↑                                 │
│  │    └─ Plural/singular text          │
│  └────── Count in badge                │
└─────────────────────────────────────────┘
```

### How It Works

1. **Fetches authors** from `/api/admin/authors`
2. **For each author**, fetches book count from `/api/admin/authors/[id]/books?pageSize=1`
3. **Displays count** in a styled badge with proper pluralization
4. **Calculates total** books across all authors for the summary

## Shelves Page (`/admin/shelves`)

### Features

**Table Display**
- **Code Column**: Shelf code (e.g., "A1")
- **Name Column**: Shelf name
- **Location Column**: Physical location
- **Books Column**: Number of books on the shelf
- **Capacity Column**: Maximum capacity (if set)
- **Actions Column**: Edit and Delete buttons

### Book Count Display

The shelves page shows:
- Book count for each shelf
- Clickable count that links to shelf details
- Real-time counts based on books collection

### How It Works

1. **Fetches shelves** from `/api/admin/shelves`
2. **For each shelf**, fetches book count from `/api/admin/shelves/[id]/books?pageSize=1`
3. **Displays count** in the Books column
4. **Links to detail page** showing all books on that shelf

## Detail Pages

### Author Detail (`/admin/authors/[id]`)

Shows:
- Author name and biography
- Complete list of books by the author
- Book details: title, year, shelf, status, ISBN, barcode
- Pagination for large book lists

### Shelf Detail (`/admin/shelves/[id]`)

Shows:
- Shelf code, name, and location
- Complete list of books on the shelf
- Book details: title, author, year, status, ISBN, barcode
- Pagination for large book lists

## API Endpoints

### Authors
```
GET /api/admin/authors
→ Returns list of authors

GET /api/admin/authors/[id]/books?page=1&pageSize=20
→ Returns books by specific author with count
```

### Shelves
```
GET /api/admin/shelves
→ Returns list of shelves

GET /api/admin/shelves/[id]/books?page=1&pageSize=20
→ Returns books on specific shelf with count
```

## Performance Considerations

### Current Implementation

**Authors Page:**
- Fetches authors list (1 query)
- Fetches book count for each author (N queries)
- Total: 1 + N queries per page load

**Shelves Page:**
- Fetches shelves list (1 query)
- Fetches book count for each shelf (N queries)
- Total: 1 + N queries per page load

### Why This Works

- Page size is limited (20 items default)
- Counts are fetched with `pageSize=1` (minimal data transfer)
- Results are not cached, ensuring real-time accuracy
- Acceptable performance for admin interface

### Future Optimization (if needed)

If performance becomes an issue with many authors/shelves:

1. **Aggregation Pipeline**: Use MongoDB aggregation to get counts in a single query
2. **Caching**: Cache counts with short TTL
3. **Background Jobs**: Pre-calculate counts periodically
4. **Lazy Loading**: Load counts on-demand when row is expanded

## Visual Examples

### Authors Page Header
```
┌────────────────────────────────────────────────────┐
│ Admin                                              │
│ Authors                                            │
│ Create, edit, and delete canonical authors.       │
│                                                    │
│ [48 authors]  [48 total books]                    │
│   ↑ gray         ↑ blue                           │
└────────────────────────────────────────────────────┘
```

### Authors Table Row
```
┌──────────────┬──────────────┬─────────────┬─────────┐
│ Name         │ Books        │ Bio         │ Actions │
├──────────────┼──────────────┼─────────────┼─────────┤
│ Harper Lee   │ [1] 1 book   │ American... │ Edit Del│
│ George Orwell│ [1] 1 book   │ English...  │ Edit Del│
│ Jane Austen  │ [1] 1 book   │ English...  │ Edit Del│
└──────────────┴──────────────┴─────────────┴─────────┘
```

## Benefits

1. **Quick Overview**: See at a glance which authors/shelves have books
2. **Easy Navigation**: Click counts to view detailed book lists
3. **Data Validation**: Identify authors/shelves with no books
4. **Collection Management**: Understand distribution of books
5. **Real-time Accuracy**: Counts always reflect current state

## Use Cases

### For Librarians

1. **Identify gaps**: Find authors with no books
2. **Balance collection**: See which authors/shelves need more books
3. **Verify seeding**: Confirm all seeded data is properly linked
4. **Manage capacity**: See which shelves are full or empty

### For Administrators

1. **Monitor collection**: Track total books and distribution
2. **Quality control**: Verify data integrity
3. **Plan acquisitions**: Identify areas needing expansion
4. **Generate reports**: Use counts for statistics

## Related Documentation

- [Authors Seeding Guide](./AUTHORS_SEEDING.md)
- [Shelves Seeding Guide](./SHELVES_SEEDING.md)
- [Complete Seeding Guide](./SEEDING_COMPLETE_GUIDE.md)
