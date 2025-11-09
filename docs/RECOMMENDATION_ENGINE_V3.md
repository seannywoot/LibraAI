# Advanced Recommendation Engine v3.0

## Overview

The new recommendation engine provides personalized book suggestions based on comprehensive user behavior tracking and multiple recommendation strategies.

## Key Features

### 1. **Comprehensive Behavior Tracking**
Tracks all user interactions:
- **Book views**: When users view book details
- **Searches**: Query patterns and filters
- **Borrows**: Transaction history
- **Bookmarks**: Saved books
- **Notes**: Books with annotations
- **Returns**: Completion patterns
- **Reading completion**: Finished books

### 2. **Advanced User Profiling**
Builds detailed user profiles including:
- Top 10 categories (weighted by engagement)
- Top 12 tags
- Top 8 authors
- Top 5 publishers
- Top 3 formats
- Average preferred publication year
- Diversity score (0-1)
- Engagement level (low, medium, high, power)
- Unique books interacted with

### 3. **Multi-Strategy Recommendations**

#### Strategy 1: Content-Based Filtering
Matches books based on:
- Categories (40 points max)
- Tags (30 points max)
- Authors (50 points max)
- Publishers (20 points)
- Formats (15 points)
- Publication year (25 points max)

#### Strategy 2: Collaborative Filtering
"Users who borrowed X also borrowed Y"
- Finds similar users based on borrowing patterns
- Recommends books borrowed by users with similar tastes
- Requires at least 2 books in common
- Weighted by number of similar users

#### Strategy 3: Engagement-Based
Adjusts recommendations based on user engagement:
- **Power users** (100+ engagement score): +20 points
- **High engagement** (50-100): +15 points
- **Medium engagement** (20-50): +10 points
- **Low engagement** (<20): +5 points

#### Strategy 4: Diversity Optimization
For users with diverse interests (score > 0.6):
- Encourages exploration outside top categories
- +15 points for books in related but different categories
- Prevents recommendation monotony

### 4. **Time-Decay Weighting**
Recent interactions matter more:
- **Last 7 days**: 3x weight
- **Last 30 days**: 2x weight
- **30-90 days**: 1.5x weight

### 5. **Interaction Weights**
Different actions have different importance:
- **Reading completion**: 10x
- **Borrow**: 8x
- **Note creation**: 6x
- **Bookmark**: 5x
- **View**: 1x
- **Search**: 0.5x

## Scoring Algorithm

### Maximum Points Breakdown
```
Category match:     40 pts (diminishing: 40/70/90 for 1/2/3+ matches)
Author match:       50 pts (ranked: 50/45/40 for 1st/2nd/3rd favorite)
Popularity:         35 pts (logarithmic scale)
Tag match:          30 pts (diminishing: 30/50/70)
Year proximity:     25 pts (closer = higher)
Publisher match:    20 pts
Engagement boost:   20 pts (based on user level)
Recency boost:      20 pts (recent activity)
Format match:       15 pts
Diversity bonus:    15 pts (for diverse users)
```

### Penalties
- **No strong match**: -60% score (no category/tag/author match)
- **Minimum threshold**: 20 points (filtered out below this)

### Diversity Filtering
Prevents monotony by limiting:
- **Max per author**: 2-3 books (based on diversity score)
- **Max per category**: 3-4 books
- **Exception**: Books with score ≥90 bypass limits

## API Usage

### Get Personalized Recommendations
```javascript
GET /api/student/books/recommendations?limit=10&context=browse

Response:
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
        "By Robert Martin",
        "Highly popular"
      ],
      // ... other book fields
    }
  ],
  "basedOn": {
    "totalInteractions": 45,
    "topCategories": ["Computer Science", "Mathematics"],
    "topAuthors": ["Robert Martin", "Martin Fowler"],
    "diversityScore": 65,
    "engagementLevel": "high"
  },
  "meta": {
    "algorithmsUsed": [
      "collaborative-filtering",
      "content-based",
      "popularity",
      "diversity",
      "engagement-based"
    ],
    "version": "3.0"
  }
}
```

### Get Similar Books
```javascript
GET /api/student/books/recommendations?bookId=abc123&limit=5
```

### Track Book View
```javascript
POST /api/student/books/[bookId]/track-view
```

## Implementation Guide

### 1. Track User Interactions

#### In Book Detail Page
```javascript
// src/app/student/books/[bookId]/page.js
useEffect(() => {
  // Track view when user opens book details
  fetch(`/api/student/books/${bookId}/track-view`, {
    method: 'POST',
  });
}, [bookId]);
```

#### In Search Component
```javascript
// Track search queries
import { trackSearch } from '@/lib/interaction-tracker';

await trackSearch({
  userId: session.user.email,
  searchQuery: query,
  searchFilters: filters,
  resultCount: results.length,
});
```

