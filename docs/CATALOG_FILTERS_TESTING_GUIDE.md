# Catalog Filters - Comprehensive Testing Guide
**Created:** November 24, 2025  
**Purpose:** Manual QA testing checklist for catalog filter combinations

---

## 🎯 Testing Objectives

Verify that all filter combinations work correctly together and that the new features (filter persistence and year search) function as expected.

---

## ✅ NEW FEATURES TO TEST

### 1. Filter Persistence (URL Parameters)

**Test Steps:**
1. Apply multiple filters (format, category, year range, availability)
2. Note the URL changes with query parameters
3. Refresh the page (F5 or Ctrl+R)
4. ✅ Verify all filters are still applied
5. Navigate to another page (e.g., My Library)
6. Use browser back button to return
7. ✅ Verify all filters are still applied
8. Copy the URL and open in a new tab/window
9. ✅ Verify filters are applied in the new window

**Expected URL Format:**
```
/student/books?search=harry&sortBy=year&page=1&formats=Physical&categories=Fiction&availability=Available&yearMin=2000&yearMax=2010
```

**Pass Criteria:**
- [ ] Filters persist after page refresh
- [ ] Filters persist after navigation and back
- [ ] URL can be shared and filters work in new window
- [ ] URL only includes non-default values
- [ ] URL updates automatically when filters change

---

### 2. Year Search in Free Text

**Test Queries:**
1. Type "2020" in search bar
   - ✅ Should find books published in 2020
   
2. Type "Harry Potter 2001"
   - ✅ Should find Harry Potter books from 2001
   
3. Type "year: 2015"
   - ✅ Should find books from 2015
   
4. Type "books from 1999"
   - ✅ Should find books from 1999
   
5. Type "2025 technology"
   - ✅ Should find technology books from 2025

**Pass Criteria:**
- [ ] 4-digit years (1900-2099) are detected automatically
- [ ] Explicit "year: YYYY" syntax works
- [ ] Year search works with other search terms
- [ ] Invalid years (e.g., 3000, 1800) are ignored
- [ ] Year search works alongside year range filter

---

### 3. Clear All Filters Button

**Test Steps:**
1. Apply multiple filters
2. Click "Filters" button to open modal
3. Click "Clear All Filters" button
4. ✅ Verify all filters reset to defaults:
   - Resource Types: Books only
   - Year Range: 1950-2025
   - Availability: None selected
   - Formats: None selected
   - Categories: None selected

**Pass Criteria:**
- [ ] All filters reset to default values
- [ ] Page resets to 1
- [ ] Results update immediately
- [ ] URL parameters are cleared

---

## 🔄 COMBINED FILTER TESTING

### Test Case 1: Resource Type Filter
**Steps:**
1. Uncheck "Books"
2. Check "Articles"
3. Click "Apply Filters"

**Expected:**
- [ ] "No books found" message displayed (0 articles in database)
- [ ] URL includes `resourceTypes=Articles`
- [ ] Filter badge shows "1"

**Repeat for:**
- [ ] Journals only - should show "No books found"
- [ ] Theses only - should show "No books found"
- [ ] Books only - should show all books (default)
- [ ] Articles + Books - should show only books (no articles exist)

---

### Test Case 2: Format + Category
**Steps:**
1. Select Format: Physical
2. Select Category: Fiction
3. Click "Apply Filters"

**Expected:**
- [ ] Only physical fiction books shown
- [ ] Count updates correctly
- [ ] URL includes both filters

---

### Test Case 3: Year Range + Availability
**Steps:**
1. Set Year Range: 2010-2020
2. Select Availability: Available
3. Click "Apply Filters"

**Expected:**
- [ ] Only available books from 2010-2020 shown
- [ ] Available books appear first (existing behavior)
- [ ] Count updates correctly

---

### Test Case 4: All Filters + Search
**Steps:**
1. Type "science" in search bar
2. Select Format: eBook
3. Select Category: Science
4. Set Year Range: 2015-2025
5. Select Availability: Available
6. Click "Apply Filters"

**Expected:**
- [ ] Only available science eBooks from 2015-2025 matching "science" shown
- [ ] All filters work together correctly
- [ ] No conflicts or errors
- [ ] Count is accurate

---

### Test Case 5: Filters + Different Sort Options

**For each sort option, apply filters and verify:**

**Sort by Relevance:**
- [ ] Filters applied correctly
- [ ] Available books appear first
- [ ] Results are relevant to search query

**Sort by Title:**
- [ ] Filters applied correctly
- [ ] Available books appear first
- [ ] Then sorted alphabetically by title

**Sort by Year:**
- [ ] Filters applied correctly
- [ ] Available books appear first
- [ ] Then sorted by year (newest first)

**Sort by Author:**
- [ ] Filters applied correctly
- [ ] Available books appear first
- [ ] Then sorted alphabetically by author

---

### Test Case 6: Multiple Categories
**Steps:**
1. Select Categories: Fiction, Science, Technology
2. Click "Apply Filters"

**Expected:**
- [ ] Books from any of the selected categories shown
- [ ] Count includes all matching books
- [ ] Filter badge shows "3" active filters

---

### Test Case 7: Multiple Formats + Multiple Availability
**Steps:**
1. Select Formats: Physical, eBook
2. Select Availability: Available, Reserved
3. Click "Apply Filters"

**Expected:**
- [ ] Books matching any format AND any availability shown
- [ ] Both physical and eBooks included
- [ ] Both available and reserved books included
- [ ] Filter badge shows "4" active filters

---

### Test Case 8: Year Range Edge Cases

