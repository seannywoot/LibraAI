# Book Seeding Guide

This guide explains how to seed the database with sample books for testing and development.

## Overview

The book seeding system provides 48 diverse books across:
- **12 Categories**: Fiction, Science, Technology, History, Biography, Self-Help, Business, Non-Fiction, Arts, Education, Children, Young Adult
- **2 Formats**: Physical Book, eBook
- **Multiple Shelves**: A1-A3, B1-B3, C1-C3, D1-D2, E1-E2, F1-F2, G1-G2, H1-H2, I1-I2, J1-J2, K1-K2, L1-L2
- **Various Statuses**: Available, Checked-out, Reserved

## Methods

### Method 1: Using the API Endpoint (Recommended)

The easiest way to seed books is through the API endpoint:

```bash
# Make sure your server is running
npm run dev

# In another terminal, make a POST request
curl -X POST http://localhost:3000/api/admin/books/seed
```

**Requirements:**
- Server must be running
- Must be authenticated as an admin user
- MongoDB connection must be active

### Method 2: Using the Seed Script

Run the automated seed script:

```bash
node scripts/seed-books.js
```

This script will:
1. Seed all 48 books into the database
2. Display a summary of inserted/updated books
3. Show statistics by category, format, and status

## Sample Books Included

### Fiction (5 books)
- To Kill a Mockingbird by Harper Lee
- 1984 by George Orwell
- Pride and Prejudice by Jane Austen
- The Great Gatsby by F. Scott Fitzgerald
- The Catcher in the Rye by J.D. Salinger

### Science (5 books)
- A Brief History of Time by Stephen Hawking
- The Selfish Gene by Richard Dawkins
- Cosmos by Carl Sagan
- The Origin of Species by Charles Darwin
- Sapiens by Yuval Noah Harari

### Technology (6 books)
- Clean Code by Robert C. Martin
- The Pragmatic Programmer by Andrew Hunt
- Design Patterns by Erich Gamma
- Introduction to Algorithms by Thomas H. Cormen
- Artificial Intelligence: A Modern Approach by Stuart Russell
- Deep Learning by Ian Goodfellow (eBook)

### History (4 books)
- Guns, Germs, and Steel by Jared Diamond
- The Diary of a Young Girl by Anne Frank
- A People's History of the United States by Howard Zinn
- The Rise and Fall of the Third Reich by William L. Shirer

### Biography (4 books)
- Steve Jobs by Walter Isaacson
- The Autobiography of Malcolm X by Malcolm X
- Long Walk to Freedom by Nelson Mandela
- Becoming by Michelle Obama

### Self-Help (4 books)
- Atomic Habits by James Clear
- The 7 Habits of Highly Effective People by Stephen Covey
- How to Win Friends and Influence People by Dale Carnegie
- Thinking, Fast and Slow by Daniel Kahneman

### Business (4 books)
- The Lean Startup by Eric Ries
- Good to Great by Jim Collins
- Zero to One by Peter Thiel
- The Innovator's Dilemma by Clayton M. Christensen

### Non-Fiction (4 books)
- Educated by Tara Westover
- The Immortal Life of Henrietta Lacks by Rebecca Skloot
- Freakonomics by Steven D. Levitt
- Quiet: The Power of Introverts by Susan Cain

### Arts (3 books)
- The Story of Art by E.H. Gombrich
- Ways of Seeing by John Berger
- The Art Spirit by Robert Henri

### Education (3 books)
- Pedagogy of the Oppressed by Paulo Freire
- How Children Learn by John Holt
- Mindset: The New Psychology of Success by Carol S. Dweck

### Children (3 books)
- Harry Potter and the Sorcerer's Stone by J.K. Rowling
- Charlotte's Web by E.B. White
- Where the Wild Things Are by Maurice Sendak

### Young Adult (3 books)
- The Hunger Games by Suzanne Collins
- The Fault in Our Stars by John Green
- The Giver by Lois Lowry

## Features

### Upsert Logic
The seeding process uses upsert logic based on ISBN:
- If a book with the same ISBN exists, it will be updated
- If no book exists with that ISBN, a new one will be created
- This allows you to run the seed multiple times safely

### Automatic Barcode Generation
Each book gets a unique barcode in the format `BC-XXXXXX` where X is a random digit.

### Diverse Data
Books include:
- Various publication years (1813-2020)
- Different publishers
- Multiple loan policies (standard, reference-only, staff-only)
- Different statuses (available, checked-out, reserved)
- Both physical books and eBooks

## Troubleshooting

### "Unauthorized" Error
Make sure you're authenticated as an admin user. The seed endpoint requires admin privileges.

### "Connection Failed" Error
Ensure:
1. MongoDB is running and connected
2. The development server is running (`npm run dev`)
3. Environment variables are properly configured

### Books Not Appearing
Check:
1. The API response for any errors
2. MongoDB connection in the server logs
3. That you're viewing the correct page in the admin panel

## Next Steps

After seeding:
1. Visit `/admin/books` to view all seeded books
2. Test filtering by category, format, and status
3. Try the student book browsing interface at `/student/books`
4. Test the recommendation system with diverse book data
