# Advanced Search Syntax

## Overview

The catalog, shelves, and authors pages now support advanced search syntax that allows users to search by specific fields using a structured format.

## Supported Syntax

### Field-Specific Search

Use the format `field: value` to search specific fields:

```
author: J.K. Rowling
subject: Artificial Intelligence
year: 2023
title: Harry Potter
isbn: 978-0-7475-3269-9
publisher: Penguin
shelf: A1
```

### Combined Searches

You can combine multiple field searches:

```
author: Tolkien year: 2001
subject: Fantasy author: George R.R. Martin
title: Harry Potter year: 1997
```

### Mixed Search

Combine field-specific searches with free text:

```
author: Tolkien fantasy adventure
year: 2023 machine learning
```

## Examples by Page

### Books Catalog (`/student/books`)

- `author: J.K. Rowling` - Find all books by J.K. Rowling
- `subject: Artificial Intelligence` - Find books about AI
- `year: 2023` - Find books published in 2023
- `author: Tolkien subject: Fantasy` - Find fantasy books by Tolkien
- `title: Harry Potter year: 2001` - Find Harry Potter books from 2001

### Shelves (`/student/shelves`)

- `shelf: A1` - Find shelf A1
- `shelf: B` - Find all shelves starting with B
- Combined with free text: `shelf: A science` - Find shelves with "A" in code and "science" in name/location

### Shelf Books (`/student/shelves/[shelfId]/books`)

- `author: Tolkien` - Find books by Tolkien on this shelf
- `year: 2023` - Find books from 2023 on this shelf
- `subject: Science` - Find science books on this shelf

### Authors (`/student/authors`)

- `author: Tolkien` - Find author Tolkien
- `author: J.K.` - Find authors with "J.K." in their name

## Implementation Details

### Parser (`src/utils/searchParser.js`)

The `parseSearchQuery()` function extracts field-specific filters and free text:

```javascript
const { filters, freeText } = parseSearchQuery("author: Tolkien fantasy");
// filters = { author: "Tolkien" }
// freeText = "fantasy"
```

### Database Query Builder

The `buildSearchQuery()` function converts parsed filters into MongoDB queries:

```javascript
const query = buildSearchQuery("author: Tolkien year: 2001");
// Generates MongoDB query with $or conditions for matching fields
```

### API Integration

Each API route now uses the search parser:

- `/api/student/books` - Full field support
- `/api/student/shelves` - Shelf-specific support
- `/api/student/shelves/[shelfId]/books` - Full field support
- `/api/student/authors` - Author-specific support

## User Experience

### Placeholder Hints

Each search bar includes helpful placeholder text:

- Books: "Search books... Try: author: Tolkien year: 2023 subject: Fantasy"
- Shelves: "Search shelves... Try: shelf: A1"
- Authors: "Search authors... Try: author: Tolkien"

### Debounced Search

All search inputs are debounced (300ms) to avoid excessive API calls while typing.

### Clear Button

A clear button (×) appears when there's search text, allowing quick reset.

## Technical Notes

### Case Insensitive

All searches are case-insensitive using MongoDB's `$options: "i"` flag.

### Regex Matching

Field values use regex matching, so partial matches work:
- `author: Tolk` matches "Tolkien"
- `year: 202` matches 2020, 2021, 2022, etc.

### OR Logic

When multiple fields are specified, they're combined with OR logic, meaning books matching ANY of the criteria are returned.

### Free Text Fallback

If no field syntax is detected, the search falls back to searching all relevant fields (title, author, ISBN, publisher).
