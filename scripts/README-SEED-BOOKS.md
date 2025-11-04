# Book Seeding Quick Start

## Quick Run

```bash
# Make sure server is running first
npm run dev

# In another terminal, run the seed script
npm run seed-books
```

## What Gets Seeded

- **48 books** across 12 categories
- **Diverse formats**: Physical books and eBooks
- **Multiple shelves**: A1-L2
- **Various statuses**: Available, Checked-out, Reserved
- **Real book data**: Actual titles, authors, ISBNs, and publishers

## Categories Included

1. Fiction (5 books)
2. Science (5 books)
3. Technology (6 books)
4. History (4 books)
5. Biography (4 books)
6. Self-Help (4 books)
7. Business (4 books)
8. Non-Fiction (4 books)
9. Arts (3 books)
10. Education (3 books)
11. Children (3 books)
12. Young Adult (3 books)

## Features

- **Upsert logic**: Safe to run multiple times (updates existing books by ISBN)
- **Auto-generated barcodes**: Each book gets a unique barcode
- **Realistic data**: Real books with actual publication info
- **Status variety**: Mix of available, checked-out, and reserved books

## Verify Results

After seeding, check:
- Admin panel: http://localhost:3000/admin/books
- Student browse: http://localhost:3000/student/books

## Troubleshooting

If you get errors:
1. Ensure MongoDB is running
2. Check that you're logged in as admin
3. Verify server is running on port 3000
4. Check `.env.local` for correct MongoDB connection string

For more details, see `docs/BOOK_SEEDING.md`
