# Academic Materials Implementation

## Overview
The system now supports three types of academic materials in addition to regular books:
- **Articles** (📄)
- **Journals** (📖)
- **Theses** (🎓)

## Database Schema

### Field: `resourceType`
- **Type**: String (nullable)
- **Values**: `"article"`, `"journal"`, `"thesis"`, or `null` (for regular books)
- **Location**: `books` collection

## Seeding Data

### Initial Seed
Run the seed script to add 10 academic materials (randomized distribution):
```bash
node scripts/seed-academic-materials.js
```

This creates:
- 4 Articles
- 3 Journals
- 3 Theses

### Migration
If you have existing data with the old `type` field, run the migration:
```bash
node scripts/migrate-academic-materials-type.js
```

## Filtering

### Frontend Filter Options
In the student books page, users can filter by:
- **Books** (default, includes items without `resourceType`)
- **Articles**
- **Journals**
- **Theses**

### API Implementation

#### Student Books API (`/api/student/books`)
The API maps frontend labels to database values:
```javascript
const resourceTypeMap = {
  "Books": "book",
  "Articles": "article",
  "Journals": "journal",
  "Theses": "thesis"
};
```

When "Books" is selected, it matches:
- Documents with `resourceType: "book"`
- Documents without `resourceType` field (legacy books)
- Documents with `resourceType: null`

### Query Examples

**Filter for Articles only:**
```javascript
{ resourceType: { $in: ["article"] } }
```

**Filter for Books only (excluding academic materials):**
```javascript
{
  $or: [
    { resourceType: { $in: ["book"] } },
    { resourceType: { $exists: false } },
    { resourceType: null }
  ]
}
```

**Filter for Articles + Journals:**
```javascript
{ resourceType: { $in: ["article", "journal"] } }
```

## API Endpoints Updated

### Student API
- ✅ `GET /api/student/books` - Includes `resourceType` in projection and filtering

### Admin API
- ✅ `GET /api/admin/books` - Includes `resourceType` in projection
- ✅ `GET /api/admin/books/[id]` - Returns full book with `resourceType`
- ✅ `PUT /api/admin/books/[id]` - Accepts and updates `resourceType`
- ✅ `POST /api/admin/books/create` - Accepts `resourceType` for new materials

## Testing

### Test Filters
Run the test script to verify filtering works correctly:
```bash
node scripts/test-academic-filters.js
```

This tests:
- Count by type
- Filter by individual types
- Filter by multiple types
- Books-only filter (excluding academic materials)
- Migration verification

## Sample Academic Materials

The seed includes diverse academic content:

**Articles:**
- Machine Learning Applications in Healthcare
- Sustainable Urban Development in Developing Nations
- Renewable Energy Storage Solutions
- Artificial Intelligence Ethics and Governance

**Journals:**
- Climate Change and Coastal Ecosystems
- Neural Networks and Natural Language Processing
- Behavioral Economics and Consumer Decision Making

**Theses:**
- Quantum Computing: A New Paradigm in Cryptography
- The Impact of Social Media on Political Discourse
- Gene Therapy Approaches for Rare Diseases

## Frontend Integration

The filter UI in `/src/app/student/books/page.js` includes checkboxes for:
```javascript
["Books", "Articles", "Journals", "Theses"]
```

Users can select multiple types to see combined results.

## Notes

- Academic materials typically don't have ISBNs (set to `null`)
- All materials use the same `books` collection
- The `resourceType` field is optional and backward compatible
- Regular books without `resourceType` are treated as "Books" in filters
