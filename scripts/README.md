# Scripts Directory

This directory contains utility scripts for database management and maintenance.

## Available Scripts

### Book Descriptions

#### `add-book-descriptions.js`
Adds comprehensive descriptions to all books in the catalog to improve chatbot search capabilities.

**Purpose:** Enables topic-based book searches (e.g., "books about habits" finds "Atomic Habits")

**Usage:**
```bash
node scripts/add-book-descriptions.js
```

**Features:**
- Adds descriptions to 54 books across all categories
- Idempotent (safe to run multiple times)
- Skips books that already have descriptions
- Provides detailed progress reporting

**When to run:**
- After initial database setup
- When upgrading from a version without descriptions
- If descriptions are missing or incomplete

**Expected output:**
```
✅ Connected to MongoDB
✅ Added description to "Atomic Habits"
✅ Added description to "The 7 Habits of Highly Effective People"
...
📊 Summary:
   Updated: 54 books
   Skipped: 0 books
   Not Found: 0 books
```

---

### Chat History

#### `fix-conversation-dates.js`
Restores accurate dates for chat conversations that were corrupted by the auto-save bug.

**Purpose:** Fixes conversations showing today's date instead of their actual creation date

**Usage:**
```bash
node scripts/fix-conversation-dates.js
```

**Features:**
- Automatically detects corrupted dates (conversations showing today's date)
- Restores dates using `createdAt` field or `conversationId` timestamp
- Safe to run multiple times (only updates corrupted dates)
- Provides detailed progress reporting

**When to run:**
- After upgrading to the fixed chat interface
- If you notice all conversations showing today's date
- One-time migration after the date bug fix

**Expected output:**
```
✅ Connected to MongoDB
✅ Fixed conversation 1699123456789:
   Title: Book Recommendations
   Old date: 2024-11-12T10:30:00.000Z
   New date: 2024-11-05T14:22:00.000Z

📈 Migration Summary:
   ✅ Fixed: 15 conversations
   ⏭️  Skipped: 3 conversations
   ❌ Errors: 0 conversations
```

**Note:** After running this script, refresh your browser to see the corrected dates.

---

### Other Scripts

#### `add-slugs-to-books.js`
Adds URL-friendly slugs to books for better routing.

#### `fix-titles-browser.js`
Browser-based script for fixing chat conversation titles.

#### `test-*.js` / `test-*.mjs`
Various testing scripts for different features.

---

## Environment Setup

All scripts require:
1. `.env.local` file with `MONGODB_URI` configured
2. Node.js installed
3. Database connection available

**Example `.env.local`:**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
```

---

## Troubleshooting

### "MONGODB_URI not found"
- Ensure `.env.local` exists in project root
- Verify the file contains `MONGODB_URI=...`
- Check that the path is correct

### "Connection failed"
- Verify MongoDB cluster is running
- Check network connectivity
- Confirm credentials are correct
- Ensure IP address is whitelisted (for MongoDB Atlas)

### "Book not found"
- Verify books exist in database
- Check ISBN matches in script and database
- Run seed script first if database is empty

---

## Best Practices

1. **Backup First**: Always backup your database before running scripts
2. **Test Environment**: Run on development/staging before production
3. **Review Output**: Check the summary for any errors or warnings
4. **Verify Results**: Manually check a few records after running

---

## Contributing

When adding new scripts:
1. Add clear documentation in this README
2. Include error handling
3. Provide progress reporting
4. Make scripts idempotent when possible
5. Add usage examples
