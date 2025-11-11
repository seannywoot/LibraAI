# Google Books API Integration - Scripts

## Quick Start

### Enrich All Books

```bash
# 1. Enrich main catalog
node scripts/upsert-google-books-data.js

# 2. Enrich personal libraries (scanned/uploaded books)
node scripts/upsert-personal-library-google-books.js

# 3. Verify everything worked
node scripts/verify-google-books-enrichment.js
```

## Scripts Overview

### 1. upsert-google-books-data.js
**Purpose:** Enriches books in the main `books` collection

**What it does:**
- Fetches book data from Google Books API
- Adds cover images
- Adds categories and tags
- Adds descriptions and metadata
- Creates database indexes

**Usage:**
```bash
# Update books missing data
node scripts/upsert-google-books-data.js

# Force update all books
node scripts/upsert-google-books-data.js --force

# Update specific book
node scripts/upsert-google-books-data.js --isbn=9780134685991
```

### 2. upsert-personal-library-google-books.js
**Purpose:** Enriches books in the `personal_libraries` collection

**What it does:**
- Same as above, but for personal library books
- Handles barcode-scanned books
- Handles PDF-uploaded books
- Maintains user associations

**Usage:**
```bash
# Update personal library books missing data
node scripts/upsert-personal-library-google-books.js

# Force update all personal library books
node scripts/upsert-personal-library-google-books.js --force
```

### 3. verify-google-books-enrichment.js
**Purpose:** Verifies enrichment status and database health

**What it shows:**
- Coverage statistics (covers, categories, descriptions)
- Category distribution
- Database indexes status
- Sample enriched books
- Overall health score (A+ to D)

**Usage:**
```bash
node scripts/verify-google-books-enrichment.js
```

## Common Workflows

### Initial Setup (First Time)

```bash
# Step 1: Enrich main catalog
node scripts/upsert-google-books-data.js

# Step 2: Enrich personal libraries
node scripts/upsert-personal-library-google-books.js

# Step 3: Verify results
node scripts/verify-google-books-enrichment.js
```

### After Adding New Books

```bash
# Just run the enrichment (only updates missing data)
node scripts/upsert-google-books-data.js
```

### Weekly Maintenance

```bash
# Update any new books
node scripts/upsert-google-books-data.js
node scripts/upsert-personal-library-google-books.js
```

### Monthly Health Check

```bash
# Check system health
node scripts/verify-google-books-enrichment.js
```

### Fix Specific Book

```bash
# Update one book by ISBN
node scripts/upsert-google-books-data.js --isbn=9780134685991
```

### Refresh All Data

```bash
# Force update everything
node scripts/upsert-google-books-data.js --force
node scripts/upsert-personal-library-google-books.js --force
```

## What Gets Updated

| Field | Description | Example |
|-------|-------------|---------|
| `coverImage` / `thumbnail` | Book cover URL | `http://books.google.com/...` |
| `categories` | Array of categories | `["Computers", "Programming"]` |
| `tags` | Array of tags | `["Java", "Best practices"]` |
| `description` | Book summary | Full text description |
| `publisher` | Publisher name | `"Addison-Wesley"` |
| `year` | Publication year | `2018` |
| `isbn` | ISBN-13 | `"9780134685991"` |
| `pageCount` | Number of pages | `416` |
| `language` | Language code | `"en"` |
| `googleBooksId` | Google Books ID | `"ka2VUBqHiWkC"` |

## Expected Results

After running the scripts, you should see:

✅ **85%+** books with covers
✅ **95%+** books with categories
✅ **80%+** books with descriptions
✅ **A or A+** health score
✅ All database indexes created
✅ **3x better** recommendations

## Database Indexes

The scripts automatically create these indexes:

**Books Collection:**
- `isbn` - Fast ISBN lookups
- `title + author` - Duplicate detection
- `categories` - Category filtering
- `tags` - Tag-based search
- `googleBooksId` - Google Books reference
- `coverImage` - Cover availability

