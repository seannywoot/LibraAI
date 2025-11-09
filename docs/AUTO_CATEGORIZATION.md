# Automatic Book Categorization

## Overview

All newly added or updated books now automatically get **categories** and **tags** for the recommendation system. This ensures recommendations work properly for all books without manual categorization.

## How It Works

When an admin adds or updates a book, the system:
1. ✅ Analyzes the book's title, author, and category
2. ✅ Matches keywords to predefined categories
3. ✅ Assigns relevant tags
4. ✅ Saves both `categories` (array) and `tags` (array) to the book

## Category Mappings

The system recognizes these categories:

| Category | Keywords |
|----------|----------|
| **Computer Science** | programming, code, software, algorithm, data structure, computer, javascript, python, java, web, design patterns |
| **Business** | business, management, leadership, entrepreneur, marketing, finance, economics, startup |
| **Self-Help** | habits, atomic, mindset, success, productivity, motivation, self-help, personal development |
| **Fiction** | novel, story, fiction, tale, mockingbird, gatsby, potter, hunger games |
| **Science** | science, physics, chemistry, biology, universe, cosmos |
| **Mathematics** | math, calculus, algebra, geometry, statistics |
| **History** | history, historical, war, ancient, civilization |
| **Philosophy** | philosophy, ethics, logic, thinking, mind |
| **Psychology** | psychology, mental, behavior, cognitive, brain |
| **Education** | education, teaching, learning, pedagogy, school |

## Tag Mappings

The system assigns these tags:

| Tag | Keywords |
|-----|----------|
| **Programming** | programming, code, coding, software, developer |
| **Algorithms** | algorithm, data structure, complexity |
| **Web Development** | web, javascript, html, css, react, node |
| **Software Engineering** | software engineering, design patterns, architecture, refactoring |
| **Leadership** | leadership, management, team, leader |
| **Productivity** | productivity, habits, efficiency, time management |
| **Success** | success, achievement, goals, mindset |
| **Fiction** | fiction, novel, story |
| **Non-Fiction** | non-fiction, biography, memoir |
| **Science** | science, scientific, research |
| **Business Strategy** | strategy, business, competitive |

## Examples

### Example 1: Programming Book
```
Input:
  Title: "Clean Code"
  Author: "Robert Martin"
  Category: "Technology"

Output:
  categories: ["Computer Science"]
  tags: ["Programming", "Software Engineering"]
```

### Example 2: Business Book
```
Input:
  Title: "The Lean Startup"
  Author: "Eric Ries"
  Category: "Business"

Output:
  categories: ["Business", "Self-Help"]
  tags: ["Success", "Business Strategy"]
```

### Example 3: Fiction Book
```
Input:
  Title: "Harry Potter and the Sorcerer's Stone"
  Author: "J.K. Rowling"
  Category: "Fiction"

Output:
  categories: ["Fiction"]
  tags: ["Fiction"]
```

### Example 4: Self-Help Book
```
Input:
  Title: "Atomic Habits"
  Author: "James Clear"
  Category: "Self-Help"

Output:
  categories: ["Self-Help"]
  tags: ["Productivity"]
```

## Fallback Behavior

If no keywords match:
- ✅ Uses the admin-provided `category` field
- ✅ Falls back to "General" category
- ✅ Falls back to "General Interest" tag

## Where It's Applied

### 1. Book Creation
**File**: `src/app/api/admin/books/create/route.js`
**When**: Admin adds a new book
**Result**: Book is created with categories and tags

### 2. Book Update
**File**: `src/app/api/admin/books/[id]/route.js`
**When**: Admin edits an existing book
**Result**: Categories and tags are regenerated

## Benefits

### For Admins
- ✅ No manual categorization needed
- ✅ Consistent categorization across all books
- ✅ Saves time when adding books

### For Students
- ✅ Better recommendations immediately
- ✅ More accurate personalization
- ✅ Diverse recommendations

### For the System
- ✅ All books have metadata for recommendations
- ✅ No missing categories/tags
- ✅ Recommendations work for all users

## Testing

### Test New Book Creation
1. Go to admin panel
2. Add a new book (e.g., "Introduction to Algorithms")
3. Check database: Book should have `categories` and `tags`

### Test Book Update
1. Edit an existing book
2. Change the title or category
3. Check database: Categories and tags should update

### Verify in Database
```javascript
// Check a book's categories and tags
db.books.findOne({ title: "Clean Code" })

// Should show:
{
  title: "Clean Code",
  author: "Robert Martin",
  category: "Technology",
  categories: ["Computer Science"],
  tags: ["Programming", "Software Engineering"],
  ...
}
```

## Customization

To add more categories or keywords, edit the mappings in:
- `src/app/api/admin/books/create/route.js`
- `src/app/api/admin/books/[id]/route.js`

Example:
```javascript
const categoryMappings = {
  "Computer Science": [...existing keywords],
  "Art": ["art", "painting", "sculpture", "design"], // Add new category
  ...
};
```

## Migration

### For Existing Books
Run the categorization script:
```bash
node scripts/add-categories-tags.js
```

This will:
- ✅ Add categories/tags to all existing books
- ✅ Skip books that already have them
- ✅ Show summary of changes

### For Future Books
- ✅ Automatic - no action needed
- ✅ Categories/tags added on creation
- ✅ Updated when book is edited

## Troubleshooting

### Book has wrong categories?
1. Edit the book in admin panel
2. Update the title or category field
3. Save - categories will regenerate

### Want to add custom categories?
1. Edit the `autoCategorizeBook` function
2. Add your keywords to the mappings
3. Restart the server

### Need to recategorize all books?
```bash
node scripts/add-categories-tags.js
```

## Future Enhancements

### Planned Features
1. **AI-based categorization** - Use OpenAI to categorize books
2. **Manual override** - Allow admins to manually set categories
3. **Category suggestions** - Show suggested categories in admin UI
4. **Multi-language support** - Categorize books in different languages
5. **Learning system** - Improve categorization based on user feedback

---

**Status**: Implemented ✅
**Version**: 1.0
**Last Updated**: November 9, 2025
**Automatic**: Yes - works for all new/updated books
