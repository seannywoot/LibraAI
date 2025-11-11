# Transaction Database Field Reference

## Database Location

**Database Name:** `test`  
**Collection Name:** `transactions`

---

## Field Names for Verification

### Rejection Reason Fields

When you want to verify rejection reasons are stored, look for these fields:

```javascript
{
  status: "rejected",                    // Transaction status
  rejectionReason: "Text here",          // ✅ THE REJECTION REASON
  rejectedBy: "admin@libra.ai",          // Admin who rejected
  rejectedAt: ISODate("2025-11-07...")   // When rejected
}
```

**MongoDB Query to Check:**
```javascript
db.transactions.find({ 
  status: "rejected", 
  rejectionReason: { $exists: true } 
})
```

---

### Book Condition Fields

When you want to verify book conditions are stored, look for these fields:

```javascript
{
  status: "returned",                    // Transaction status
  bookCondition: "good",                 // ✅ THE BOOK CONDITION (good/fair/damaged)
  conditionNotes: "Optional notes",      // ✅ CONDITION NOTES (optional)
  returnedAt: ISODate("2025-11-10..."),  // When returned
  returnProcessedAt: ISODate("..."),     // When admin processed
  returnProcessedBy: "admin@libra.ai"    // Admin who processed
}
```

**MongoDB Query to Check:**
```javascript
db.transactions.find({ 
  status: "returned", 
  bookCondition: { $exists: true } 
})
```

---

### Archive Fields

When you want to verify archiving is working, look for these fields:

```javascript
{
  archived: true,                        // ✅ ARCHIVE FLAG
  archivedAt: ISODate("2025-11-10..."),  // ✅ WHEN ARCHIVED
  archivedBy: "admin@libra.ai"           // ✅ WHO ARCHIVED IT
}
```

**MongoDB Query to Check:**
```javascript
db.transactions.find({ archived: true })
```

---

## Complete Transaction Document Structure

Here's a real example from your database:

### Rejected Transaction Example

```javascript
{
  _id: ObjectId("690ceced5df8e1fd3c966e8b"),
  
  // Status
  status: "rejected",
  
  // ✅ REJECTION DATA
  rejectionReason: "Did not return last book borrowed.",
  rejectedBy: "libraaismartlibraryassistant@gmail.com",
  rejectedAt: ISODate("2025-11-07T01:06:46.802Z"),
  
  // Book Info
  bookTitle: "A Brief History of Time",
  bookAuthor: "Stephen Hawking",
  bookId: ObjectId("690b22bd4296fe3f82b67725"),
  
  // User Info
  userId: "student@demo.edu",
  userName: "Sean",
  
  // ✅ ARCHIVE DATA
  archived: true,
  archivedAt: ISODate("2025-11-08T13:47:07.363Z"),
  archivedBy: "libraaismartlibraryassistant@gmail.com"
}
```

### Returned Transaction Example

```javascript
{
  _id: ObjectId("690b5acb95d1f43abd848eb2"),
  
  // Status
  status: "returned",
  
  // ✅ CONDITION DATA
  bookCondition: "damaged",
  conditionNotes: "Torn Pages",
  returnedAt: ISODate("2025-11-10T16:34:57.120Z"),
  returnProcessedAt: ISODate("2025-11-10T16:34:57.120Z"),
  returnProcessedBy: "admin@libra.ai",
  
  // Book Info
  bookTitle: "Atomic Habits",
  bookAuthor: "James Clear",
  bookId: ObjectId("69071838f1f66f802dd5ca13"),
  
  // User Info
  userId: "student@demo.edu",
  userName: "Sean",
  
  // Borrow Info
  borrowedAt: ISODate("2025-11-10T16:33:38.862Z"),
  dueDate: ISODate("2025-11-19T00:00:00.000Z"),
  approvedBy: "admin@libra.ai",
  
  // ✅ ARCHIVE DATA
  archived: true,
  archivedAt: ISODate("2025-11-10T16:35:34.430Z"),
  archivedBy: "admin@libra.ai"
}
```

