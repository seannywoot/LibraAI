# Admin Authors Page - Total Books Count Fix

## Problem

The admin authors page was showing incorrect "total books" count that would decrease when adding new authors. This happened because:

1. The total was calculated by summing `bookCount` for only the authors visible on the current page
2. When pagination changed or a new author was added, different authors would be visible, causing the total to fluctuate
3. The count didn't represent the actual total number of books in the database

## Solution

Created a new stats endpoint that fetches the actual total book count directly from the database, independent of pagination or author filtering.

### Changes Made

1. **New API Endpoint**: `src/app/api/admin/authors/stats/route.js`
   - Returns accurate total counts for both authors and books
   - Queries the database directly for counts
   - Independent of pagination

2. **Updated Authors Page**: `src/app/admin/authors/page.js`
   - Added `totalBooks` state variable
   - Fetches stats in parallel with authors list
   - Displays the accurate total book count from stats endpoint

### API Endpoint

```
GET /api/admin/authors/stats
```

**Response:**
```json
{
  "ok": true,
  "totalBooks": 150,
  "totalAuthors": 25
}
```

### Benefits

- Accurate total book count that doesn't change based on pagination
- Better performance by fetching stats once instead of calculating from all authors
- Consistent display regardless of which page the user is viewing
- Clear separation between paginated data and aggregate statistics

### Testing

Run the test script to verify the fix:

```bash
node scripts/test-authors-stats.js
```

The test will:
1. Fetch stats from the new endpoint
2. Verify the counts are accurate
3. Check consistency with the authors list endpoint

### UI Display

The authors page now shows:
- **Total Authors**: Count of all authors (from paginated response)
- **Total Books**: Actual count of all books in database (from stats endpoint)

Both counts remain stable and accurate regardless of:
- Current page number
- Search filters
- Adding/removing authors
