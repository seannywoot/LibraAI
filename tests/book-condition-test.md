# Book Condition Tracking - Test Plan

## Test Scenarios

### 1. Return Book in Good Condition
**Steps:**
1. Navigate to Admin > Transactions
2. Find a borrowed or return-requested book
3. Click "Confirm Return" or "Mark Returned"
4. In the dialog, select "Good Condition"
5. Optionally add notes
6. Click "Confirm Return"

**Expected Results:**
- Transaction status changes to "returned"
- Book condition badge shows "Good" with green checkmark
- Book status becomes "available"
- Notes are displayed if provided

### 2. Return Book in Fair Condition
**Steps:**
1. Navigate to Admin > Transactions
2. Find a borrowed or return-requested book
3. Click "Confirm Return" or "Mark Returned"
4. In the dialog, select "Fair Condition"
5. Add optional notes (e.g., "Minor cover wear")
6. Click "Confirm Return"

**Expected Results:**
- Transaction status changes to "returned"
- Book condition badge shows "Fair" with amber warning icon
- Book status becomes "available"
- Notes are displayed below the badge

### 3. Return Damaged Book
**Steps:**
1. Navigate to Admin > Transactions
2. Find a borrowed or return-requested book
3. Click "Confirm Return" or "Mark Returned"
4. In the dialog, select "Damaged"
5. Try to submit without notes - should show error
6. Add notes describing damage (e.g., "Pages torn, spine broken")
7. Click "Confirm Return"

**Expected Results:**
- Validation error if notes are empty
- Transaction status changes to "returned"
- Book condition badge shows "Damaged" with red X
- Book status becomes "damaged" (NOT available)
- Damage notes are displayed

### 4. View Condition in Archives
**Steps:**
1. Archive a returned transaction with condition data
2. Navigate to Admin > Transactions > View Archives
3. Find the archived transaction

**Expected Results:**
- Condition badge is visible in archives
- Condition notes are displayed
- Color coding matches the condition level

### 5. Cancel Return Dialog
**Steps:**
1. Click "Confirm Return" on a transaction
2. Select a condition and add notes
3. Click "Cancel"

**Expected Results:**
- Dialog closes
- No changes are saved
- Transaction remains in original state

### 6. Default Condition Behavior
**Steps:**
1. Open return dialog
2. Verify default selection

**Expected Results:**
- "Good Condition" is pre-selected by default
- Notes field is empty

## Edge Cases to Test

### Missing Condition Data
- Old transactions without condition data should display normally
- No errors should occur when condition field is missing

### Long Notes
- Test with 100 character limit
- Character counter should update correctly
- Submission should work at exactly 100 characters

### Multiple Returns
- Process multiple returns in sequence
- Each should maintain independent condition data

### Damaged Book Workflow
- Verify damaged book doesn't appear in student browse
- Verify damaged book can't be borrowed
- Admin should be able to edit book to change status back to available after repair

## API Testing

### Valid Request
```bash
POST /api/admin/transactions
{
  "transactionId": "...",
  "action": "return",
  "bookCondition": "good",
  "conditionNotes": "Book in excellent condition"
}
```

### Damaged Book Request
```bash
POST /api/admin/transactions
{
  "transactionId": "...",
  "action": "return",
  "bookCondition": "damaged",
  "conditionNotes": "Water damage on pages 10-15"
}
```

### Invalid Condition (should default to "good")
```bash
POST /api/admin/transactions
{
  "transactionId": "...",
  "action": "return",
  "bookCondition": "invalid-value"
}
```

## Database Verification

After processing returns, verify in MongoDB:

```javascript
// Check transaction has condition data
db.transactions.findOne({ _id: ObjectId("...") })
// Should have: bookCondition, conditionNotes (if provided)

// Check book status for damaged books
db.books.findOne({ _id: ObjectId("...") })
// Should have: status: "damaged" if condition was "damaged"
```

## UI Verification Checklist

- [ ] Condition dialog appears when clicking return buttons
- [ ] Radio buttons work correctly
- [ ] Notes textarea accepts input
- [ ] Character counter updates
- [ ] Validation errors display properly
- [ ] Submit button shows loading state
- [ ] Dialog closes after successful submission
- [ ] Condition badge appears in transaction list
- [ ] Condition badge appears in archives
- [ ] Color coding is correct (green/amber/red)
- [ ] Icons display correctly (✓/⚠/✕)
- [ ] Notes display below badges
- [ ] Long notes wrap properly
