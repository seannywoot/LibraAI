# Admin Dashboard Features

## Overview
The new admin dashboard provides real-time analytics and management capabilities for the LibraAI system, with dynamic updates and visual indicators for new data.

## Key Features

### 1. Dashboard Overview (Real-time Analytics)
- **Total Searches**: Displays total chat interactions with 24-hour activity indicator
- **FAQs Added**: Shows total FAQ count with 7-day additions
- **Unanswered Queries**: Highlights questions that need attention
- **Visual Indicators**: Animated pulse effects when new data is added
- **Auto-refresh**: Updates every 30 seconds automatically

### 2. Most Searched Keywords
- Visual bar chart showing top 10 search terms
- Excludes common stop words for better insights
- Based on last 7 days of activity
- Animated progress bars with gradient styling

### 3. Unanswered Questions Management
- Lists recent queries that the AI couldn't answer well
- "Convert to FAQ" button for each question
- Shows user information and timestamp
- Helps identify knowledge gaps

### 4. User Feedback Section
- Displays FAQ feedback logs
- Shows helpful/not helpful indicators
- Categorized by FAQ type
- Helps identify which FAQs need improvement

### 5. FAQ Management
- Quick access to add new FAQs
- Link to full FAQ management interface
- Statistics on total FAQs and categories

## FAQ Management Interface

### Features:
- **Add New FAQ**: Modal form with fields for:
  - Question
  - Answer
  - Category (General, Borrowing, Hours, Facilities, Policies, Billing, Support)
  - Keywords (comma-separated)

- **Edit FAQ**: Click edit icon to modify existing FAQs
- **Delete FAQ**: Remove FAQs with confirmation
- **Seed Database**: Populate with 11 default FAQs
- **Statistics Card**: Shows total FAQs and category count

### Visual Indicators:
- Category badges for easy identification
- Keyword tags for search optimization
- Hover effects for better UX
- Color-coded feedback indicators

## API Endpoints

### `/api/admin/analytics` (GET)
Returns comprehensive analytics data:
```json
{
  "success": true,
  "data": {
    "totalSearches": 12847,
    "recentSearches": 156,
    "totalFAQs": 284,
    "recentFAQs": 12,
    "unansweredCount": 47,
    "unansweredQuestions": [...],
    "faqFeedback": [...],
    "topKeywords": [...]
  }
}
```

### `/api/faq` (GET, POST)
- GET: Fetch all FAQs with optional filtering
- POST: Create new FAQ

### `/api/faq/[id]` (PUT, DELETE)
- PUT: Update existing FAQ
- DELETE: Remove FAQ

### `/api/faq/seed` (POST)
- Seed database with default FAQs

## Dynamic Updates

The dashboard implements real-time updates through:
1. **Polling**: Fetches new data every 30 seconds
2. **Visual Indicators**: Animated pulse effects on cards with new data
3. **Auto-dismiss**: Indicators fade after 3 seconds
4. **Smooth Transitions**: CSS transitions for all state changes

## Usage

1. Navigate to `/admin/dashboard` to view analytics
2. Click "Add New FAQ" to create FAQs directly from dashboard
3. Visit `/admin/faq-setup` for full FAQ management
4. Monitor unanswered questions and convert them to FAQs
5. Track user feedback to improve FAQ quality

## Technical Details

- Built with Next.js 16 and React 19
- Uses MongoDB for data storage
- Server-side authentication with NextAuth
- Client-side state management with React hooks
- Tailwind CSS for styling
- Lucide React for icons

## Future Enhancements

- Export analytics reports
- Advanced filtering and search
- Bulk FAQ operations
- Email notifications for unanswered questions
- A/B testing for FAQ effectiveness
- Integration with chatbot training
