# Authors Seeding Guide

## Overview

The authors seeding system provides canonical author entries with complete biographies for all authors in the seeded book collection.

## What Gets Seeded

- **48 Authors** - One for each unique author in the book collection
- **Complete Biographies** - Detailed information about each author's life and work
- **Proper Normalization** - Names are properly formatted and normalized for searching

## Authors Included

### Fiction Authors
- Harper Lee - Author of "To Kill a Mockingbird"
- George Orwell - Author of "1984"
- Jane Austen - Author of "Pride and Prejudice"
- F. Scott Fitzgerald - Author of "The Great Gatsby"
- J.D. Salinger - Author of "The Catcher in the Rye"

### Science Authors
- Stephen Hawking - Theoretical physicist and cosmologist
- Richard Dawkins - Evolutionary biologist
- Carl Sagan - Astronomer and science communicator
- Charles Darwin - Naturalist and biologist
- Yuval Noah Harari - Historian and author of "Sapiens"

### Technology Authors
- Robert C. Martin - "Uncle Bob", clean code advocate
- Andrew Hunt - Co-author of "The Pragmatic Programmer"
- Erich Gamma - Gang of Four, design patterns expert
- Thomas H. Cormen - Co-author of "Introduction to Algorithms"
- Stuart Russell - AI researcher and textbook author
- Ian Goodfellow - Deep learning researcher

### History Authors
- Jared Diamond - Author of "Guns, Germs, and Steel"
- Anne Frank - Holocaust diarist
- Howard Zinn - Author of "A People's History"
- William L. Shirer - Author of "The Rise and Fall of the Third Reich"

### Biography Authors
- Walter Isaacson - Biographer of Steve Jobs, Einstein
- Malcolm X - Civil rights activist
- Nelson Mandela - Anti-apartheid revolutionary
- Michelle Obama - Former First Lady

### Self-Help Authors
- James Clear - Author of "Atomic Habits"
- Stephen Covey - Author of "7 Habits"
- Dale Carnegie - Author of "How to Win Friends"
- Daniel Kahneman - Psychologist and Nobel laureate

### Business Authors
- Eric Ries - Creator of Lean Startup methodology
- Jim Collins - Author of "Good to Great"
- Peter Thiel - Entrepreneur and author of "Zero to One"
- Clayton M. Christensen - Disruptive innovation theorist

### Non-Fiction Authors
- Tara Westover - Author of "Educated"
- Rebecca Skloot - Author of "The Immortal Life of Henrietta Lacks"
- Steven D. Levitt - Co-author of "Freakonomics"
- Susan Cain - Author of "Quiet"

### Arts Authors
- E.H. Gombrich - Art historian
- John Berger - Art critic and author
- Robert Henri - Painter and teacher

### Education Authors
- Paulo Freire - Author of "Pedagogy of the Oppressed"
- John Holt - Homeschooling advocate
- Carol S. Dweck - Mindset researcher

### Children's Authors
- J.K. Rowling - Harry Potter series
- E.B. White - Charlotte's Web
- Maurice Sendak - Where the Wild Things Are

### Young Adult Authors
- Suzanne Collins - The Hunger Games
- John Green - The Fault in Our Stars
- Lois Lowry - The Giver

## How to Seed

### Using the Admin Seed Page (Recommended)

1. Navigate to `http://localhost:3000/admin/seed`
2. Click the **"Seed Authors"** button
3. View the results showing inserted/updated/skipped counts

### Using the API Directly

```bash
# PowerShell
Invoke-WebRequest -Uri http://localhost:3000/api/admin/authors/seed -Method POST

# Or using curl.exe
curl.exe -X POST http://localhost:3000/api/admin/authors/seed
```

## Features

### Upsert Logic
- If an author with the same name exists, it will be updated (bio added if missing)
- If no author exists with that name, a new one will be created
- Safe to run multiple times

### Name Normalization
- Names are stored with proper capitalization
- A `nameLower` field is created for case-insensitive searching
- Unique index on `nameLower` prevents duplicates

### Complete Biographies
Each author entry includes:
- Full name
- Comprehensive biography
- Notable works and achievements
- Historical context and significance

## Database Schema

```javascript
{
  _id: ObjectId,
  name: "Harper Lee",
  nameLower: "harper lee",
  bio: "American novelist best known for 'To Kill a Mockingbird'...",
  createdAt: Date,
  updatedAt: Date,
  createdBy: "admin@example.com"
}
```

## Viewing Authors

### Student View
- Navigate to `/student/authors`
- Browse all authors with their biographies
- See book count for each author
- Click on an author to view their books
- Paginated list with 20 authors per page

### Student Author Detail
- Navigate to `/student/authors/[authorId]`
- View author biography
- See all books by the author
- View book availability and location
- Click on books to see details

### Admin View
- Navigate to `/admin/authors`
- Full CRUD operations
- View book counts for each author
- Edit author information
- Delete authors
- Click on author to see their books

## Integration with Books

The authors seeded here correspond to the authors in the book collection. The system automatically links books to authors by matching the author name field:

### Features:
- **Book Counts**: Each author shows how many books they have in the collection
- **Author Detail Pages**: Click on any author to see all their books
- **Book Listings**: Books are displayed with:
  - Title and publication year
  - Publisher information
  - Shelf location
  - Availability status
  - Format (Physical/eBook)
- **Navigation**: Easy navigation between authors and their books
- **Search Integration**: Author names are used in book search and recommendations

## Troubleshooting

### "Duplicate Key Error"
If you get a duplicate key error on `nameLower`:
1. Run the "Fix Index" button on the seed page first
2. This will recreate the index with proper sparse settings

### Authors Not Appearing
Check:
1. The API response for any errors
2. MongoDB connection in the server logs
3. That you're viewing the correct page

### Missing Biographies
If authors exist but don't have bios:
- Run the seed again - it will update existing authors with missing bios
- The seed is idempotent and safe to run multiple times

## Next Steps

After seeding authors:
1. Visit `/admin/authors` to view all seeded authors
2. Check `/student/authors` to see the student view
3. Consider linking books to their canonical authors
4. Use author data for enhanced search and recommendations


## API Endpoints

### List Authors (Student)
```
GET /api/student/authors?page=1&pageSize=20
```

Returns:
- List of authors with biographies
- Book count for each author
- Pagination information

### Author Books (Student)
```
GET /api/student/authors/[authorId]/books?page=1&pageSize=20
```

Returns:
- Author information and biography
- List of books by the author
- Book availability and details
- Pagination information

### List Authors (Admin)
```
GET /api/admin/authors?page=1&pageSize=20&s=search
```

Returns:
- List of authors with biographies
- Search functionality
- Pagination information

### Author Books (Admin)
```
GET /api/admin/authors/[id]/books?page=1&pageSize=20
```

Returns:
- Author information
- Complete list of books by the author
- Full book details including barcode and ISBN
- Pagination information

## How Book Counts Work

The system counts books by matching the `author` field in the books collection with the `name` field in the authors collection:

```javascript
// Example query
const bookCount = await books.countDocuments({ author: "Harper Lee" });
```

This means:
- Book counts are calculated in real-time
- Adding/removing books automatically updates counts
- Author names must match exactly (case-sensitive)
- The seeded data ensures proper matching