**Test 1: Minimum Year Only**
- Set From: 2020, To: 2025
- ✅ Only books from 2020-2025 shown

**Test 2: Maximum Year Only**
- Set From: 1950, To: 2000
- ✅ Only books from 1950-2000 shown

**Test 3: Same Year**
- Set From: 2020, To: 2020
- ✅ Only books from 2020 shown

**Test 4: Invalid Range (From > To)**
- Try to set From: 2020, To: 2010
- ✅ Input validation prevents invalid range

**Pass Criteria:**
- [ ] All edge cases handled correctly
- [ ] No errors or crashes
- [ ] Validation prevents invalid inputs

---

### Test Case 9: Empty Results

**Steps:**
1. Apply very restrictive filters:
   - Format: eBook
   - Category: Theses
   - Year Range: 2024-2025
   - Availability: Available
2. Click "Apply Filters"

**Expected:**
- [ ] "No books found" message displayed (NOT all books)
- [ ] Suggestion to adjust filters shown
- [ ] No errors in console
- [ ] Filters remain applied
- [ ] Can clear filters to see results again
- [ ] URL parameters reflect applied filters

**Bug Fix Verification:**
- [ ] Verify default year range (1950-2025) doesn't filter results
- [ ] Verify empty results show proper message, not all books
- [ ] Verify year filter only applied when user changes it

---

### Test Case 10: Filter Badge Count

**Steps:**
1. Apply no filters
   - ✅ No badge shown
   
2. Apply 1 filter (e.g., Format: Physical)
   - ✅ Badge shows "1"
   
3. Apply 3 filters (Format: Physical, Category: Fiction, Availability: Available)
   - ✅ Badge shows "3"
   
4. Clear all filters
   - ✅ Badge disappears

**Pass Criteria:**
- [ ] Badge count is accurate
- [ ] Badge only counts non-default filters
- [ ] Badge updates immediately

---

### Test Case 11: Search + Year Filter Conflict

**Steps:**
1. Type "2020" in search bar (searches for year 2020)
2. Set Year Range: 2015-2019 (excludes 2020)
3. Click "Apply Filters"

**Expected:**
- [ ] Year range filter takes precedence
- [ ] No books from 2020 shown (even though search includes "2020")
- [ ] Or: No results shown (conflict between search and filter)
- [ ] No errors or crashes

---

## 🐛 EDGE CASES & ERROR SCENARIOS

### Edge Case 1: Special Characters in Search
**Test:**
- Search: "O'Brien"
- Search: "C++ Programming"
- Search: "Science & Technology"

**Expected:**
- [ ] Special characters handled correctly
- [ ] No regex errors
- [ ] Results match expected books

---

### Edge Case 2: Very Long Search Query
**Test:**
- Type 200+ character search query

**Expected:**
- [ ] Query handled gracefully
- [ ] No performance issues
- [ ] Results or "no results" shown correctly

---

### Edge Case 3: Rapid Filter Changes
**Test:**
1. Quickly toggle multiple filters on/off
2. Rapidly change sort options
3. Quickly type and delete search text

**Expected:**
- [ ] No race conditions
- [ ] Final state is correct
- [ ] No duplicate API calls
- [ ] No errors in console

---

### Edge Case 4: Browser Back/Forward with Filters
**Test:**
1. Apply filters (URL: /student/books?formats=Physical)
2. Change filters (URL: /student/books?formats=eBook)
3. Click browser back button
4. Click browser forward button

**Expected:**
- [ ] Filters update correctly with back/forward
- [ ] Results update to match URL
- [ ] No errors or inconsistencies

---

## 📊 PERFORMANCE TESTING

### Performance Test 1: Large Result Set
**Test:**
- Clear all filters to show all books
- Measure page load time

**Expected:**
- [ ] Page loads in < 2 seconds
- [ ] Pagination works smoothly
- [ ] No lag when scrolling

---

### Performance Test 2: Complex Filter Combination
**Test:**
- Apply all filters simultaneously
- Measure filter application time

**Expected:**
- [ ] Filters apply in < 1 second
- [ ] No UI freezing
- [ ] Smooth transition to results

---

## ✅ FINAL CHECKLIST

### Functionality
- [ ] All individual filters work correctly
- [ ] All filter combinations work correctly
- [ ] Filter persistence works (URL parameters)
- [ ] Year search in free text works
- [ ] Clear all filters button works
- [ ] Filter badge count is accurate
- [ ] Sort options work with filters
- [ ] Pagination works with filters
- [ ] Search works with filters

### User Experience
- [ ] Filter modal is easy to use
- [ ] Filter changes are intuitive
- [ ] Loading states are clear
- [ ] Error messages are helpful
- [ ] Empty states are informative
- [ ] URLs are shareable

### Technical
- [ ] No console errors
- [ ] No console warnings
- [ ] No memory leaks
- [ ] No race conditions
- [ ] API calls are optimized
- [ ] URL updates correctly
- [ ] Browser back/forward works

### Edge Cases
- [ ] Special characters handled
- [ ] Empty results handled
- [ ] Invalid inputs prevented
- [ ] Rapid changes handled
- [ ] Large datasets handled

---

## 🎯 TESTING SUMMARY

**Total Test Cases:** 11 major + 4 edge cases + 2 performance  
**Estimated Testing Time:** 45-60 minutes  
**Priority:** High - Required before production deployment

**Sign-off:**
- [ ] All test cases passed
- [ ] All edge cases handled
- [ ] Performance is acceptable
- [ ] Ready for production

**Tested By:** _______________  
**Date:** _______________  
**Notes:** _______________

