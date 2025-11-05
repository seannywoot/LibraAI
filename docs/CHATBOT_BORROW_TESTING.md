# Testing the Chatbot Book Borrowing Feature

## Quick Test Guide

### Prerequisites
1. Ensure the development server is running
2. Log in as a student user
3. Navigate to the Chat page (`/student/chat`)

### Test Scenarios

#### Scenario 1: Basic Book Search and Borrow
1. **Ask about available books:**
   ```
   "What science fiction books are available?"
   ```
   
2. **Expected Response:**
   - AI lists available science fiction books with titles, authors, and status
   - Books should show their availability status

3. **Express interest in borrowing:**
   ```
   "I want to borrow [Book Title from the list]"
   ```
   
4. **Expected Response:**
   - AI provides a clickable link in blue text
   - Link format: `/student/books/[bookId]`
   - Message includes book title and author
   - Example: "You can borrow 'The Quantum Garden' by Derek Künsken here: /student/books/673abc123..."

5. **Click the link:**
   - Should navigate to the book detail page
   - Book detail page should show "Borrow Book" button if available

#### Scenario 2: Check Specific Book Availability
1. **Ask about a specific book:**
   ```
   "Is 'Dune' available?"
   ```

2. **Expected Response:**
   - AI searches for the book
   - Provides availability status
   - Mentions shelf location if available

3. **Request to borrow:**
   ```
   "Can I borrow it?"
   ```

4. **Expected Response:**
   - AI generates borrow link
   - Provides clickable link to book detail page

#### Scenario 3: Unavailable Book
1. **Ask about books:**
   ```
   "Show me some history books"
   ```

2. **Try to borrow a checked-out book:**
   ```
   "I want to borrow [a borrowed book from the list]"
   ```

3. **Expected Response:**
   - AI indicates the book is currently checked out
   - May still provide link to view book details
   - Message: "[Book Title] is currently checked out."

#### Scenario 4: Reference-Only Book
1. **Search for reference books:**
   ```
   "Do you have any encyclopedias?"
   ```

2. **Try to borrow:**
   ```
   "I'd like to check out [reference book]"
   ```

3. **Expected Response:**
   - AI indicates book is reference-only
   - Message: "[Book Title] is reference only and cannot be borrowed."
   - May provide link to view details

#### Scenario 5: Multiple Borrowing Intents
Test various ways students might express borrowing intent:
- "I want to borrow this book"
- "Can I get this book?"
- "I'd like to check this out"
- "How do I borrow it?"
- "I need this book"

All should trigger the `generateBorrowLink` function.

### Visual Verification

#### Link Appearance
- **Color:** Blue (`#2563eb`)
- **Hover:** Darker blue (`#1e40af`)
- **Style:** Underlined, medium font weight
- **Cursor:** Pointer on hover

#### Link Behavior
- **Internal links** (`/student/books/...`): Open in same tab
- **External links** (if any): Open in new tab
- **Click:** Smooth navigation without page reload (Next.js routing)

### Testing the Complete Flow

1. **Start in Chat:**
   - Ask: "What books are available in the Science section?"

2. **Get Recommendations:**
   - AI lists books from Science shelves (B1, B2, B3)

3. **Check Availability:**
   - Ask: "Is [specific book] available?"
   - AI confirms status

4. **Request Borrow Link:**
   - Say: "I want to borrow it"
   - AI provides clickable link

5. **Navigate to Book Page:**
   - Click the link
   - Verify book detail page loads

6. **Submit Borrow Request:**
   - Click "Borrow Book" button
   - Verify success toast appears

7. **Return to Chat:**
   - Use browser back button
   - Chat history should be preserved
   - Continue conversation

### Edge Cases to Test

#### Invalid Book ID
- Manually type a malformed link in chat
- Should handle gracefully (404 page)

#### Rapid Requests
- Ask to borrow multiple books quickly
- Each should get its own link

#### Long Book Titles
- Test with books that have very long titles
- Link should wrap properly in chat bubble

#### Mixed Content
- Message with both text and links
- Example: "You can borrow 'Book A' here: [link] or 'Book B' here: [link]"
- Both links should be clickable

### Debugging Tips

#### Link Not Clickable
- Check browser console for errors
- Verify `renderMessageContent` function is being called
- Inspect element to see if `<a>` tag is rendered

#### Wrong Page Opens
- Verify link format: `/student/books/[valid-mongodb-id]`
- Check if book ID is valid ObjectId format

#### AI Not Generating Links
- Check if `generateBorrowLink` function is defined in API route
- Verify function is in tools array
- Check system context includes borrowing workflow instructions
- Review API logs for function calls

### Success Criteria

✅ AI detects borrowing intent from various phrasings
✅ Links are generated with correct book IDs
✅ Links are rendered as clickable blue text
✅ Clicking links navigates to correct book detail page
✅ Book detail page shows correct book information
✅ Borrow button works on detail page
✅ Chat history is preserved after navigation
✅ Links work for both available and unavailable books
✅ Appropriate messages shown for different book statuses

## Common Issues and Solutions

### Issue: Links appear as plain text
**Solution:** Verify `renderMessageContent` function is imported and used in message rendering

### Issue: Links have wrong format
**Solution:** Check `generateBorrowLink` function returns correct path format

### Issue: AI doesn't understand borrowing intent
**Solution:** Review system context instructions, ensure borrowing workflow is clearly defined

### Issue: Function not being called
**Solution:** Check function declaration in tools array, verify function name matches in switch statement

### Issue: Book ID invalid
**Solution:** Ensure book IDs from search results are valid MongoDB ObjectIds
