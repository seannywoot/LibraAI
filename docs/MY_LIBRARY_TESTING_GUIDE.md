# My Library Integration - Testing Guide

## Quick Test Checklist

### 1. Navigation Tests
- [ ] Click "My Library" in sidebar → Should open to Personal Collection tab
- [ ] Old "My Books" link should be removed from sidebar
- [ ] Catalog page "My Library" button → Should navigate to My Library
- [ ] Dashboard "View my library" link → Should navigate to My Library

### 2. Personal Collection Tab Tests
- [ ] Tab shows count of personal books
- [ ] "Upload PDF/Image" button is visible
- [ ] "Scan Barcode" button is visible
- [ ] "Add Manually" button is visible
- [ ] Can upload a PDF file
- [ ] Can scan a barcode (if camera available)
- [ ] Can manually add a book
- [ ] Can remove a book from collection
- [ ] Empty state shows when no books
- [ ] Books display with title, author, ISBN
- [ ] PDF books show "Open PDF" link

### 3. Borrowed Books Tab Tests
- [ ] Tab shows count of borrowed books
- [ ] Action buttons (Upload, Scan, Add) are hidden on this tab
- [ ] Shows all borrowed books and pending requests
- [ ] Displays book title and author
- [ ] Shows borrow/request date
- [ ] Shows due date
- [ ] Overdue books highlighted in red
- [ ] Status badges display correctly:
  - Pending Approval (blue)
  - Borrowed (amber)
  - Return Requested (rose)
  - Rejected (gray)
- [ ] "Request Return" button works for borrowed books
- [ ] Button disabled during return request
- [ ] Success toast shows after return request
- [ ] Empty state shows when no borrowed books

### 4. Tab Switching Tests
- [ ] Click Personal Collection tab → Shows personal books
- [ ] Click Borrowed Books tab → Shows borrowed books
- [ ] Active tab has black underline
- [ ] Inactive tab has gray text
- [ ] Tab counts update correctly

### 5. URL Parameter Tests
- [ ] `/student/library` → Opens to Personal Collection
- [ ] `/student/library?tab=personal` → Opens to Personal Collection
- [ ] `/student/library?tab=borrowed` → Opens to Borrowed Books
- [ ] `/student/borrowed` → Redirects to `/student/library?tab=borrowed`

### 6. Backward Compatibility Tests
- [ ] Old bookmarks to `/student/borrowed` redirect correctly
- [ ] Redirect shows "Redirecting..." message briefly
- [ ] After redirect, Borrowed Books tab is active

### 7. Status Display Tests
For each borrowed book status, verify correct display:

**Pending Approval:**
- [ ] Blue badge shows "Pending Approval"
- [ ] Message: "Your request is with the admin for approval"
- [ ] Shows "Pending admin approval" instead of return button

**Borrowed:**
- [ ] Amber badge shows "Borrowed"
- [ ] Shows "Request Return" button
- [ ] Due date displayed
- [ ] Overdue indicator if past due date

**Return Requested:**
- [ ] Rose badge shows "Return Requested"
- [ ] Message: "Waiting for admin to confirm the return"
- [ ] Shows "Awaiting admin confirmation" instead of button

**Rejected:**
- [ ] Gray badge shows "Request Rejected"
- [ ] Message: "This request was rejected by the admin"
- [ ] Shows "Request rejected" in red

### 8. Loading States
- [ ] Personal tab shows "Loading your library..." while fetching
- [ ] Borrowed tab shows "Loading borrowed books..." while fetching
- [ ] Upload button shows "Uploading..." during upload
- [ ] Return button shows "Submitting..." during return request

### 9. Error Handling
- [ ] Error toast shows if personal books fail to load
- [ ] Error toast shows if borrowed books fail to load
- [ ] Error toast shows if upload fails
- [ ] Error toast shows if return request fails
- [ ] Error toast shows if book removal fails

### 10. Responsive Design
- [ ] Page layout works on desktop
- [ ] Tabs are readable on mobile
- [ ] Book cards stack properly on mobile
- [ ] Action buttons accessible on mobile

## Expected Behavior Summary

### Personal Collection Tab
- Displays books added by the student (PDFs, scanned, manual)
- Shows upload, scan, and manual add buttons
- Each book card shows: cover placeholder, title, author, ISBN, add date
- PDF books have "Open PDF" link
- Remove button (X) on each card

### Borrowed Books Tab
- Displays books borrowed from the catalog
- No upload/scan/add buttons (read-only view)
- Each transaction shows: title, author, dates, status, actions
- Color-coded by status (normal or overdue)
- Return button only for actively borrowed books
- Status messages for pending/rejected requests

## Common Issues to Check

1. **Tab not switching**: Check if `activeTab` state is updating
2. **Counts not updating**: Verify API calls are completing
3. **Redirect not working**: Check if Next.js router is imported correctly
4. **Buttons not showing**: Verify `activeTab === "personal"` condition
5. **Status badges wrong color**: Check status value matches map keys
6. **Dates not formatting**: Verify date strings are valid ISO format
7. **Return button not working**: Check API endpoint `/api/student/books/return`

## API Endpoints to Verify

- `GET /api/student/library` - Should return personal books
- `GET /api/student/books/borrowed` - Should return borrowed books
- `POST /api/student/books/return` - Should accept `{ bookId }`
- `POST /api/student/library/add` - Should accept `{ isbn, method }`
- `POST /api/student/library/upload` - Should accept FormData with file
- `POST /api/student/library/manual` - Should accept book details
- `DELETE /api/student/library/:id` - Should remove book

## Success Criteria

✅ All navigation links point to correct locations
✅ Both tabs display correct content
✅ Tab switching works smoothly
✅ URL parameters work correctly
✅ Old routes redirect properly
✅ All CRUD operations work (Create, Read, Update, Delete)
✅ Status badges display correctly
✅ Loading and error states handled
✅ Toast notifications appear for actions
✅ Responsive design works on all screen sizes
