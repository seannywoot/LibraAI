# Transaction Book Condition & Archiving - Quick Reference

## ✅ Status: FULLY FUNCTIONAL

All features are working correctly and database indexes have been created.

---

## Book Condition Tracking

### When Processing Returns

Admins can record book condition when marking a book as returned:

**Condition Options:**
- ✓ **Good** - No visible damage or wear
- ⚠ **Fair** - Minor wear but still usable  
- ✕ **Damaged** - Significant damage requiring attention

**Notes:**
- Required for damaged books
- Optional for good/fair conditions
- Max 100 characters

### What Gets Stored

```javascript
{
  bookCondition: "good" | "fair" | "damaged",
  conditionNotes: "Optional description",
  returnProcessedBy: "admin@example.com",
  returnProcessedAt: Date
}
```

### Book Status Updates

- **Damaged condition** → Book status set to "damaged"
- **Good/Fair condition** → Book status set to "available"

---

## Rejection Reason Tracking

### When Rejecting Requests

Admins MUST provide a reason when rejecting a borrow request:

**Requirements:**
- Minimum 3 characters
- Maximum 100 characters
- Cannot be empty

### What Gets Stored

```javascript
{
  status: "rejected",
  rejectionReason: "Reason for rejection",
  rejectedBy: "admin@example.com",
  rejectedAt: Date
}
```

### Display

- Shown in transactions table under status badge
- Displayed in red box with rose background
- Visible in both active and archived views
- Included in rejection email to student

---

## Archiving

### How to Archive

1. Transaction must be "returned" or "rejected"
2. Click "Archive" button
3. Transaction moves to archives

### What Gets Stored

```javascript
{
  archived: true,
  archivedAt: Date,
  archivedBy: "admin@example.com"
}
```

### Viewing Archives

- Navigate to: Admin → Transactions → "View Archives" button
- Filter by status (returned/rejected)
- Search by book, user, or email
- Permanently delete if needed

---

## Database Indexes

### Created Indexes

```javascript
// Single field
{ bookCondition: 1 }
{ archived: 1, archivedAt: -1 }

// Compound indexes
{ status: 1, bookCondition: 1 }
{ bookId: 1, bookCondition: 1 }
{ archived: 1, status: 1 }
```

### To Recreate Indexes

```bash
node scripts/setup-transaction-condition-indexes.js
```

### To Verify Implementation

```bash
# Verify condition tracking
node scripts/verify-condition-tracking.js

# Verify rejection reasons
node scripts/verify-rejection-reasons.js
```

---

## Current Statistics

From verification (as of last check):

- **Active Transactions:** 2
- **Archived Transactions:** 36
- **Book Conditions:**
  - Good: 2
  - Fair: 0
  - Damaged: 1
- **Rejections:**
  - Total Rejected: 10
  - With Reason: 4
  - Without Reason: 6 (older transactions before validation was enforced)

---

## API Endpoints

### Reject Request with Reason

```javascript
POST /api/admin/transactions

{
  transactionId: "...",
  action: "reject",
  reason: "Reason for rejection (3-100 chars)"
}
```

### Process Return with Condition

```javascript
POST /api/admin/transactions

{
  transactionId: "...",
  action: "return",
  bookCondition: "good" | "fair" | "damaged",
  conditionNotes: "Optional notes"
}
```

### Archive Transaction

```javascript
POST /api/admin/transactions

{
  transactionId: "...",
  action: "archive"
}
```

### Get Archived Transactions

```javascript
GET /api/admin/transactions?showArchived=true
```

---

## UI Locations

### Main Transactions Page
- Path: `/admin/transactions`
- Shows active (non-archived) transactions
- Return dialog with condition selection
- Archive button for completed transactions

### Archives Page
- Path: `/admin/transactions/archives`
- Shows only archived transactions
- Displays condition badges
- Delete permanently option

---

## Example Workflow

```
1. Student requests book
   ↓
2. Admin approves
   ↓
3. Student borrows book
   ↓
4. Student requests return
   ↓
5. Admin processes return
   → Selects condition (good/fair/damaged)
   → Adds notes if damaged
   → Book status updated
   ↓
6. Transaction marked as "returned"
   ↓
7. Admin archives transaction
   ↓
8. Transaction moves to archives
   ↓
9. Can be permanently deleted if needed
```

---

## Files Reference

### API Routes
- `src/app/api/admin/transactions/route.js` - Main transaction logic
- `src/app/api/admin/transactions/[id]/route.js` - Delete endpoint

### UI Pages
- `src/app/admin/transactions/page.js` - Active transactions
- `src/app/admin/transactions/archives/page.js` - Archives view

### Scripts
- `scripts/setup-transaction-condition-indexes.js` - Create indexes
- `scripts/verify-condition-tracking.js` - Verify condition tracking
- `scripts/verify-rejection-reasons.js` - Verify rejection reasons

### Documentation
- `docs/TRANSACTION_CONDITION_ARCHIVING_ANALYSIS.md` - Full analysis
- `docs/TRANSACTION_CONDITION_QUICK_REF.md` - This document

---

## Troubleshooting

### Condition not saving?
- Check browser console for errors
- Verify admin is logged in
- Ensure transaction status is "borrowed" or "return-requested"

### Archives not showing?
- Verify `showArchived=true` parameter
- Check if transactions are actually archived
- Run verification script to check data

### Slow queries?
- Run index setup script
- Check MongoDB Atlas performance metrics
- Verify indexes exist with verification script

---

## Next Steps (Optional Enhancements)

1. **Condition History Report**
   - Track which books are frequently damaged
   - Generate reports for library management

2. **Automated Alerts**
   - Email notifications when books are damaged
   - Dashboard alerts for damaged books

3. **Student Accountability**
   - Link damaged books to student records
   - Track students with multiple damaged returns

4. **Bulk Archive**
   - Archive multiple transactions at once
   - Auto-archive old completed transactions
