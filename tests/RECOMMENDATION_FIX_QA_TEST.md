# QA Test: Recommendation Engine Fix

## Issue Fixed
Recommendations were disappearing after users interacted with books in specific categories.

## Quick Test (5 minutes)

### Test 1: New User
1. Create a new student account
2. Navigate to Books page
3. **Expected**: See 10 recommendations (popular books)
4. **Pass Criteria**: Recommendations are visible and not empty

### Test 2: After Interactions
1. Using the same account, view 3-5 books from one category (e.g., Science Fiction)
2. Navigate away and back to Books page
3. **Expected**: See 10 recommendations (now personalized)
4. **Pass Criteria**: 
   - Recommendations still visible (NOT EMPTY)
   - Some recommendations match the category you viewed
   - Match reasons mention the category or "Popular with students"

### Test 3: Edge Case - Niche Category
1. View 3-5 books from a category with few books (e.g., Philosophy)
2. Check recommendations
3. **Expected**: Mix of matching books + popular books
4. **Pass Criteria**: Recommendations are NOT EMPTY

## Detailed Test Cases

### Test Case 1: Empty Catalog Check
**Purpose**: Verify system handles empty catalog gracefully

**Steps**:
1. Check if there are available books in admin panel
2. If no books, recommendations should be empty (expected)
3. If books exist, recommendations should never be empty

**Pass Criteria**:
- ✅ If books exist → recommendations appear
- ✅ If no books → empty state with message

### Test Case 2: Popular Books Fallback
**Purpose**: Verify new users get popular books

**Steps**:
1. Create new user account
2. Don't interact with any books
3. Check recommendations

**Expected Results**:
- 10 recommendations appear
- All have relevance score = 50
- Match reasons: "Most popular", "Trending now", "Recently published"
- Books sorted by popularity score

**Pass Criteria**:
- ✅ Recommendations visible
- ✅ Generic match reasons (not personalized)

### Test Case 3: Personalized Recommendations
**Purpose**: Verify personalization works after interactions

**Steps**:
1. Log in as existing user
2. View 5 Science Fiction books
3. Wait 10 seconds (for interactions to process)
4. Check recommendations

**Expected Results**:
- 6-8 Science Fiction books in recommendations
- Relevance scores: 60-90 for matching books
- Match reasons: "You like Science Fiction", "Similar to [tag]"
- Some diversity (2-4 non-SciFi books)

**Pass Criteria**:
- ✅ Recommendations visible
- ✅ Personalized match reasons
- ✅ Higher relevance scores for matches

### Test Case 4: Category With Few Books
**Purpose**: Verify fallback when category has limited books

**Steps**:
1. Find a category with only 2-3 books
2. View all books in that category
3. Check recommendations

**Expected Results**:
- Recommendations still appear (NOT EMPTY)
- Mix of related books + popular books
- Some match reasons mention the category
- Some match reasons are generic ("Popular with students")

**Pass Criteria**:
- ✅ Recommendations NOT EMPTY
- ✅ Graceful fallback to popular books

### Test Case 5: User With Large Personal Library
**Purpose**: Verify exclusions don't break recommendations

**Steps**:
1. User with 20+ books in personal library
2. Check recommendations

**Expected Results**:
- Recommendations appear (NOT EMPTY)
- No books from personal library appear
- May have more popular books if many matches are excluded

**Pass Criteria**:
- ✅ Recommendations visible
- ✅ No owned books in recommendations

### Test Case 6: All Matching Books Borrowed
**Purpose**: Verify fallback when user borrowed all matching books

**Steps**:
1. User who borrowed all Science Fiction books
2. User's profile shows Science Fiction as top category
3. Check recommendations

**Expected Results**:
- Recommendations appear (NOT EMPTY)
- Falls back to popular books or related categories
- No currently borrowed books appear

**Pass Criteria**:
- ✅ Recommendations NOT EMPTY
- ✅ No borrowed books in recommendations

## Diagnostic Tools

### Check User's Recommendations
```bash
node scripts/diagnose-recommendations.js <user-email>
```

This shows:
- User's interaction history
- Top categories/authors
- Available books matching user's interests
- Why recommendations might be empty

### Verify Test Data
```bash
node scripts/check-test-data.js
```

Shows test users and their data.

### Test The Fix
```bash
node scripts/test-recommendation-fix.js
```

Automated test that verifies the fix works.

## Common Issues & Solutions

### Issue: Recommendations are empty
**Check**:
1. Are there available books in the catalog?
   - Admin → Books → Filter by "Available"
2. Run diagnostic: `node scripts/diagnose-recommendations.js <email>`
3. Check browser console for API errors

**Solution**:
- If no books: Add books to catalog
- If API error: Check server logs
- If query issue: Run diagnostic script

### Issue: All recommendations are generic (score = 50)
**Check**:
1. Does user have interactions?
   - Check user_interactions collection
2. Do books have categories/tags?
   - Check book data in admin panel

**Solution**:
- If no interactions: Expected behavior for new users
- If no categories: Add categories to books
- If old interactions: Check timestamp (must be within 90 days)

### Issue: Same books appear for all users
**Check**:
1. Are books properly categorized?
2. Do users have different interaction histories?

**Solution**:
- Add more books with diverse categories
- Ensure interactions are being tracked

## Success Criteria

### Must Pass
- ✅ New users see recommendations (popular books)
- ✅ Users with interactions see recommendations (personalized)
- ✅ Recommendations are NEVER empty (if books exist)
- ✅ No JavaScript errors in console
- ✅ API responds within 2 seconds

### Should Pass
- ✅ Personalized recommendations match user's interests
- ✅ Relevance scores are appropriate (60-90 for good matches)
- ✅ Match reasons are specific and accurate
- ✅ Some diversity in recommendations (not all one category)

### Nice to Have
- ✅ Recommendations update after new interactions
- ✅ Collaborative filtering suggests good books
- ✅ Popular books are actually popular

## Regression Testing

Test these existing features still work:

1. **Similar Books** (on book detail page)
   - Click on a book
   - Check "Similar Books" section
   - Should show related books

2. **Recommendations Sidebar**
   - Visible on multiple pages
   - Shows 5-10 recommendations
   - Updates based on context

3. **Book Filtering**
   - Filter by category
   - Filter by author
   - Search functionality

## Performance Testing

1. **Response Time**
   - Recommendations API should respond in <2 seconds
   - Check Network tab in browser DevTools

2. **Database Load**
   - Monitor MongoDB queries
   - Should not cause excessive load

## Sign-Off Checklist

- [ ] Test Case 1: New user gets recommendations
- [ ] Test Case 2: Recommendations persist after interactions
- [ ] Test Case 3: Personalization works correctly
- [ ] Test Case 4: Fallback works for niche categories
- [ ] Test Case 5: Exclusions work properly
- [ ] Test Case 6: Fallback works when all matches borrowed
- [ ] No JavaScript errors in console
- [ ] API response time < 2 seconds
- [ ] Diagnostic tools work correctly
- [ ] Documentation is clear and accurate

## Reporting Issues

If you find issues, provide:
1. User email
2. Steps to reproduce
3. Expected vs actual behavior
4. Screenshot of recommendations (or empty state)
5. Browser console errors (if any)
6. Output of diagnostic script

## Contact

For questions about this fix:
- See: `docs/RECOMMENDATION_ENGINE_FIX.md`
- Run: `node scripts/diagnose-recommendations.js <email>`
