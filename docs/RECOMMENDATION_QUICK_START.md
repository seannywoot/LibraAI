# Recommendation Engine v3.0 - Quick Start

## Setup (5 minutes)

### 1. Create Database Indexes
```bash
node scripts/setup-recommendation-indexes.js
```

### 2. Test the System
```bash
node scripts/test-recommendations.js
```

## Integration

### Track Book Views
Add to book detail page (`src/app/student/books/[bookId]/page.js`):

```javascript
useEffect(() => {
  fetch(`/api/student/books/${bookId}/track-view`, {
    method: 'POST',
  });
}, [bookId]);
```

### Display Recommendations
```javascript
const [recommendations, setRecommendations] = useState([]);

useEffect(() => {
  fetch('/api/student/books/recommendations?limit=10')
    .then(res => res.json())
    .then(data => setRecommendations(data.recommendations));
}, []);

return (
  <div>
    <h2>Recommended for You</h2>
    {recommendations.map(book => (
      <BookCard
        key={book._id}
        book={book}
        score={book.relevanceScore}
        reasons={book.matchReasons}
      />
    ))}
  </div>
);
```

### Track Other Interactions
```javascript
import {
  trackSearch,
  trackBorrow,
  trackBookmark,
  trackNote,
} from '@/lib/interaction-tracker';

// After search
await trackSearch({
  userId: session.user.email,
  searchQuery: query,
  searchFilters: filters,
  resultCount: results.length,
});

// After bookmark
await trackBookmark({
  userId: session.user.email,
  bookId: book._id,
  bookTitle: book.title,
  action: 'add', // or 'remove'
});
```

## API Endpoints

### Get Recommendations
```
GET /api/student/books/recommendations
Query params:
  - limit: number (default: 10, max: 20)
  - context: string (browse, search, etc.)
  - currentBookId: string (exclude this book)
  - bookId: string (get similar books)
```

### Track View
```
POST /api/student/books/[bookId]/track-view
```

## Scoring System

### Points Breakdown
- **Category match**: 40 pts
- **Author match**: 50 pts  
- **Popularity**: 35 pts
- **Tag match**: 30 pts
- **Year proximity**: 25 pts
- **Publisher**: 20 pts
- **Engagement**: 20 pts
- **Recency**: 20 pts
- **Format**: 15 pts
- **Diversity**: 15 pts

### Engagement Levels
- **Low** (0-20): Basic recommendations
- **Medium** (21-50): Balanced mix
- **High** (51-100): Highly personalized
- **Power** (100+): Advanced, niche recommendations

## Key Features

✅ **Collaborative filtering** - "Users who borrowed X also borrowed Y"
✅ **Content-based** - Match categories, tags, authors
✅ **Time-decay** - Recent interactions matter more
✅ **Diversity** - Prevents monotony
✅ **Engagement-based** - Adapts to user activity level
✅ **Real transaction data** - Uses actual borrowing patterns

## Monitoring

### Check User Profile
```javascript
const response = await fetch('/api/student/books/recommendations?limit=1');
const data = await response.json();
console.log(data.basedOn); // User profile summary
```

### Interaction Stats
```javascript
import { getUserInteractionSummary } from '@/lib/interaction-tracker';

const summary = await getUserInteractionSummary(userId, 90);
// Returns: { view: 15, search: 8, borrow: 3, bookmark_add: 5, ... }
```

## Troubleshooting

### No Recommendations?
1. Check if user has interactions: `db.user_interactions.find({ userEmail: "user@example.com" })`
2. Check if books are available: `db.books.find({ status: "available" })`
3. Check indexes: `db.books.getIndexes()`

### Low Relevance Scores?
- User needs more interactions (views, searches, borrows)
- Books may not match user's interests
- Check if categories/tags are populated on books

### Slow Performance?
1. Run index setup script
2. Check query execution time
3. Reduce candidate pool size in code

## Best Practices

1. **Track all interactions** - More data = better recommendations
2. **Show relevance scores** - Help users understand why books are recommended
3. **Display match reasons** - Build trust in the system
4. **Monitor engagement** - Track click-through and borrow rates
5. **Tune parameters** - Adjust weights based on your data

## Next Steps

1. ✅ Set up indexes
2. ✅ Test with sample data
3. ✅ Integrate tracking in UI
4. ✅ Display recommendations
5. ✅ Monitor metrics
6. ✅ Tune parameters

---

**Version**: 3.0 | **Updated**: Nov 9, 2025
