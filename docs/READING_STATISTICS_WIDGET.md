# Reading Statistics Widget

## Overview
The Reading Statistics Widget displays personalized user metrics on the student dashboard, providing insights into their reading habits and library activity.

## Features

### Statistics Cards (4 metrics)
1. **Total Borrowed** - All-time count of books borrowed
2. **Currently Reading** - Active borrowed books with pending requests count
3. **Books Returned** - Total returned with on-time percentage
4. **Viewed This Month** - Books explored in the current month

### Favorite Categories & Authors
- **Top 3 Categories** - Most viewed categories with view counts
- **Top 3 Authors** - Most viewed authors with view counts
- Quick links to explore more books

## API Endpoint

### GET `/api/student/stats`

**Authentication:** Required (session-based)

**Response:**
```json
{
  "ok": true,
  "stats": {
    "totalBorrowed": 15,
    "currentlyBorrowed": 3,
    "totalReturned": 12,
    "onTimeReturns": 10,
    "overdueReturns": 2,
    "pendingRequests": 1,
    "favoriteCategories": [
      { "name": "Computer Science", "count": 25 },
      { "name": "Mathematics", "count": 18 },
      { "name": "Physics", "count": 12 }
    ],
    "favoriteAuthors": [
      { "name": "Robert C. Martin", "count": 8 },
      { "name": "Martin Fowler", "count": 6 },
      { "name": "Kent Beck", "count": 5 }
    ],
    "booksViewedThisMonth": 42,
    "memberSince": "2024-01-15T08:30:00.000Z"
  }
}
```

## Data Sources

### MongoDB Collections Used

1. **transactions** - Borrowing history and status
   - Aggregates: total borrowed, currently borrowed, returned, on-time vs overdue
   
2. **user_interactions** - User activity tracking
   - Aggregates: favorite categories, favorite authors, monthly views
   
3. **users** - User profile data
   - Provides: member since date

## Calculations

### On-Time Return Percentage
```javascript
onTimePercentage = (onTimeReturns / totalReturned) * 100
```

### Favorite Categories
- Based on `view` events in `user_interactions`
- Counts category occurrences
- Returns top 3 by frequency

### Favorite Authors
- Based on `view` events with `bookAuthor` field
- Counts author occurrences
- Returns top 3 by frequency

### Books Viewed This Month
- Counts `view` events since start of current month
- Timezone: Asia/Manila

## Visual Design

### Color Coding
- **Blue** - Total Borrowed (informational)
- **Amber** - Currently Reading (active)
- **Green** - Books Returned (success)
- **Purple** - Viewed This Month (discovery)

### Layout
- 4-column grid on large screens
- 2-column grid on medium screens
- Single column on mobile
- Responsive card design with icons

## Performance

- **Caching:** No cache (`cache: "no-store"`)
- **Load Time:** Separate from main dashboard data
- **Aggregation:** MongoDB aggregation pipeline for efficiency
- **Fallback:** Empty stats for new users without data

## User Experience

1. **Loading State:** Widget hidden during load
2. **Empty State:** Gracefully handles new users with no activity
3. **Progressive Enhancement:** Shows only if data exists
4. **Quick Actions:** Links to explore more books

## Future Enhancements

Potential improvements:
1. Reading goals with progress bars
2. Comparison with peer averages (anonymous)
3. Reading streaks and badges
4. Monthly/yearly trends charts
5. Export statistics as PDF
6. Achievement unlocks
7. Reading speed analytics
8. Genre diversity score

## Technical Notes

- Uses React hooks for state management
- Separate API call from main dashboard data
- Handles errors gracefully without breaking dashboard
- Supports demo users with empty stats
- MongoDB aggregation for performance
