# Google Books API Integration - Admin Panel

## Overview
The admin book add form now integrates with Google Books API to automatically fetch book metadata and cover images, making it easier to add books with complete information.

## Features

### 1. Fetch from Google Books Button
- Located at the top right of the "Book details" section
- Searches Google Books API using ISBN (preferred) or Title
- Auto-fills empty form fields with fetched data
- Downloads and displays book cover image

### 2. Auto-filled Fields
When book data is found, the following fields are automatically populated (only if empty):
- **Title** - Book title from Google Books
- **Author** - Primary author
- **Year** - Publication year (extracted from publishedDate)
- **Publisher** - Publisher name
- **ISBN** - 13-digit ISBN (if not already entered)
- **Description** - Book description/summary
- **Category** - Mapped from Google Books categories to our category list
- **Cover Image** - Thumbnail image URL

### 3. Cover Image Preview
- When a cover is fetched, it displays in a preview card
- Shows a 20x28 thumbnail of the cover
- Can be removed by clicking the X button
- Automatically saved with the book when form is submitted

### 4. Category Mapping
Google Books categories are intelligently mapped to our system categories:
- Fiction → Fiction
- Science → Science
- Technology → Technology
- History → History
- Biography → Biography
- Self-Help → Self-Help
- Business → Business
- Art → Arts
- Education → Education
- Juvenile → Children
- Young Adult → Young Adult

## Usage

### Method 1: Search by ISBN
1. Enter the 13-digit ISBN in the ISBN field
2. Click "Fetch from Google Books"
3. Form fields will auto-populate with book data
4. Review and adjust as needed
5. Submit the form

### Method 2: Search by Title
1. Enter the book title in the Title field
2. Click "Fetch from Google Books"
3. Form fields will auto-populate with book data
4. Review and adjust as needed (title search may be less accurate)
5. Submit the form

## Technical Details

### API Endpoint
```
https://www.googleapis.com/books/v1/volumes?q={query}&maxResults=1
```

### Query Formats
- ISBN search: `isbn:9781234567890`
- Title search: `{encoded title}`

### Data Storage
The cover image URL is stored in the `coverImage` field in the books collection:
```javascript
{
  title: "Book Title",
  author: "Author Name",
  coverImage: "https://books.google.com/books/content?id=...",
  // ... other fields
}
```

### Display
Cover images are displayed in:
- Admin book add form (preview)
- Student book catalog (list and grid views)
- Student book detail pages
- Student library (borrowed and bookmarked books)
- Personal library books

## Benefits

1. **Time Saving** - No need to manually enter all book details
2. **Accuracy** - Data comes directly from Google Books database
3. **Visual Appeal** - Book covers make the catalog more engaging
4. **Better Discovery** - Descriptions help students find relevant books
5. **Consistency** - Standardized data format across all books

## Fallback Behavior

- If no book is found, a toast notification informs the admin
- Form fields remain unchanged if already filled
- Manual entry is always possible if Google Books doesn't have the book
- Cover image shows "No Cover" placeholder if not available

## Notes

- Google Books API is free and doesn't require an API key for basic usage
- Rate limits apply (1000 requests per day for unauthenticated requests)
- Not all books have cover images available
- Some older or niche books may not be in Google Books database
- Always review auto-filled data for accuracy before submitting
