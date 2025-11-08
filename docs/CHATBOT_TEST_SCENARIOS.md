# Chatbot Enhanced Awareness - Test Scenarios

## Test Scenarios for Enhanced Book Filtering

### Scenario 1: Topic-Based Discovery
**User Query:** "I'm looking for books about artificial intelligence"

**Expected Behavior:**
1. AI calls `searchBooks("artificial intelligence")`
2. Search matches books with "artificial intelligence" in:
   - Title
   - Author name
   - Description content
   - Category
3. AI returns results with:
   - Book titles and authors
   - Brief description excerpts
   - Page count and format
   - Availability status
4. AI offers to provide more details or borrow links

**Success Criteria:**
- ✅ Finds books with AI in descriptions, not just titles
- ✅ Provides context from descriptions
- ✅ Mentions relevant details (pages, format)
- ✅ Shows availability status

---

### Scenario 2: Content-Specific Search
**User Query:** "Do you have beginner programming books?"

**Expected Behavior:**
1. AI calls `searchBooks("beginner programming")`
2. Search finds books with both terms in descriptions
3. AI filters/prioritizes books marked as beginner-level
4. Returns books with:
   - Clear indication of difficulty level
   - Page count (shorter = more beginner-friendly)
   - Description highlighting beginner content
5. AI suggests specific books based on description content

**Success Criteria:**
- ✅ Finds books with "beginner" in descriptions
- ✅ Prioritizes relevant results
- ✅ Explains why books are suitable for beginners
- ✅ Mentions page count as indicator of depth

---

### Scenario 3: Multi-Criteria Filtering
**User Query:** "Show me short books about history, under 300 pages"

**Expected Behavior:**
1. AI calls `searchBooks("history")`
2. AI mentally filters results by page count
3. Returns only books with pages < 300
4. Provides:
   - Book title, author, page count
   - Brief description
   - Availability status
4. AI explains these are shorter, more accessible history books

**Success Criteria:**
- ✅ Searches history category/descriptions
- ✅ Filters by page count
- ✅ Mentions page count in response
- ✅ Provides context about book length

---

### Scenario 4: Language-Specific Search
**User Query:** "Do you have any Spanish language books?"

**Expected Behavior:**
1. AI calls `searchBooks("Spanish")` or filters by language field
2. Returns books where language = "Spanish"
3. Shows:
   - Book titles (in Spanish)
   - Authors
   - Categories available
   - Descriptions
4. AI mentions the language explicitly

**Success Criteria:**
- ✅ Finds books in Spanish language
- ✅ Shows language field in results
- ✅ Provides descriptions (if available)
- ✅ Indicates availability

---

### Scenario 5: Format-Based Discovery
**User Query:** "What eBooks do you have about programming?"

**Expected Behavior:**
1. AI calls `searchBooks("programming")`
2. AI filters results where format = "eBook"
3. Returns digital books only
4. Explains:
   - eBooks can be borrowed instantly
   - No physical pickup required
   - Different loan policies may apply
5. Provides borrow links

**Success Criteria:**
- ✅ Filters by format = "eBook"
- ✅ Explains eBook benefits
- ✅ Shows only digital books
- ✅ Mentions instant availability

---

### Scenario 6: Theme-Based Search
**User Query:** "I want books about friendship and relationships"

**Expected Behavior:**
1. AI calls `searchBooks("friendship relationships")`
2. Search matches descriptions containing these themes
3. Returns books across categories (Fiction, Self-Help, etc.)
4. Provides:
   - Book summaries highlighting friendship themes
   - Different perspectives (fiction vs non-fiction)
   - Page counts and formats
5. AI suggests books based on description content

**Success Criteria:**
- ✅ Searches descriptions for themes
- ✅ Finds books across multiple categories
- ✅ Explains theme relevance
- ✅ Provides diverse options

---

### Scenario 7: Loan Policy Awareness
**User Query:** "Can I borrow this reference book?"

**Expected Behavior:**
1. AI calls `getBookDetails(bookId)`
2. Checks loanPolicy field
3. If loanPolicy = "reference-only":
   - Explains book cannot be borrowed
   - Notes it's for library use only
   - Suggests viewing in library
4. If loanPolicy = "short-loan":
   - Explains limited borrowing period
   - Notes 2-3 day restriction
5. Provides alternative suggestions if needed

**Success Criteria:**
- ✅ Checks loan policy field
- ✅ Explains restrictions clearly
- ✅ Provides alternatives
- ✅ Accurate policy information

