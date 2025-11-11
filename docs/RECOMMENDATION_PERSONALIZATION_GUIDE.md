# Recommendation Personalization Guide

## How Recommendations Update

Recommendations update **in real-time** based on your interactions, but they need **meaningful book interactions** to build your profile.

## Current Situation

From the diagnostic:
- **Total interactions:** 315
- **With bookId:** 63 (20%) ✅ These build your profile
- **Without bookId:** 252 (80%) ⚠️ These are searches - don't build profile

**Result:** Most interactions are searches, so the system shows popular books as a fallback.

## What Builds Your Profile

### High Impact (Weighted 2x)
1. **Borrow Books** - Shows strong interest
2. **Return Books** - Completes the reading cycle

### Medium Impact (Weighted 1x)
3. **View Book Details** - Click on a book to see its detail page
4. **Bookmark Books** - Save for later
5. **Take Notes** - Engage deeply with content

### Low Impact (Not tracked with books)
6. **Search** - General browsing (no specific book)
7. **Filter** - Category exploration (no specific book)

## Why You're Seeing Popular Books

**Your Activity:**
- 168 interactions total
- Most are searches/filters (no bookId)
- Few book views/borrows

**System Response:**
- Not enough category data to personalize
- Falls back to popular books
- This is intentional - better to show popular books than random ones

## How to Get Personalized Recommendations

### Quick Actions (5-10 minutes)

1. **View 5-10 Books**
   - Click on books that interest you
   - Read their descriptions
   - Each view is tracked

2. **Bookmark 3-5 Books**
   - Click the bookmark icon
   - Shows the system what you like

3. **Borrow 1-2 Books**
   - Request to borrow books
   - Highest weight for recommendations

### Expected Timeline

| Actions | Personalization Level | Timeline |
|---------|----------------------|----------|
| 0-5 book views | Popular books fallback | Now |
| 5-10 book views | Starting to personalize | 5 minutes |
| 10+ views + 2 borrows | Hybrid recommendations | 10 minutes |
| 20+ views + 5 borrows | Fully personalized | 15 minutes |

## Example: Building a Profile

### Step 1: View Books (5 minutes)
```
View: "Clean Code" (Programming, Software Engineering)
View: "Design Patterns" (Programming, Software Engineering)
View: "Effective Java" (Programming, Java)
View: "The Pragmatic Programmer" (Programming)
View: "Refactoring" (Programming, Software Engineering)
```

**Result:** System learns you like Programming

### Step 2: Borrow Books (2 minutes)
```
Borrow: "Clean Code"
Borrow: "Design Patterns"
```

**Result:** Strong signal - you REALLY like Programming

### Step 3: Check Recommendations
```
Recommendations now show:
✅ Effective Java (Programming, Java)
✅ Code Complete (Programming, Software Engineering)
✅ Head First Java (Programming, Java)
✅ Test-Driven Development (Programming, Testing)
✅ Working Effectively with Legacy Code (Programming)
```

**Result:** Fully personalized to Programming!

## Recommendation Algorithm

### Scoring System

```javascript
Personalization Score = 
  (Book Views × 1) + 
  (Borrows × 2) + 
  (Bookmarks × 1) + 
  (Notes × 1)
```

### Thresholds

- **< 5 points:** Popular books fallback
- **5-15 points:** Hybrid (some personalization + popular)
- **> 15 points:** Fully personalized

### Your Current Score

Based on diagnostics:
- User 1: 171 points (but no book views - only searches)
- User 2: 65 points (but no book views - only searches)
- User 3: 35 points (with book views) ✅ **Getting personalized recommendations!**

## Why Searches Don't Count

**Search Event:**
```javascript
{
  eventType: "search",
  searchQuery: "programming",
  // ❌ No bookId - can't determine category preference
}
```

**Book View Event:**
```javascript
{
  eventType: "view",
  bookId: "507f1f77bcf86cd799439011",
  // ✅ Has bookId - can look up categories
}
```

**Result:** Only book-specific interactions build your profile.

## Testing Your Recommendations

### 1. View Some Books
```
1. Go to /student/books
2. Click on 5 different books
3. Read their descriptions
```

### 2. Check Recommendations
```
1. Look at the "Recommended for You" sidebar
2. Should start showing books from categories you viewed
```

### 3. Borrow a Book
```
1. Click "Borrow" on a book you like
2. Wait for approval
3. Check recommendations again
```

### 4. Verify Personalization
```
Run: node scripts/check-user-recommendations.js
Look for: "Category Preferences" section
Should show: Categories you've interacted with
```

## Common Issues

### Issue 1: "Still showing popular books"

**Cause:** Not enough book-specific interactions

**Solution:**
- View more book detail pages
- Bookmark books you like
- Borrow books

### Issue 2: "Recommendations don't match my interests"

**Cause:** Mixed signals from different categories

**Solution:**
- Focus on one category for a few interactions
- Borrow books (higher weight) in your preferred category
- System will learn your primary interests

### Issue 3: "Recommendations never change"

**Cause:** Not creating new interactions

**Solution:**
- View new books regularly
- Borrow different books
- System updates in real-time with each interaction

## Real User Example

**User 000000000000000000000001:**

**Activity:**
- 25 interactions (book views)
- 5 borrows (Science Fiction books)
- Score: 35 points

**Category Preferences:**
- Science Fiction: 20 interactions
- Adventure: 7 interactions
- Cyberpunk: 3 interactions

**Recommendations:**
✅ More Science Fiction books
✅ Adventure books
✅ Cyberpunk books
✅ **Fully personalized!**

## Summary

### Why You See Popular Books
- Most interactions are searches (no bookId)
- Need book views/borrows to build profile
- System correctly falls back to popular books

### How to Fix
1. **View 5-10 book detail pages** (5 minutes)
2. **Bookmark 3-5 books** (2 minutes)
3. **Borrow 1-2 books** (2 minutes)
4. **Check recommendations** - Should be personalized!

### Timeline
- **Immediate:** Popular books (current)
- **5 minutes:** Start seeing personalized books
- **10 minutes:** Hybrid recommendations
- **15 minutes:** Fully personalized

The system is working correctly - it just needs more book-specific interactions to learn your preferences! 📚✨