**Personal Libraries Collection:**
- `userId + addedAt` - User's books by date
- `isbn` - ISBN lookups
- `userId + isbn` - Duplicate prevention
- `categories` - Category filtering
- `tags` - Tag-based search
- `addedMethod` - Analytics

## Rate Limits

- ⏱️ 1 second delay between requests
- 📊 ~3,600 books/hour maximum
- 🔒 1,000 requests/day (free tier)
- 🆓 No API key required

## Troubleshooting

### Books Not Found

Some books may not be in Google Books:
- Verify ISBN is correct
- Check title spelling
- Older/obscure books may not exist
- Manual entry may be needed

**Solution:**
```bash
# Try force update
node scripts/upsert-google-books-data.js --force
```

### No Updates Happening

Books may already have data:
```bash
# Force update to refresh
node scripts/upsert-google-books-data.js --force
```

### Rate Limit Hit

If you hit the daily limit (1,000 requests):
- Wait 24 hours
- Consider getting a Google Books API key
- Process books in batches

### Check Status

```bash
# See what needs updating
node scripts/verify-google-books-enrichment.js
```

## Output Examples

### Successful Update
```
[1/50] Processing: Effective Java
   Author: Joshua Bloch
   ISBN: 9780134685991
   ✅ Updated:
      - Cover image added
      - Categories: Computers, Programming, Java
      - Tags: Java programming, Best practices
      - Description added
      - Publisher: Addison-Wesley
```

### Book Not Found
```
[2/50] Processing: Obscure Book
   Author: Unknown Author
   ISBN: N/A
   ⚠️  Not found in Google Books
```

### Summary Report
```
============================================================
📊 SUMMARY
============================================================
✅ Updated: 42 books
⏭️  Skipped: 5 books (already complete)
⚠️  Not found: 3 books
❌ Errors: 0 books
============================================================
```

### Health Score
```
============================================================
📈 OVERALL ENRICHMENT HEALTH SCORE
============================================================

   Score: 90/100
   Grade: A+ 🌟
   Status: Excellent! Your library is well-enriched.
```

## Documentation

For more details, see:

- **Full Guide:** `docs/GOOGLE_BOOKS_UPSERT_GUIDE.md`
- **Quick Reference:** `docs/GOOGLE_BOOKS_QUICK_REF.md`
- **Implementation Summary:** `docs/GOOGLE_BOOKS_IMPLEMENTATION_SUMMARY.md`

## Support

### Check Logs
Scripts provide detailed output showing:
- Progress for each book
- What was updated
- Any errors or warnings
- Final statistics

### Verify Results
```bash
# Check database directly
node scripts/verify-google-books-enrichment.js

# Or check in admin panel
# Go to /admin/books
```

### Re-run Safely
All scripts are idempotent:
- Safe to run multiple times
- Only updates missing data
- No data loss on re-run

## Performance

| Books | Time | Rate |
|-------|------|------|
| 10 | ~15 sec | 0.67/sec |
| 50 | ~1 min | 0.83/sec |
| 100 | ~2 min | 0.83/sec |
| 500 | ~10 min | 0.83/sec |

## Success Checklist

After running scripts, verify:

- [ ] Run main enrichment script
- [ ] Run personal library enrichment script
- [ ] Run verification script
- [ ] Check health score is A or A+
- [ ] Verify covers display in UI
- [ ] Test recommendations
- [ ] Check categories are correct
- [ ] Verify indexes are created

## Quick Commands Reference

```bash
# Enrich main catalog
node scripts/upsert-google-books-data.js

# Enrich personal libraries
node scripts/upsert-personal-library-google-books.js

# Verify everything
node scripts/verify-google-books-enrichment.js

# Force update all
node scripts/upsert-google-books-data.js --force

# Update specific book
node scripts/upsert-google-books-data.js --isbn=9780134685991
```

## Need Help?

1. Check the full documentation in `docs/`
2. Run verification script to see status
3. Check script output for errors
4. Verify MongoDB connection
5. Check internet connectivity

---

**Ready to enrich your library?** Start with:
```bash
node scripts/upsert-google-books-data.js
```
