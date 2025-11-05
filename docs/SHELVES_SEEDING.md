# Shelves Seeding Integration

## Overview

The book seeding system now automatically creates and populates shelves with books, making it easy to browse books by their physical location in the library.

## What's New

### Automatic Shelf Creation

When you seed books using the `/api/admin/books/seed` endpoint, the system now:

1. **Creates shelves automatically** - All unique shelf codes from the seeded books are created in the database
2. **Assigns locations** - Each shelf is given a descriptive location (e.g., "Main Floor - Fiction Section")
3. **Links books to shelves** - Books are properly associated with their shelf codes

### Shelf Locations

The seeded shelves are organized across multiple floors:

- **Main Floor**: Fiction (A1-A3), Science (B1-B3)
- **Second Floor**: Technology (C1-C3), History (D1-D2), Biography (E1-E2)
- **Third Floor**: Self-Help (F1-F2), Business (G1-G2), Non-Fiction (H1-H2)
- **Fourth Floor**: Arts (I1-I2), Education (J1-J2)
- **Ground Floor**: Children's Wing (K1-K2), Young Adult Wing (L1-L2)

## Features

### Browse Shelves Page (`/student/shelves`)

- **View all shelves** with their codes, names, and locations
- **See book counts** for each shelf
- **Search shelves** by code, name, or location
- **Click on a shelf** to view all books on that shelf

### Shelf Detail Page (`/student/shelves/[shelfId]`)

- **View all books** on a specific shelf
- **See shelf information** including code, name, and location
- **Search books** on the shelf by title, author, ISBN, or publisher
- **Borrow books** directly from the shelf view
- **See book status** (available, checked-out, reserved)

## How to Use

### Seed Books and Shelves

```bash
# Make sure server is running
npm run dev

# In another terminal, seed the data
curl -X POST http://localhost:3000/api/admin/books/seed
```

This will:

- Create 48 books across 12 categories
- Create 24 shelves (A1-L2)
- Link each book to its appropriate shelf

### Browse Shelves

1. Navigate to `/student/shelves`
2. Browse all available shelves
3. Click on any shelf to see its books
4. Use the search to find specific shelves or books

## API Endpoints

### List Shelves

```
GET /api/student/shelves?page=1&pageSize=20&search=fiction
```

Returns:

- List of shelves with book counts
- Pagination information
- Search results

### List Books on Shelf

```
GET /api/student/shelves/[shelfId]/books?page=1&pageSize=20&search=title
```

Returns:

- Shelf information (code, name, location)
- List of books on that shelf
- Pagination information
- Search results

## Database Schema

### Shelves Collection

```javascript
{
  _id: ObjectId,
  code: "A1",                    // Unique shelf code
  name: "Shelf A1",              // Display name
  location: "Main Floor - Fiction Section",  // Physical location
  createdAt: Date,
  updatedAt: Date,
  createdBy: "admin@example.com"
}
```

### Books Collection (shelf field)

```javascript
{
  _id: ObjectId,
  title: "To Kill a Mockingbird",
  author: "Harper Lee",
  shelf: "A1",                   // Links to shelf code
  // ... other fields
}
```

## Benefits

1. **Better Organization** - Books are organized by physical location
2. **Easy Navigation** - Students can find books by shelf location
3. **Realistic Library Experience** - Mimics real library shelf systems
4. **Automatic Setup** - No manual shelf creation needed
5. **Visual Feedback** - Book counts show which shelves have content

## Next Steps

After seeding, you can:

- Browse shelves at `/student/shelves`
- View books on specific shelves
- Search for books by location
- Borrow books directly from shelf views
