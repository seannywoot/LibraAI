# Borrow/Return Functionality

This document describes the new borrow/return functionality added to the LibraAI library management system.

## Features

### For Students

1. **Browse Books** (`/student/books`)
   - View all available books in the library catalog
   - See book status (available, checked-out, reserved, etc.)
   - Submit borrow requests for admin approval
   - Pagination support for large catalogs

2. **My Borrowed Books** (`/student/borrowed`)
   - View all currently borrowed books
   - See due dates and overdue status
   - Request returns that admins must confirm
   - Visual indicators for overdue books

### For Admins

1. **Transaction History** (`/admin/transactions`)
   - View all borrow/return transactions
   - Filter by status (pending approval, borrowed, return requested, returned, rejected)
   - See user information and book details
   - Approve or reject borrow requests with custom due dates
   - Confirm return requests and release books back to the shelf
   - Pagination support

## API Endpoints

### Student Endpoints

- `GET /api/student/books` - List all books (with pagination)
- `GET /api/student/books/borrowed` - Get currently borrowed books
- `POST /api/student/books/borrow` - Submit a borrow request for admin approval
- `POST /api/student/books/return` - Request to return a borrowed book

### Admin Endpoints

- `GET /api/admin/transactions` - List all transactions (with pagination and filtering)
- `POST /api/admin/transactions` - Approve, reject, or complete transactions

## Database Schema

### Transactions Collection

```javascript
{
  bookId: ObjectId,           // Reference to books collection
  bookTitle: String,          // Denormalized for quick access
  bookAuthor: String,         // Denormalized for quick access
  userId: String,             // User email
  userName: String,           // User display name
   requestedAt: Date,          // When the student requested the loan
   requestedLoanDays: Number,  // Suggested loan length in days
   requestedDueDate: Date|null,// Suggested due date before approval
   borrowedAt: Date|null,      // When the admin approved the loan
   dueDate: Date|null,         // Confirmed due date once approved
   returnRequestedAt: Date|null,// When the student asked to return the book
   returnedAt: Date|null,      // When the admin confirmed the return
   status: String,             // "pending-approval", "borrowed", "return-requested", "returned", "rejected"
   approvedAt: Date|null,
   approvedBy: String|null,
   rejectedAt: Date|null,
   rejectedBy: String|null,
   returnProcessedAt: Date|null,
   returnProcessedBy: String|null,
   loanPolicy: String          // "standard", "short-loan", "reference-only", "staff-only"
}
```

## Business Rules

1. **Loan Periods**
   - Standard loan: 14 days
   - Short loan: 3 days
   - Reference-only: Cannot be borrowed
   - Staff-only: Only admins can borrow

2. **Book Status Updates**
   - When a borrow request is submitted: Book status changes from "available" to "reserved"
   - When approved: Book status changes from "reserved" to "checked-out"
   - When the return is confirmed: Book status changes from "checked-out" back to "available"

3. **Borrowing Restrictions**
   - Books must be "available" to be requested
   - Reference-only books cannot be requested
   - Staff-only books require admin role (requests from students are rejected)
   - Only one active transaction (pending, borrowed, or return-requested) may exist per book

4. **Overdue Detection**
   - Books are marked as overdue if current date > due date
   - Visual indicators shown in the UI

## UI Components

### Toast Notifications
- Success messages when borrowing/returning books
- Error messages for failed operations
- Auto-dismiss after 3 seconds

### Status Indicators
- Color-coded status chips for book availability
- Overdue warnings with red highlighting
- Loan policy badges

## Navigation Updates

### Student Dashboard
- Added "Browse Books" link
- Added "My Books" link
- Updated Quick Actions section

### Admin Dashboard
- Added "Transactions" link to sidebar
- Added "View borrow transactions" quick action

## Testing

To test the functionality:

1. Start the development server: `npm run dev`
2. Seed demo users: Visit `http://localhost:3000/api/admin/seed-users`
3. Login as student: `student@demo.edu` / `ReadSmart123`
4. Browse books at `/student/books`
5. Submit a borrow request and confirm it appears as "Pending admin approval" at `/student/borrowed`
6. Login as admin: `admin@libra.ai` / `ManageStacks!`
7. Approve the pending request at `/admin/transactions`, adjusting the due date if desired
8. Switch back to the student session and refresh `/student/borrowed` to see the approved loan
9. From the student view, submit a return request and verify it transitions to "Awaiting admin confirmation"
10. As the admin, confirm the return from `/admin/transactions`
11. Verify the book is available again in `/student/books`

## Future Enhancements

- Email notifications for due dates
- Reservation system for checked-out books
- Fine calculation for overdue books
- Borrowing history for students
- Advanced search and filtering
- Bulk operations for admins
