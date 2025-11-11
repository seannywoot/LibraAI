# Barcode Scanning & Recommendations Test Guide

## Test Scenario: Complete User Flow

### Prerequisites
- Logged in as a student
- Camera permission granted
- At least one book in the library catalog

---

## Test 1: Scan a Book Barcode

### Steps:
1. Navigate to `/student/library`
2. Ensure you're on the "Personal Collection" tab
3. Click the **"Scan Barcode"** button
4. Modal opens with title "Scan Book Barcode"
5. Camera preview should appear (black box with live feed)
6. Point camera at a book's ISBN barcode

### Expected Results:
✅ Camera initializes successfully
✅ Scanner detects barcode automatically
✅ Green success box shows: "Detected: [ISBN]"
✅ Modal closes
✅ Toast notification: "Book added to your library!"
✅ **Automatically redirects to book detail page**

### Sample ISBNs to Test:
- `9780134685991` - Effective Java
- `9780132350884` - Clean Code
- `9780596517748` - JavaScript: The Good Parts

---

## Test 2: View Book Details

### After Scanning (Automatic Redirect):
You should land on `/student/library/[bookId]`

### Expected Results:
✅ Page shows book information:
  - Title (e.g., "Effective Java")
  - Author (e.g., "Joshua Bloch")
  - ISBN
  - Publisher
  - Publication Year
  - Description/Notes
  - Date Added (today's date)
  - File Type: "Manual entry"

✅ Action buttons visible:
  - "Remove from Library" (red button)

---

## Test 3: View Similar Books Recommendations

### On the Same Detail Page:
Scroll down to see "Similar Books You Might Like" section

### Expected Results:
✅ Section header: "Similar Books You Might Like"
✅ Shows loading state initially (3 skeleton cards)
✅ After loading, displays 3-6 book recommendations
✅ Each recommendation card shows:
  - Book cover placeholder
  - Book title
  - Author name
  - Recommendation reason (e.g., "Same author", "Similar category")
✅ Cards are clickable and link to book details

### If No Recommendations:
✅ Shows message: "No similar books found at the moment. Check back later!"

---

## Test 4: Navigate from Recommendation

### Steps:
1. Click on any recommended book card
2. Should navigate to that book's detail page

### Expected Results:
✅ Navigates to `/student/books/[bookId]` (catalog book)
✅ Shows full book details
✅ Shows availability status
✅ Shows borrow/access button if available

---

## Test 5: Error Handling

### Test 5a: Book Already in Library
1. Scan the same ISBN again
2. Try to add it

**Expected:** 
✅ Error toast: "Book already in your library"
✅ Stays on library page (doesn't redirect)

### Test 5b: Invalid ISBN
1. Scan a barcode that's not an ISBN (e.g., product barcode)

**Expected:**
✅ Scanner continues scanning (doesn't stop)
✅ No error shown (just keeps looking for valid ISBN)

### Test 5c: Camera Permission Denied
1. Deny camera permission in browser
2. Try to open scanner

**Expected:**
✅ Error message: "Failed to initialize camera"
✅ Shows in scanner modal

### Test 5d: Unknown ISBN
1. Scan an ISBN not in library catalog or Google Books

**Expected:**
✅ Book added with title: "Unknown Book"
✅ Author: "Unknown Author"
✅ Still redirects to detail page
✅ Recommendations may be empty

---

## Test 6: Back Navigation

### Steps:
1. From book detail page, click "Back to My Library"

### Expected Results:
✅ Returns to `/student/library?tab=personal`
✅ Newly added book appears in the list
✅ Book count incremented

---

## Test 7: Recommendation Quality

### Verify Recommendations Make Sense:

**For Programming Book (e.g., "Effective Java"):**
✅ Should recommend other programming books
✅ Preferably Java-related books
✅ Books by same author if available

**For Fiction Book:**
✅ Should recommend same genre
✅ Similar themes or topics
✅ Same author's other works

**For Non-Fiction:**
✅ Same subject area
✅ Similar educational level
✅ Related topics

---

## Test 8: Mobile Responsiveness

### Test on Mobile Device:
1. Open `/student/library` on phone
2. Click "Scan Barcode"
3. Use rear camera

### Expected Results:
✅ Scanner uses rear camera (facingMode: "environment")
✅ Modal is responsive and fits screen
✅ Camera preview is properly sized
✅ Recommendations display in single column on mobile

---

## Test 9: Performance

### Timing Checks:
- **Scanner initialization:** < 2 seconds
- **Barcode detection:** < 1 second after pointing
- **Book addition:** < 2 seconds
- **Page redirect:** Immediate
- **Recommendations load:** < 3 seconds

---

## Test 10: Data Persistence

### Steps:
1. Scan and add a book
2. Log out
3. Log back in
4. Go to My Library

### Expected Results:
✅ Scanned book still in personal collection
✅ All metadata preserved
✅ "Added Method" shows as "barcode"

---

## Edge Cases to Test

### Multiple Rapid Scans:
- Scan multiple books quickly
- Each should add separately
- No duplicate entries

### Network Issues:
- Disable internet
- Scan a book not in local catalog
- Should show error gracefully

### Long Descriptions:
- Scan book with very long description
- Should display properly without breaking layout

---

## Success Criteria

All tests should pass with:
✅ No console errors
✅ Smooth user experience
✅ Accurate book metadata
✅ Relevant recommendations
✅ Proper error handling
✅ Fast performance

---

## Known Limitations

1. **OCR not implemented** - Only barcode scanning works
2. **No book covers** - Shows placeholder instead
3. **Google Books dependency** - Requires internet for unknown books
4. **ISBN only** - Doesn't support other barcode formats for books

---

## Reporting Issues

If any test fails, report with:
- Test number and step
- Expected vs actual result
- Browser and device info
- Console errors (if any)
- Screenshots
