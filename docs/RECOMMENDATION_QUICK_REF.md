# Recommendation System - Quick Reference

## Scoring Breakdown (Max 100 Points)

### Primary Factors
- **Category Match**: 35/60/75 pts (1/2/3+ matches)
- **Tag Match**: 25/45/60 pts (1/2/3+ matches)
- **Author Match**: 40/35/30 pts (1st/2nd/3rd favorite)

### Secondary Factors
- **Publisher**: 15 pts
- **Format**: 10 pts
- **Year Proximity**: 0-20 pts
- **Popularity**: 0-30 pts (logarithmic)
- **Diversity Bonus**: 10 pts
- **Activity Boost**: 0-15 pts
- **Engagement**: 5 pts

### Penalties
- **No strong match**: -50% score

## Time-Decay Weights
- Last 7 days: **3x**
- Last 30 days: **2x**
- Older: **1.5x**

## Diversity Limits
- Max per author: 2-3 books
- Max per category: 3-4 books
- Max per publisher: 3-4 books
- Exception: Score ≥85 bypasses limits

## User Profile Tracking
- Top 7 categories
- Top 8 tags
- Top 5 authors
- Top 3 publishers
- Top 3 formats
- Average preferred year
- Diversity score (0-1)

## API Response
```javascript
GET /api/student/books/recommendations?limit=10&context=browse

{
  "ok": true,
  "recommendations": [
    {
      "_id": "...",
      "title": "Clean Code",
      "author": "Robert Martin",
      "relevanceScore": 87,
      "matchReasons": [
        "Category: Computer Science",
        "Author: Robert Martin",
        "Highly popular"
      ],
      // ... other book fields
    }
  ],
  "basedOn": {
    "viewCount": 15,
    "searchCount": 8,
    "topCategories": ["Computer Science"],
    "topAuthors": ["Robert Martin"],
    "diversityScore": 65
  },
  "meta": {
    "candidatesEvaluated": 45,
    "version": "2.0"
  }
}
```

## Recommendation Strategies

### 1. User-Based (Default)
- Analyzes user's interaction history
- Multi-strategy candidate selection
- Diversity filtering applied

### 2. Book-Based (Similar Books)
```javascript
GET /api/student/books/recommendations?bookId=123&limit=5
```
- Same author: 60 pts
- Title similarity: 8 pts per word
- Category/tag matching
- Year proximity

### 3. Popular (Fallback)
- Used for new users
- Sorted by popularity + year
- Diverse categories

## Tuning Parameters

### In Code
```javascript
// Time decay
sevenDaysAgo: 3x weight
thirtyDaysAgo: 2x weight
older: 1.5x weight

// Diversity
maxPerAuthor: 2-3
maxPerCategory: 3-4
maxPerPublisher: 3-4

// Scoring
categoryScore: 35/60/75
tagScore: 25/45/60
authorScore: 40/35/30
```

## Common Use Cases

### "Show me books like this one"
```javascript
?bookId=abc123&limit=5
```

### "Recommendations for browsing"
```javascript
?context=browse&limit=10
```

### "Recommendations while searching"
```javascript
?context=search&limit=10
```

### "Exclude current book"
```javascript
?currentBookId=abc123&limit=10
```

## Debugging

### Check User Profile
Look at `basedOn` in response:
- Low `totalInteractions`? → Popular books fallback
- High `diversityScore`? → More variety
- Recent `topCategories`? → Check if recommendations match

### Check Relevance Scores
- Score < 20: Weak match, filtered out
- Score 20-50: Moderate match
- Score 50-75: Good match
- Score 75+: Excellent match

### Check Match Reasons
Should be specific:
- ✅ "Category: Computer Science"
- ✅ "By Robert Martin"
- ❌ "Recommended for you" (generic fallback)

## Performance Tips

1. **Ensure indexes exist**:
   ```javascript
   db.books.createIndex({ status: 1, categories: 1 });
   db.books.createIndex({ status: 1, author: 1 });
   ```

2. **Limit candidate pool**: Currently `limit * 5`

3. **Cache recommendations**: Use `recommendation-service.js`

4. **Rate limiting**: 20 requests/minute per user

---

**Version**: 2.0 | **Updated**: Nov 8, 2025
