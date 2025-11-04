# Implementation Plan

- [x] 1. Set up database schema and collections

  - Create `user_interactions` collection with proper schema
  - Add indexes: `{ userId: 1, timestamp: -1 }`, `{ userEmail: 1, eventType: 1 }`, `{ expiresAt: 1 }` (TTL), `{ bookId: 1 }`
  - Extend `books` collection schema to include `categories` and `tags` fields
  - Create migration script to add default categories/tags to existing books based on their shelf/subject
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Implement behavior tracking API

  - Create POST `/api/student/books/track` endpoint to record user interactions
  - Implement validation for event types ("view" and "search")
  - Handle view events: extract and store bookId, title, author, categories, tags
  - Handle search events: store query text and applied filters
  - Set TTL (expiresAt) to 90 days from creation
  - Add authentication check using next-auth session
  - Implement error handling for invalid requests and database failures
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 3. Build recommendation engine core logic

  - Create `/api/student/books/recommendations` GET endpoint
  - Implement user history aggregation: query last 90 days of interactions
  - Extract top categories, tags, and authors from user history
  - Build MongoDB aggregation pipeline to find candidate books matching user interests
  - Exclude books already in user's personal library
  - Implement fallback logic for users with no history (show popular/recent books)
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 4. Implement relevance scoring algorithm

  - Create scoring function: categoryMatches _ 30 + tagMatches _ 20 + authorMatch _ 15 + recencyBoost _ 10 + popularityScore \* 0.25
  - Weight recent interactions (last 7 days) higher than older ones
  - Calculate popularity score based on view/borrow frequency
  - Filter recommendations by minimum relevance threshold (e.g., score > 20)
  - Sort recommendations by relevance score in descending order
  - Generate match reasons for each recommendation (e.g., "Same category: Computer Science")
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 5. Create client-side behavior tracking service

  - Create `src/lib/behavior-tracker.js` utility
  - Implement `trackBookView(bookId, bookData)` method
  - Implement `trackSearch(query, filters)` method
  - Add debouncing to prevent excessive API calls (300ms delay)
  - Implement queue-based batching (flush every 5 seconds or 10 events)
  - Add error handling with silent failures (log to console only)
  - _Requirements: 1.1, 1.2, 4.4_

- [x] 6. Build RecommendationCard component

  - Create `src/components/recommendation-card.jsx` component
  - Display book cover image (or placeholder if not available)
  - Show title (truncated to 2 lines with ellipsis)
  - Show author name
  - Display status chip using existing StatusChip component
  - Add match reason badge (e.g., "Similar to your searches")
  - Implement hover effect with scale transform
  - Add onClick handler to navigate to book details and track view event
  - Support compact mode prop for smaller displays
  - _Requirements: 3.2, 3.3_

- [x] 7. Build RecommendationsSidebar component

  - Create `src/components/recommendations-sidebar.jsx` component
  - Fetch recommendations from `/api/student/books/recommendations` on mount
  - Display loading skeleton while fetching (3-5 placeholder cards)
  - Show 3-10 RecommendationCard components based on available recommendations
  - Implement empty state: "Start browsing to get personalized recommendations"
  - Add error state with retry button
  - Position sidebar on the right side of the browse interface
  - Make sidebar sticky during scroll
  - Add responsive design: collapsible on mobile with toggle button
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 8. Integrate tracking into books browse page

  - Import and initialize behavior tracker in `src/app/student/books/page.js`
  - Track search events when user performs a search (debounced)
  - Track search events when filters are applied
  - Track view events when user clicks on a book card (navigate to detail page)
  - Ensure tracking doesn't block UI interactions (async/non-blocking)
  - _Requirements: 1.1, 1.2, 4.4_

- [x] 9. Integrate RecommendationsSidebar into browse page

  - Import RecommendationsSidebar component into `src/app/student/books/page.js`
  - Add sidebar to the layout (right side, alongside main content)
  - Adjust main content layout to accommodate sidebar (use flexbox or grid)
  - Pass context prop ("browse" or "search") based on current user action
  - Ensure sidebar doesn't interfere with existing filters sidebar
  - _Requirements: 3.1, 3.4_

- [x] 10. Implement dynamic recommendation updates

  - Add useEffect hook to refresh recommendations when search query changes
  - Add useEffect hook to refresh recommendations when filters change
  - Implement debouncing (500ms) to prevent excessive API calls during typing
  - Show loading indicator in sidebar during refresh
  - Update recommendations without full page reload
  - Maintain scroll position during updates
  - _Requirements: 4.1, 4.2, 4.3, 4.5_

- [x] 11. Add client-side caching for recommendations

  - Create `src/lib/recommendation-service.js` utility
  - Implement in-memory cache with 5-minute TTL
  - Cache recommendations by user and context
  - Return cached data immediately while fetching fresh data in background
  - Invalidate cache when user performs new interactions
  - _Requirements: 4.1, 4.3_

- [x]\* 12. Write API endpoint tests

  - Test POST `/api/student/books/track` with valid view events
  - Test POST `/api/student/books/track` with valid search events
  - Test POST `/api/student/books/track` with invalid/missing fields (expect 400)
  - Test POST `/api/student/books/track` without authentication (expect 401)
  - Test GET `/api/student/books/recommendations` with user history
  - Test GET `/api/student/books/recommendations` without user history (fallback)
  - Test GET `/api/student/books/recommendations` without authentication (expect 401)
  - Test recommendation scoring algorithm with various scenarios
  - _Requirements: All_

- [x]\* 13. Write component tests

  - Test RecommendationCard renders correctly with book data
  - Test RecommendationCard onClick handler
  - Test RecommendationCard compact mode
  - Test RecommendationsSidebar loading state
  - Test RecommendationsSidebar with recommendations
  - Test RecommendationsSidebar empty state
  - Test RecommendationsSidebar error state with retry
  - Test RecommendationsSidebar responsive behavior
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x]\* 14. Performance optimization and monitoring

  - Add database query performance logging
  - Optimize recommendation aggregation pipeline
  - Add rate limiting to tracking and recommendation endpoints
  - Monitor API response times (target: tracking <200ms, recommendations <500ms)
  - Test with large interaction datasets (1000+ events per user)
  - _Requirements: 4.1, 5.4_
