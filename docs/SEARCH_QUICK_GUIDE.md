# Advanced Search Quick Guide

## How to Use Advanced Search

### Basic Format

```
field: value
```

### Supported Fields

| Field | Example | Where Available |
|-------|---------|----------------|
| `author:` | `author: J.K. Rowling` | Books, Shelf Books, Authors |
| `title:` | `title: Harry Potter` | Books, Shelf Books |
| `subject:` | `subject: Artificial Intelligence` | Books, Shelf Books |
| `year:` | `year: 2023` | Books, Shelf Books |
| `isbn:` | `isbn: 978-0-7475-3269-9` | Books, Shelf Books |
| `publisher:` | `publisher: Penguin` | Books, Shelf Books |
| `shelf:` | `shelf: A1` | Books, Shelves |

### Examples

#### Single Field Search
```
author: J.K. Rowling
```
Finds all books by J.K. Rowling

#### Multiple Fields
```
author: Tolkien year: 2001
```
Finds books by Tolkien published in 2001

```
title: Harry Potter year: 1997 author: J.K. Rowling
```
Finds Harry Potter books from 1997 by J.K. Rowling

#### Mixed Search (Field + Free Text)
```
fantasy adventure author: Tolkien
```
Searches for "fantasy adventure" AND books by Tolkien

**Note:** Free text should come BEFORE field searches for best results

### Tips

1. **Case doesn't matter** - `author: tolkien` works the same as `author: Tolkien`

2. **Partial matches work** - `author: Tolk` will find "Tolkien"

3. **Spaces in values** - Just type naturally: `author: J.K. Rowling` (no quotes needed)

4. **Multiple fields** - Separate with spaces: `author: Tolkien year: 2001`

5. **Free text first** - Put general search terms before field searches:
   - ✅ `fantasy adventure author: Tolkien`
   - ❌ `author: Tolkien fantasy adventure` (will search for author "Tolkien fantasy adventure")

### Page-Specific Examples

#### Books Catalog
```
author: Tolkien subject: Fantasy
year: 2023
title: Introduction subject: Computer Science
```

#### Shelves
```
shelf: A1
shelf: B
```

#### Authors
```
author: Tolkien
author: J.K.
```

### What Happens Behind the Scenes

The search parser:
1. Extracts field-specific filters (e.g., `author: Tolkien`)
2. Removes those from the search text
3. Treats remaining text as free-form search
4. Combines everything into a database query

This means you get precise results when using field syntax, while still supporting regular search!
