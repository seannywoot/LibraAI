# Book Condition Tracking Feature

## Overview
Admins can now check and record the condition of books when processing returns. This helps track book wear and damage over time.

## Features

### Condition Status Options
When processing a book return, admins can select from three condition levels:

1. **Good Condition** ✓
   - No visible damage or wear
   - Book is in excellent state
   - Book remains available for borrowing

2. **Fair Condition** ⚠
   - Minor wear but still usable
   - Some signs of use but functional
   - Book remains available for borrowing

3. **Damaged** ✕
   - Significant damage requiring attention
   - Book may need repair or replacement
   - Book is automatically marked as "damaged" status and removed from circulation

### Condition Notes
- Optional notes field for all conditions
- **Required** for damaged books to document the specific damage
- Maximum 100 characters
- Helps track patterns and inform maintenance decisions

## How It Works

### Admin Workflow
1. Student returns a book (either via "Return Request" or admin marks as returned)
2. Admin clicks "Confirm Return" or "Mark Returned" button
3. A dialog appears asking for condition assessment
4. Admin selects condition and adds notes if needed
5. Upon confirmation:
   - Transaction is marked as returned
   - Condition status is saved
   - If damaged, book status changes to "damaged" (unavailable)
   - If good/fair, book becomes available for borrowing

### Database Schema
Transactions now include:
- `bookCondition`: "good" | "fair" | "damaged"
- `conditionNotes`: Optional string (max 100 chars)

Books are updated:
- Status set to "damaged" if condition is damaged
- Status set to "available" if condition is good or fair

### Visual Indicators
In the transactions table, returned books display:
- Condition badge with color coding:
  - Green for good ✓
  - Amber for fair ⚠
  - Red for damaged ✕
- Condition notes displayed below the badge

## API Changes

### POST /api/admin/transactions
New parameters for "return" action:
```json
{
  "transactionId": "...",
  "action": "return",
  "bookCondition": "good" | "fair" | "damaged",
  "conditionNotes": "Optional notes about condition"
}
```

### Validation
- `bookCondition` defaults to "good" if not provided
- `conditionNotes` is trimmed and optional (max 100 characters)
- For damaged books, notes are recommended but not enforced at API level (enforced in UI)

## Benefits
- Track book wear patterns over time
- Identify books needing maintenance
- Document damage for accountability
- Automatically remove damaged books from circulation
- Maintain library collection quality

## Future Enhancements
- Condition history report per book
- Analytics on damage patterns
- Student accountability tracking
- Automated maintenance alerts