---

## All Available Fields

Here are all 18 fields currently in the transactions collection:

1. `_id` - Document ID (ObjectId)
2. `archived` - Archive flag (boolean)
3. `archivedAt` - Archive timestamp (Date)
4. `archivedBy` - Admin who archived (string)
5. `bookAuthor` - Book author name (string)
6. `bookId` - Book reference (ObjectId)
7. `bookTitle` - Book title (string)
8. `borrowedAt` - Borrow timestamp (Date)
9. `dueDate` - Due date (Date)
10. `loanPolicy` - Loan policy type (string)
11. `returnProcessedAt` - Return processing timestamp (Date)
12. `returnProcessedBy` - Admin who processed return (string)
13. `returnRequestedAt` - Return request timestamp (Date)
14. `returnedAt` - Return timestamp (Date)
15. `status` - Transaction status (string)
16. `updatedAt` - Last update timestamp (Date)
17. `userId` - User email (string)
18. `userName` - User display name (string)

**Note:** Some fields only appear in certain transaction types:
- `rejectionReason`, `rejectedBy`, `rejectedAt` - Only in rejected transactions
- `bookCondition`, `conditionNotes` - Only in returned transactions
- `archived`, `archivedAt`, `archivedBy` - Only in archived transactions

---

## How to Verify in MongoDB

### Option 1: MongoDB Compass (GUI)

1. Connect to your MongoDB database
2. Navigate to database: `test`
3. Open collection: `transactions`
4. Use filters:
   - For rejections: `{ status: "rejected", rejectionReason: { $exists: true } }`
   - For conditions: `{ status: "returned", bookCondition: { $exists: true } }`
   - For archives: `{ archived: true }`

### Option 2: MongoDB Shell

```bash
mongosh "your-connection-string"

use test
db.transactions.find({ rejectionReason: { $exists: true } }).pretty()
db.transactions.find({ bookCondition: { $exists: true } }).pretty()
db.transactions.find({ archived: true }).count()
```

### Option 3: Run Verification Scripts

```bash
# Show all field names and examples
node scripts/show-transaction-fields.js

# Verify rejection reasons
node scripts/verify-rejection-reasons.js

# Verify book conditions
node scripts/verify-condition-tracking.js
```

---

## Current Statistics

From your database (as of last check):

- **Total Transactions:** 39
- **With rejectionReason:** 4 (10.3%)
- **With bookCondition:** 3 (7.7%)
- **With conditionNotes:** 1 (2.6%)
- **Archived:** 36 (92.3%)
- **Status=rejected:** 10
- **Status=returned:** 26

---

## Quick Verification Checklist

To verify data is being stored:

- [ ] Check `rejectionReason` field exists in rejected transactions
- [ ] Check `bookCondition` field exists in returned transactions
- [ ] Check `conditionNotes` field exists when notes are provided
- [ ] Check `archived` field is true for archived transactions
- [ ] Check `archivedAt` and `archivedBy` fields exist in archives
- [ ] Verify field values match what was entered in the UI

---

## MongoDB Atlas Access

If using MongoDB Atlas:

1. Go to https://cloud.mongodb.com
2. Select your cluster
3. Click "Browse Collections"
4. Navigate to: `test` → `transactions`
5. Use the filter bar to search for specific fields

**Example Filters:**
```json
{ "rejectionReason": { "$exists": true } }
{ "bookCondition": "damaged" }
{ "archived": true }
```

---

## Related Scripts

- `scripts/show-transaction-fields.js` - Show all fields and examples
- `scripts/verify-rejection-reasons.js` - Verify rejection reason storage
- `scripts/verify-condition-tracking.js` - Verify condition tracking
- `scripts/setup-transaction-condition-indexes.js` - Create database indexes