#### In Borrow Flow
```javascript
// Track when user borrows a book
import { trackBorrow } from '@/lib/interaction-tracker';

await trackBorrow({
  userId: session.user.email,
  bookId: book._id,
  bookTitle: book.title,
  bookAuthor: book.author,
  bookCategories: book.categories,
  loanDays: 14,
});
```

### 2. Display Recommendations

```javascript
// Fetch recommendations
const response = await fetch('/api/student/books/recommendations?limit=10');
const data = await response.json();

// Display with relevance scores and reasons
{data.recommendations.map(book => (
  <BookCard
    key={book._id}
    book={book}
    relevanceScore={book.relevanceScore}
    matchReasons={book.matchReasons}
  />
))}
```

### 3. Database Indexes

Create these indexes for optimal performance:

```javascript
// MongoDB indexes
db.user_interactions.createIndex({ userId: 1, timestamp: -1 });
db.user_interactions.createIndex({ eventType: 1, timestamp: -1 });
db.books.createIndex({ status: 1, categories: 1 });
db.books.createIndex({ status: 1, tags: 1 });
db.books.createIndex({ status: 1, author: 1 });
db.books.createIndex({ status: 1, publisher: 1 });
db.books.createIndex({ popularityScore: -1 });
db.transactions.createIndex({ userId: 1, status: 1, borrowedAt: -1 });
db.bookmarks.createIndex({ userId: 1 });
db.notes.createIndex({ userId: 1 });
```

## Engagement Levels

### Low (0-20 points)
- Few interactions
- Basic recommendations
- More popular books shown

### Medium (21-50 points)
- Regular user
- Balanced recommendations
- Mix of popular and personalized

### High (51-100 points)
- Active user
- Highly personalized
- Deep category exploration

### Power (100+ points)
- Very active user
- Advanced personalization
- Niche recommendations
- Maximum diversity

## Collaborative Filtering Details

### How It Works
1. Find users who borrowed the same books as current user
2. Require at least 2 books in common
3. Get top 10 most similar users
4. Find books they borrowed (that current user hasn't)
5. Rank by number of similar users who borrowed it
6. Require at least 2 similar users borrowed the book

### Benefits
- Discovers books outside user's usual categories
- Leverages wisdom of the crowd
- Works well for popular books
- Complements content-based filtering

## Performance Considerations

### Query Optimization
- Fetches up to 100 candidate books
- Uses compound indexes
- Filters in database, not in memory
- Caches user profiles (future enhancement)

### Scalability
- Interaction cleanup: keeps last 180 days
- Aggregation pipelines for collaborative filtering
- Efficient scoring algorithm
- Minimal database round trips

## Monitoring & Analytics

### Key Metrics to Track
1. **Click-through rate**: % of recommendations clicked
2. **Borrow rate**: % of recommendations borrowed
3. **Average relevance score**: Quality of matches
4. **Diversity distribution**: Variety in recommendations
5. **Engagement progression**: Users moving up levels
6. **Collaborative filter hit rate**: % using collaborative data

### Debug Information
Each recommendation includes:
- `relevanceScore`: 0-100 quality score
- `matchReasons`: Why it was recommended
- User profile summary in `basedOn`

## Future Enhancements

### Planned Features
1. **Reading level matching**: Match complexity to user
2. **Seasonal recommendations**: Time-based suggestions
3. **Social features**: Friend recommendations
4. **Negative signals**: Track dismissed books
5. **A/B testing**: Test different algorithms
6. **Machine learning**: Train models on behavior
7. **Real-time updates**: WebSocket for live recommendations
8. **Caching layer**: Redis for user profiles
9. **Recommendation explanations**: Detailed reasoning
10. **Feedback loop**: Learn from user actions

### Tuning Parameters
Easily adjustable in code:
- Time-decay weights
- Interaction weights
- Score weights per factor
- Diversity thresholds
- Minimum relevance threshold
- Candidate pool size

## Migration from v2.0

### Breaking Changes
- New interaction tracking system
- Different API response structure
- Requires database indexes

### Migration Steps
1. Create new indexes
2. Deploy new code
3. Start tracking interactions
4. Monitor for 1-2 weeks
5. Tune parameters based on metrics

### Backward Compatibility
- Falls back to popular books for new users
- Works without interaction history
- Gradual improvement as data accumulates

## Testing

### Test Scenarios

#### New User
```javascript
// Should return popular books
// No personalization yet
```

#### Single Category User
```javascript
// Should show deep recommendations in that category
// Some exploration suggestions
```

#### Diverse User
```javascript
// Should show variety across categories
// Balanced recommendations
```

#### Power User
```javascript
// Should show niche recommendations
// Advanced personalization
// Maximum diversity
```

## Version History

- **v3.0** (Current): Collaborative filtering, engagement-based, comprehensive tracking
- **v2.0**: Enhanced algorithm with diversity, time-decay, multi-strategy
- **v1.0**: Basic category/tag/author matching

---

**Last Updated**: November 9, 2025
**Algorithm Version**: 3.0
**Status**: Production Ready ✅