---

### Scenario 8: Category Browsing with Details
**User Query:** "Show me science books"

**Expected Behavior:**
1. AI calls `getAvailableShelves()`
2. Identifies Science shelves (B1, B2, B3)
3. Calls `getBooksByCategory("B1")` (and possibly B2, B3)
4. Returns books with:
   - Full descriptions
   - Page counts
   - Languages
   - Formats
5. AI provides context about science topics covered

**Success Criteria:**
- ✅ Gets correct shelf codes
- ✅ Returns comprehensive book info
- ✅ Includes descriptions
- ✅ Mentions variety of science topics

---

### Scenario 9: Complex Query
**User Query:** "I need an available English fiction book under 200 pages"

**Expected Behavior:**
1. AI calls `getAvailableShelves()` to find Fiction shelves
2. Calls `getBooksByCategory("A1")` (Fiction shelf)
3. Filters results:
   - status = "available"
   - language = "English"
   - pages < 200
4. Returns matching books with descriptions
5. AI explains these are quick reads

**Success Criteria:**
- ✅ Applies multiple filters
- ✅ Shows only available books
- ✅ Filters by language and length
- ✅ Provides relevant context

---

### Scenario 10: Description-Based Recommendation
**User Query:** "I'm interested in books about overcoming challenges"

**Expected Behavior:**
1. AI calls `searchBooks("overcoming challenges")`
2. Search matches descriptions with these themes
3. Returns books from various categories:
   - Biography (real-life stories)
   - Self-Help (practical advice)
   - Fiction (inspirational stories)
4. AI explains how each book relates to the theme
5. Provides diverse options

**Success Criteria:**
- ✅ Searches descriptions for themes
- ✅ Finds books across categories
- ✅ Explains relevance of each book
- ✅ Provides variety

---

## Testing Checklist

### Basic Functionality
- [ ] Topic search works (searches descriptions)
- [ ] Category search works (searches category field)
- [ ] All new fields are returned (category, format, description, language, pages, loanPolicy)
- [ ] Search results include descriptions
- [ ] AI uses descriptions in responses

### Filtering Capabilities
- [ ] Can filter by page count
- [ ] Can filter by language
- [ ] Can filter by format (eBook vs physical)
- [ ] Can filter by availability status
- [ ] Can filter by loan policy

### AI Awareness
- [ ] AI mentions page count when relevant
- [ ] AI explains loan policies correctly
- [ ] AI uses descriptions to provide context
- [ ] AI suggests books based on content
- [ ] AI handles multi-criteria queries

### Edge Cases
- [ ] Books without descriptions (graceful handling)
- [ ] Books without page count (doesn't break)
- [ ] Books without language field (defaults appropriately)
- [ ] Empty search results (helpful response)
- [ ] Multiple matching books (prioritizes well)

### User Experience
- [ ] Responses are natural and helpful
- [ ] Descriptions are summarized appropriately
- [ ] Relevant details are highlighted
- [ ] Borrow links work correctly
- [ ] Follow-up questions work smoothly

---

## Sample Test Queries

Copy these into the chatbot to test:

```
1. "Find books about machine learning"
2. "Do you have beginner Python books?"
3. "Show me short history books under 250 pages"
4. "What Spanish books do you have?"
5. "I want eBooks about web development"
6. "Books about friendship"
7. "Can I borrow reference books?"
8. "Show me science fiction books"
9. "I need an available English book under 200 pages"
10. "Books about overcoming adversity"
11. "What programming books are available?"
12. "Short books in Spanish about culture"
13. "eBooks about artificial intelligence"
14. "Fiction books with less than 300 pages"
15. "Books about climate change"
```

---

## Expected Improvements

### Before Enhancement
- Limited to exact title/author matches
- No content-based discovery
- No filtering by book characteristics
- Generic responses without context

### After Enhancement
- Topic and theme-based discovery
- Content-aware search through descriptions
- Intelligent filtering by length, language, format
- Contextual responses with relevant details
- Better recommendations based on book content

---

## Success Metrics

Track these metrics to measure improvement:
1. **Search Success Rate**: % of queries that find relevant books
2. **User Satisfaction**: Feedback on result relevance
3. **Borrow Rate**: % of searches leading to borrows
4. **Query Complexity**: Ability to handle multi-criteria queries
5. **Response Quality**: Contextual and helpful responses

---

**Testing Status:** Ready for QA
**Priority:** High - Core functionality improvement
**Estimated Test Time:** 30-45 minutes for comprehensive testing
