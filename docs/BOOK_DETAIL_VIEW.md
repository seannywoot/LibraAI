# Book Detail View Feature

## Overview
Students can now click on any book card to view detailed information about that book, along with personalized recommendations for similar books.

## Features

### Book Detail Page
- **Full Book Information**: Displays comprehensive details including:
  - Title and author
  - ISBN, publisher, publication year
  - Format (Physical/eBook)
  - Category, language, pages, edition
  - Description
  - Current availability status

- **Interactive Actions**:
  - Borrow button for available physical books
  - Access button for eBooks with direct links
  - Status indicators for reserved/unavailable books

- **Navigation**: Easy back button to return to the catalog

### Recommended Books Section
- **Smart Recommendations**: Shows 8 related books based on:
  - Same author
  - Similar categories
  - Related topics/tags
  - Same publisher
  - Similar publication year

- **Match Indicators**: Each recommendation shows why it was suggested:
  - "Same author: [Author Name]"
  - "Similar category: [Category]"
  - "Similar topics"
  - "Same publisher"

- **Clickable Cards**: Click any recommended book to view its details

## Implementation

### Files Created
1. **`src/app/student/books/[bookId]/page.js`**
   - Dynamic route for individual book pages
   - Fetches book details and recommendations
   - Handles borrow actions

2. **`src/app/api/student/books/[bookId]/route.js`**
   - API endpoint to fetch individual book details
   - Checks user permissions for reserved books

### Files Modified
1. **`src/app/student/books/page.js`**
   - Made book cards clickable (both list and grid views)
   - Added links to book detail pages

2. **`src/app/api/student/books/recommendations/route.js`**
   - Added `getBookBasedRecommendations()` function
   - Supports `bookId` query parameter for book-specific recommendations
   - Scoring algorithm prioritizes:
     - Same author (50 points)
     - Category matches (30 points each)
     - Tag matches (20 points each)
     - Same publisher (10 points)
     - Similar publication year (up to 10 points)

## Usage

### For Students
1. **Browse the Catalog** at `/student/books`
   - Click anywhere on a book card to view details
   - Works in both list and grid view modes
   
2. **View Book Details**
   - See complete information about the book
   - View 8 personalized recommendations
   - Borrow or access the book directly
   
3. **My Library** at `/student/library`
   - Personal collection cards are displayed in grid layout
   - Borrowed books cards are clickable to view details
   - Click any borrowed book to see full information
   
4. **Action Buttons**
   - Borrow/Access buttons work without navigating away
   - Click the card background to view details
   - Click buttons to perform actions

### API Endpoints

#### Get Book Details
```
GET /api/student/books/[bookId]
```
Returns full book information including availability status.

#### Get Book-Based Recommendations
```
GET /api/student/books/recommendations?bookId=[bookId]&limit=8
```
Returns books similar to the specified book.

## Recommendation Algorithm

The system uses a multi-factor scoring approach:

1. **Author Match** (50 points): Books by the same author
2. **Category Match** (30 points per match): Books in similar categories
3. **Tag Match** (20 points per match): Books with similar topics
4. **Publisher Match** (10 points): Books from the same publisher
5. **Year Proximity** (up to 10 points): Books published around the same time
6. **Popularity Boost** (up to 10 points): Popular books get a slight boost

Books must score at least 10 points to be recommended, with a maximum score of 100.

## Future Enhancements
- Add book cover images
- Include user reviews and ratings
- Show borrowing history
- Add "Add to Wishlist" functionality
- Display related authors and series
- Show availability at different library locations
