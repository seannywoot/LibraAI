# Chatbot Book Borrowing Feature

## Overview
The LibraAI chatbot now has the ability to provide direct links to book detail pages when students express interest in borrowing books.

## How It Works

### Student Workflow
1. **Student asks about available books**
   - Example: "What science fiction books are available?"
   - AI responds with a list of books using the `searchBooks` function

2. **Student asks if a specific book is available**
   - Example: "Is 'The Quantum Garden' available?"
   - AI checks the book's status using `searchBooks` or `getBookDetails`

3. **Student expresses interest in borrowing**
   - Example: "I want to borrow that book" or "Can I get this book?"
   - AI uses the `generateBorrowLink` function to create a clickable link

4. **AI provides a clickable link**
   - Format: "You can borrow [Book Title] here: /student/books/[bookId]"
   - The link is rendered as a clickable element in the chat interface
   - Clicking the link takes the student directly to the book detail page

5. **Student borrows the book**
   - On the book detail page, student can click "Borrow Book" button
   - Borrow request is submitted for admin approval

## Technical Implementation

### Backend (API Route)
**File:** `src/app/api/chat/route.js`

#### New Function: `generateBorrowLink`
```javascript
async function generateBorrowLink(db, bookId) {
  // Fetches book details
  // Checks if book can be borrowed (status and loan policy)
  // Returns book info with borrowLink and appropriate message
}
```

#### Function Declaration for AI
```javascript
{
  name: "generateBorrowLink",
  description: "Generate a clickable link for a student to view and borrow a specific book",
  parameters: {
    bookId: "The MongoDB ObjectId of the book"
  }
}
```

#### Updated System Context
The AI is instructed to:
- Verify book availability first
- Detect borrowing intent from student messages
- Use `generateBorrowLink` when student wants to borrow
- Present links in a friendly, clear format
- Include book title and author for clarity

### Frontend (Chat Interface)
**File:** `src/components/chat-interface.jsx`

#### New Function: `renderMessageContent`
```javascript
const renderMessageContent = (content) => {
  // Detects URLs in message content (including /student/books/... paths)
  // Converts URLs to clickable <a> tags
  // Applies appropriate styling (blue, underlined)
  // Opens external links in new tab, internal links in same tab
}
```

#### Link Styling
- Color: Blue (`text-blue-600`)
- Hover: Darker blue (`hover:text-blue-800`)
- Underlined and medium font weight
- Internal links open in same tab
- External links open in new tab with security attributes

## Example Conversation

**Student:** "What science fiction books do you have?"

**AI:** "Here are some science fiction books available in our library:
1. The Quantum Garden by Derek Künsken (2025) - Available
2. Neural Storm by Maya Chen (2025) - Available
3. Stellar Echoes by Alex Rodriguez (2025) - Borrowed"

**Student:** "Is The Quantum Garden available?"

**AI:** "Yes! 'The Quantum Garden' by Derek Künsken is currently available on shelf B2."

**Student:** "I want to borrow it"

**AI:** "You can borrow 'The Quantum Garden' by Derek Künsken here: /student/books/[bookId]

Just click the link above to view the book details and submit your borrow request!"

## Book Status Handling

The `generateBorrowLink` function provides appropriate messages based on book status:

- **Available:** "You can borrow [Book Title] by clicking the link above."
- **Borrowed:** "[Book Title] is currently checked out."
- **Reserved:** "[Book Title] is currently reserved."
- **Reference-only:** "[Book Title] is reference only and cannot be borrowed."
- **Other:** "[Book Title] is currently unavailable for borrowing."

## Benefits

1. **Seamless Experience:** Students can go from discovery to borrowing without leaving the chat
2. **Reduced Friction:** Direct links eliminate the need to search for books manually
3. **Context Preservation:** Students maintain conversation context while viewing book details
4. **Clear Communication:** AI provides status information before offering the link
5. **Smart Detection:** AI understands various ways students express borrowing intent

## Future Enhancements

Potential improvements:
- Rich card previews in chat (book cover, title, author)
- Quick borrow action directly in chat
- Notification when borrowed book is approved
- Recommendation links based on conversation context
- Multiple book links in a single message for comparisons
