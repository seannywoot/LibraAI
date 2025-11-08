# Book Recommendation System - Enhanced Algorithm v2.0

## Overview
The recommendation system has been significantly improved with advanced algorithms that provide more accurate, diverse, and personalized book suggestions.

## Key Improvements

### 1. **Time-Decay Weighting**
User interactions are now weighted based on recency:
- **Last 7 days**: 3x weight (most relevant)
- **Last 30 days**: 2x weight
- **Older than 30 days**: 1.5x weight

This ensures recent interests are prioritized while still considering historical preferences.

### 2. **Enhanced User Profiling**
The system now tracks:
- **Categories** (top 7)
- **Tags** (top 8)
- **Authors** (top 5)
- **Publishers** (top 3)
- **Formats** (top 3)
- **Year preferences** (average preferred publication year)
- **Diversity score** (0-1, measures variety of interests)

### 3. **Multi-Strategy Candidate Selection**
Books are selected using multiple strategies:
- **Strategy 1**: Category/tag/author matches (primary)
- **Strategy 2**: Publisher-based recommendations
- **Strategy 3**: Format preferences
- **Strategy 4**: Year-based recommendations (±10 years from user's average)

### 4. **Advanced Scoring Algorithm**
Each book receives a relevance score (0-100) based on:

| Factor | Max Points | Description |
|--------|-----------|-------------|
| Category match | 75 | Diminishing returns: 35/60/75 for 1/2/3+ matches |
| Tag match | 60 | Diminishing returns: 25/45/60 for 1/2/3+ matches |
| Author match | 40 | Higher for top authors (40/35/30 for 1st/2nd/3rd) |
| Publisher match | 15 | Trusted publishers |
| Format match | 10 | User's preferred format |
| Year match | 20 | Closer to preferred year = higher score |
| Popularity | 30 | Logarithmic scale to prevent over-weighting |
| Diversity bonus | 10 | Encourages exploration for diverse users |
| Activity boost | 15 | Based on recent interactions |
| Engagement bonus | 5 | For users with 20+ interactions |

**Penalties:**
- Books with no strong matches (no category/tag/author match) get 50% score reduction

### 5. **Diversity Filtering**
Prevents recommendation monotony by limiting:
- **Max per author**: 2-3 books (based on diversity score)
- **Max per category**: 3-4 books
- **Max per publisher**: 3-4 books

High-scoring books (≥85) bypass diversity limits.

### 6. **Improved Search Query Analysis**
Search queries are now analyzed for:
- **Category keywords**: 10 categories with multiple keywords each
- **Author extraction**: Detects "by [author]" patterns
- **Filter preferences**: Tracks format and year preferences from filters

### 7. **Book-Based Recommendations Enhancement**
When recommending similar books:
- **Same author**: 60 points (highest priority)
- **Title similarity**: Detects series/related books
- **Category/tag matching**: Enhanced with diminishing returns
- **Year proximity**: Up to 15 points for similar publication years
- **Format consistency**: 10 points for same format
- **Diversity control**: Max 3 books per author (unless score ≥80)

## Algorithm Comparison

### Before (v1.0)
```
Simple scoring:
- Category: 30 points per match
- Tag: 20 points per match
- Author: 15 points
- Popularity: up to 25 points
- Recent publication: 5 points

Total possible: ~100 points
```

### After (v2.0)
```
Advanced scoring:
- Category: up to 75 points (diminishing)
- Tag: up to 60 points (diminishing)
- Author: up to 40 points (ranked)
- Publisher: 15 points
- Format: 10 points
- Year: up to 20 points
- Popularity: up to 30 points (logarithmic)
- Diversity: 10 points
- Activity: 15 points
- Engagement: 5 points

Total possible: 100 points (normalized)
With penalties and bonuses applied
```

## Response Enhancements

### New Metadata
The API now returns:
```json
{
  "ok": true,
  "recommendations": [...],
  "basedOn": {
    "viewCount": 15,
    "searchCount": 8,
    "totalInteractions": 23,
    "recentInteractions": 5,
    "topCategories": ["Computer Science", "Mathematics"],
    "topTags": ["Programming", "Algorithms"],
    "topAuthors": ["Robert Martin"],
    "diversityScore": 65,
    "preferredYear": 2018
  },
  "meta": {
    "candidatesEvaluated": 45,
    "algorithmsUsed": [
      "collaborative-filtering",
      "content-based",
      "popularity",
      "diversity"
    ],
    "version": "2.0"
  }
}
```

### Enhanced Book Data
Each recommendation now includes:
- `publisher`
- `isbn`
- `description`
- `relevanceScore` (0-100)
- `matchReasons` (up to 3 specific reasons)

## Benefits

### For Users
1. **More accurate recommendations** based on nuanced preferences
2. **Better diversity** - won't see 10 books by the same author
3. **Clearer explanations** - know why each book was recommended
4. **Exploration support** - diverse users get variety, focused users get depth
5. **Recency awareness** - recent interests weighted higher

### For the System
1. **Better engagement** - more relevant recommendations = more views
2. **Cold start handling** - multiple fallback strategies
3. **Scalability** - efficient queries with proper indexing
4. **Analytics** - detailed metadata for monitoring performance
5. **Flexibility** - easy to tune weights and thresholds

## Performance Considerations

### Query Optimization
- Fetches `limit * 5` candidates (up from `limit * 3`)
- Uses compound queries with `$or` for multiple strategies
- Proper indexing on: `status`, `categories`, `tags`, `author`, `publisher`, `format`, `year`

### Recommended Indexes
```javascript
db.books.createIndex({ status: 1, categories: 1 });
db.books.createIndex({ status: 1, tags: 1 });
db.books.createIndex({ status: 1, author: 1 });
db.books.createIndex({ status: 1, publisher: 1 });
db.books.createIndex({ status: 1, year: 1 });
db.books.createIndex({ popularityScore: -1 });
```

## Testing Recommendations

### Test Scenarios

1. **New User (No History)**
   - Should return popular books
   - Diverse categories

2. **Focused User (Single Category)**
   - Deep recommendations in that category
   - Some exploration suggestions

3. **Diverse User (Multiple Categories)**
   - Variety across categories
   - Balanced recommendations

4. **Author Loyalist**
   - More books by favorite authors
   - Similar authors

5. **Recent Activity**
   - Recent interests prioritized
   - Trending books in those areas

## Future Enhancements

### Potential Additions
1. **Collaborative filtering**: "Users who viewed X also viewed Y"
2. **Reading level matching**: Match complexity to user's history
3. **Seasonal recommendations**: Boost relevant books by time of year
4. **Social signals**: Friend recommendations, trending in network
5. **A/B testing framework**: Test different scoring weights
6. **Machine learning**: Train models on user behavior
7. **Negative signals**: Track books user dismissed/disliked

### Configuration Options
Consider making these tunable:
- Time-decay weights
- Score weights per factor
- Diversity thresholds
- Minimum relevance threshold
- Candidate multiplier

## Monitoring

### Key Metrics to Track
1. **Click-through rate**: % of recommendations clicked
2. **Diversity score**: Average across all recommendations
3. **Score distribution**: Are scores well-distributed?
4. **Fallback rate**: How often do we fall back to popular books?
5. **User satisfaction**: Implicit (views) and explicit (ratings)

## Version History

- **v2.0** (Current): Enhanced algorithm with diversity, time-decay, multi-strategy
- **v1.0**: Basic category/tag/author matching

---

**Last Updated**: November 8, 2025
**Algorithm Version**: 2.0
**Status**: Production Ready ✅
