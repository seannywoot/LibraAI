# Borrowed Books Archive Feature

## Overview
Students can now filter and archive their book transactions in the My Library page under the Borrowed Books tab.

## Features

### Status Filter Dropdown
- **Location**: My Library > Borrowed Books tab
- **Options**:
  - **Active**: Shows pending-approval, borrowed, and return-requested transactions
  - **Returned**: Shows successfully returned books
  - **Rejected**: Shows rejected borrow requests
  - **Archived**: Shows manually archived transactions

### Transaction Statuses

#### Active Transactions
- `pending-approval` - Waiting for admin approval
- `borrowed` - Currently borrowed
- `return-requested` - Return request submitted

#### Completed Transactions
- `returned` - Successfully returned books
- `rejected` - Rejected borrow requests

#### Archived Transactions
- Manually archived by student
- Can include returned or rejected transactions
- Marked with "Archived" badge

## UI Components

### Status Badges
- **Pending Approval**: Blue badge
- **Borrowed**: Amber badge
- **Return Requested**: Rose badge
- **Returned**: Green badge
- **Request Rejected**: Gray badge

### Archive Functionality
- **Archive Button**: Appears on returned and rejected transactions
- **Confirmation**: Prompts user before archiving
- **Archive Badge**: Shows "Archived" label on archived transactions
- **Unarchive**: Not currently supported (admin only)

### Display Information
For all transactions:
- Book cover image
- Book title and author
- Status badge (and archived badge if applicable)
- Borrowed/requested date
- Due date (for active borrowed books)
- Returned date (for returned books)
- Archive button (for returned/rejected books)
- Bookmark button

### View Modes
Both grid and list views are supported for all transaction types.

## API Endpoints

### `/api/student/books/borrowed` (GET)
**Query Parameter**: `status`

**Values**:
- `active` (default): Returns pending-approval, borrowed, return-requested
- `returned`: Returns only returned transactions
- `rejected`: Returns only rejected transactions
- `archived`: Returns only archived transactions

**Response**:
```json
{
  "ok": true,
  "items": [
    {
      "_id": "...",
      "userId": "user@example.com",
      "bookId": "...",
      "bookTitle": "Book Title",
      "bookAuthor": "Author Name",
      "bookCoverImage": "https://...",
      "status": "returned",
      "borrowedAt": "2024-01-15T10:00:00Z",
      "returnedAt": "2024-02-15T10:00:00Z",
      "archived": false,
      "bookSlug": "book-title"
    }
  ]
}
```

### `/api/student/books/archive` (POST)
Archives a transaction (student-initiated).

**Request Body**:
```json
{
  "transactionId": "transaction_id_here"
}
```

**Response**:
```json
{
  "ok": true,
  "message": "Transaction archived successfully"
}
```

**Validation**:
- Only returned or rejected transactions can be archived
- Transaction must belong to the authenticated user
- Cannot archive already archived transactions

## Implementation Details

### State Management
New state variables added:
- `statusFilter` - Current filter selection (active, returned, rejected, archived)
- `archiving` - Transaction ID currently being archived

### Data Loading
- Transactions are loaded based on selected filter
- Search functionality works across all filters
- Bookmark status is loaded for all transactions
- Filter resets to "active" when switching tabs

### User Experience
- Filter dropdown clears search input when changed
- Archive button only shows on returned/rejected transactions
- Confirmation dialog before archiving
- Visual distinction for archived transactions (gray background)
- Archived badge displayed alongside status badge
- Smooth transitions between filters

## Testing

### Test Scenarios
1. **Filter Active**: Default view shows active borrowed books
2. **Filter Returned**: Select "Returned" to see returned books
3. **Filter Rejected**: Select "Rejected" to see rejected requests
4. **Filter Archived**: Select "Archived" to see archived transactions
5. **Archive Transaction**: Click "Archive" on returned/rejected book
6. **Archive Confirmation**: Confirm archive dialog
7. **Search in Filters**: Search works across all filters
8. **Bookmark**: Can bookmark books from any filter
9. **View Modes**: Both grid and list views work for all filters
10. **Empty States**: Proper messages for each filter when empty
11. **Archive Button Visibility**: Only shows on returned/rejected non-archived transactions
12. **Archived Badge**: Shows on archived transactions

### Test Data Requirements
- User with active borrowed books
- User with returned books
- User with rejected borrow requests
- User with archived transactions
- User with no transactions
- Books with cover images
- Books without cover images
- Overdue books

## Future Enhancements
- Unarchive functionality
- Bulk archive operations
- Filter by date range
- Export transaction history
- Statistics on borrowing patterns
- Re-borrow functionality from archive
- Auto-archive old transactions
