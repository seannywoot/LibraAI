# Chatbot System Integration

## Overview
LibraAI Assistant now has real-time access to the library system database through function calling. The chatbot can query books, check availability, browse categories, and provide accurate, up-to-date information about the library catalog.

## Capabilities

### 1. Book Search
The chatbot can search for books by:
- Title
- Author
- ISBN
- Publisher
- Status (available, borrowed, reserved)

**Example queries:**
- "Do you have any books by Isaac Asimov?"
- "Search for books about quantum physics"
- "Find available books with ISBN 978-0-123456-78-9"
- "Show me borrowed books by J.K. Rowling"

### 2. Category Browsing
The chatbot can show books from specific shelves/categories.

**Example queries:**
- "Show me fiction books"
- "What science books are available?"
- "List books in the history section"
- "Browse biography books"

### 3. Shelf Information
The chatbot can list all available shelves and their locations.

**Example queries:**
- "What categories do you have?"
- "Show me all the shelves"
- "Where is the science section?"

### 4. Book Details
The chatbot can provide detailed information about specific books.

**Example queries:**
- "Tell me more about [book title]"
- "What's the status of [book title]?"
- "Is [book title] available?"

## Function Tools

The AI uses these function tools to access the library system:

### searchBooks(query, status)
Searches the library catalog for books matching the query.

**Parameters:**
- `query` (string, required): Search term (title, author, ISBN, publisher)
- `status` (string, optional): Filter by status ("available", "borrowed", "reserved")

**Returns:**
```json
{
  "count": 5,
  "books": [
    {
      "id": "507f1f77bcf86cd799439011",
      "title": "Foundation",
      "author": "Isaac Asimov",
      "year": "1951",
      "status": "available",
      "shelf": "SCI",
      "isbn": "978-0-553-29335-0",
      "publisher": "Bantam Books"
    }
  ]
}
```

### getBooksByCategory(shelfCode)
Retrieves books from a specific shelf/category.

**Parameters:**
- `shelfCode` (string, required): Shelf code (e.g., "FIC", "SCI", "HIS")

**Returns:**
```json
{
  "shelfCode": "FIC",
  "count": 20,
  "books": [...]
}
```

### getAvailableShelves()
Lists all shelves/categories in the library.

**Parameters:** None

**Returns:**
```json
{
  "count": 8,
  "shelves": [
    {
      "code": "FIC",
      "name": "Fiction",
      "location": "Floor 1, Section A"
    }
  ]
}
```

### getBookDetails(bookId)
Gets detailed information about a specific book.

**Parameters:**
- `bookId` (string, required): MongoDB ObjectId of the book

**Returns:**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "title": "Foundation",
  "author": "Isaac Asimov",
  "year": "1951",
  "status": "available",
  "shelf": "SCI",
  "isbn": "978-0-553-29335-0",
  "publisher": "Bantam Books",
  "format": "Hardcover",
  "description": "...",
  "loanPolicy": "7 days"
}
```

## How It Works

1. **User asks a question** about books or availability
2. **AI analyzes the query** and determines if it needs library data
3. **AI calls appropriate function(s)** to fetch real-time data
4. **System executes function** and queries MongoDB
5. **Results are returned** to the AI
6. **AI formulates response** using the real data
7. **User receives accurate answer** with current information

## Common Shelf Codes

- **FIC** - Fiction
- **SCI** - Science
- **HIS** - History
- **BIO** - Biography
- **REF** - Reference
- **CHI** - Children's
- **MYS** - Mystery
- **ROM** - Romance

## Book Status Values

- **available** - Book is on the shelf and can be borrowed
- **borrowed** - Book is currently checked out by another user
- **reserved** - Book is reserved for a specific user

## Benefits

1. **Real-time accuracy**: Always shows current book availability
2. **Better user experience**: Users get instant, accurate answers
3. **Reduced staff workload**: Common queries handled automatically
4. **Improved discovery**: Users can explore the catalog conversationally
5. **Context-aware**: AI understands follow-up questions

## Example Conversations

**User:** "Do you have any science fiction books?"
**AI:** *Calls getBooksByCategory("SCI")* → "Yes! We have 45 science fiction books. Here are some popular ones: Foundation by Isaac Asimov (available), Dune by Frank Herbert (borrowed), The Martian by Andy Weir (available)..."

**User:** "Is Foundation available?"
**AI:** *Calls searchBooks("Foundation", "available")* → "Yes! Foundation by Isaac Asimov is currently available on shelf SCI. Would you like to borrow it?"

**User:** "What categories do you have?"
**AI:** *Calls getAvailableShelves()* → "We have 8 main categories: Fiction (Floor 1, Section A), Science (Floor 2, Section B), History (Floor 1, Section C)..."

## Technical Implementation

- Uses Google Gemini's function calling feature
- Functions query MongoDB collections directly
- Results limited to prevent overwhelming responses
- Error handling for invalid queries
- All queries logged for analytics

## Future Enhancements

- Book recommendations based on user history
- Availability notifications
- Reserve books through chat
- Check due dates
- Renew books via chat
- Get personalized reading lists
- Integration with user's personal library
