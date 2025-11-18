# How User Categories Are Determined

## 📊 Category Extraction Explained

### The Question:
Why does `seannpatrick25@gmail.com` have 9 categories but `demo@student.com` has 0 categories, even though both have interactions?

---

## 🔍 How It Works:

### Categories Come From BOOK METADATA

Categories are extracted from **books that users interact with**, specifically:

1. **VIEW interactions** → Book has categories → Categories captured
2. **BOOKMARK interactions** → Book has categories → Categories captured
3. **SEARCH interactions** → NO book involved → NO categories captured

---

## 📊 Real Examples from Your Data:

### User 1: `seannpatrick25@gmail.com`
```
Total Interactions: 70
├─ 8 VIEW interactions     → ✅ Categories captured
├─ 6 BOOKMARK interactions → ✅ Categories captured
└─ 56 SEARCH interactions  → ❌ NO categories

Result: 9 categories
(Fiction, History, Drama, Psychology, Self-Help, etc.)
```

**Why 9 categories?**
- Viewed 8 books with various categories
- Bookmarked 6 books with various categories
- Each book has 1-3 categories
- System collected all unique categories
- Result: 9 distinct categories

### User 2: `demo@student.com`
```
Total Interactions: 21
├─ 0 VIEW interactions     → ❌ NO categories
├─ 0 BOOKMARK interactions → ❌ NO categories
└─ 21 SEARCH interactions  → ❌ NO categories

Result: 0 categories
```

**Why 0 categories?**
- Only searched, never viewed books
- Search queries don't have categories
- No book metadata captured
- Result: No category information

### User 3: `202310230@gordoncollege.edu.ph`
```
Total Interactions: 168
├─ 0 VIEW interactions     → ❌ NO categories
├─ 0 BOOKMARK interactions → ❌ NO categories
└─ 168 SEARCH interactions → ❌ NO categories

Result: 0 categories
```

**Why 0 categories despite 168 interactions?**
- All 168 are searches
- Never clicked on a book to view it
- No book metadata captured
- Result: No category information

---

## 🔧 How Categories Are Captured:

### In the Tracking API (`src/app/api/student/books/track/route.js`):

#### For VIEW and BOOKMARK Events:
```javascript
// Fetch book details from database
const book = await books.findOne({ _id: new ObjectId(bookId) });

// Extract metadata
interactionData = {
  ...interactionData,
  bookId: book._id,
  bookTitle: book.title,
  bookAuthor: book.author,
  bookCategories: book.categories || [],  // ✅ Categories captured
  bookTags: book.tags || [],              // ✅ Tags captured
};
```

#### For SEARCH Events:
```javascript
interactionData = {
  ...interactionData,
  searchQuery: searchQuery.trim(),        // ✅ Query captured
  searchFilters: searchFilters || {},     // ✅ Filters captured
  // ❌ NO bookCategories
  // ❌ NO bookTags
  // ❌ NO bookAuthor
};
```

---

## 📈 Impact on Recommendations:

### User with Categories (Good Personalization):
```
User: seannpatrick25@gmail.com
Categories: Fiction, History, Drama, Psychology, Self-Help

Recommendations:
1. "The Great Gatsby" (Fiction, Drama)
   → Match: You like Fiction books
2. "Sapiens" (History, Non-Fiction)
   → Match: You viewed History books
3. "Thinking, Fast and Slow" (Psychology)
   → Match: You're interested in Psychology
```

### User without Categories (Limited Personalization):
```
User: demo@student.com
Categories: None
Search Queries: "filtered search" (21 times)

Recommendations:
1. Popular books (fallback)
2. Books matching search terms (if possible)
3. Recently added books
   → Limited personalization due to no category data
```

---

## 🎯 Why This Happens:

### Scenario 1: User Only Searches
```
1. User searches for "atomic habits"
2. Sees search results
3. Doesn't click on any book
4. Searches again for "brief history"
5. Still doesn't click on books

Result:
- 2 search interactions recorded
- 0 categories captured
- Limited personalization
```

### Scenario 2: User Views Books
```
1. User searches for "atomic habits"
2. Clicks on "Atomic Habits" book
3. Views book detail page
4. System records VIEW interaction
5. Captures book metadata:
   - Categories: [Self-Help, Psychology, Business]
   - Author: James Clear
   - Tags: [habits, productivity]

Result:
- 1 search + 1 view interaction
- 3 categories captured
- Better personalization
```

---

## 💡 Recommendations for Better Personalization:

### Option 1: Encourage Book Views
**Current behavior is fine**, but users get better recommendations when they:
- Click on books to view details
- Bookmark books they like
- Actually interac