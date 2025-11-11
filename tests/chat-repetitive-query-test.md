# Chat Repetitive Query Fix - Test Plan

## Test Status: ✅ READY FOR TESTING

## Implementation Verified

### Frontend (chat-interface.jsx)
- ✅ `recentQueries` state added
- ✅ `isRepetitiveQuery()` function implemented
- ✅ Query tracking in `handleSubmit()`
- ✅ Visual warning banner added
- ✅ Toast notification on duplicate submission
- ✅ 30-second time window check

### Backend (api/chat/route.js)
- ✅ Function call deduplication with `uniqueFunctionCalls`
- ✅ Empty result suggestions added
- ✅ Updated system instructions for better handling
- ✅ Logging for duplicate function calls

## Manual Testing Steps

### Test 1: Exact Duplicate Query (CRITICAL)
**Steps:**
1. Open chat interface
2. Type: "books about habits"
3. Submit and wait for response
4. Immediately type: "books about habits" again (within 30 seconds)

**Expected Result:**
- ⚠️ Amber warning banner appears while typing
- 🚫 Toast notification: "You asked a similar question X seconds ago..."
- ❌ Query submission is blocked

**Pass Criteria:** Query is blocked, user sees warning

---

### Test 2: Similar Query Detection
**Steps:**
1. Type: "books about productivity"
2. Submit and wait for response
3. Type: "books on productivity" (within 30 seconds)

**Expected Result:**
- ⚠️ Warning banner shows (>80% word similarity)
- 🚫 Toast notification appears
- ❌ Submission blocked

**Pass Criteria:** Similar query detected and blocked

---

### Test 3: Time-Based Allow
**Steps:**
1. Type: "books about habits"
2. Submit and wait for response
3. Wait 31+ seconds
4. Type: "books about habits" again

**Expected Result:**
- ✅ No warning banner
- ✅ Query allowed to submit
- ✅ Normal processing

**Pass Criteria:** Query allowed after time window expires

---

### Test 4: Different Queries (No False Positives)
**Steps:**
1. Type: "books about habits"
2. Submit and wait
3. Type: "books about productivity" (completely different)

**Expected Result:**
- ✅ No warning
- ✅ Query allowed
- ✅ Normal processing

**Pass Criteria:** Different queries not flagged as duplicates

---

### Test 5: Empty Search Results
**Steps:**
1. Type: "books about quantum entanglement theory"
2. Submit

**Expected Result:**
- 🔍 AI calls `searchBooks("quantum entanglement")`
- 📊 Returns 0 results
- 💡 AI provides helpful suggestions:
  - Try different keywords
  - Browse related categories
  - Check available shelves
- ❌ AI does NOT repeatedly call searchBooks

**Pass Criteria:** Helpful response with alternatives, no repeated searches

---

### Test 6: Backend Function Deduplication
**Steps:**
1. Check browser console/network tab
2. Type: "show me fiction books and also show fiction books"
3. Submit and monitor API calls

**Expected Result:**
- 🔍 Only ONE `searchBooks` call in backend logs
- 📝 Console shows: "Skipping duplicate function call: searchBooks:..."
- ✅ Response includes results only once

**Pass Criteria:** Duplicate function calls prevented

---

### Test 7: Visual Warning While Typing
**Steps:**
1. Type: "books about habits"
2. Submit and wait
3. Start typing: "books about habits" again (don't submit yet)

**Expected Result:**
- ⚠️ Amber warning banner appears in real-time
- 📝 Message: "This looks similar to a recent question..."
- 🎨 Banner has amber background with warning icon

**Pass Criteria:** Warning appears before submission

---

### Test 8: File Upload Bypass
**Steps:**
1. Type: "books about habits"
2. Submit and wait
3. Attach a file (any image/PDF)
4. Type: "books about habits" again

**Expected Result:**
- ✅ No warning (file uploads bypass detection)
- ✅ Query allowed
- ✅ Normal processing

**Pass Criteria:** File uploads not affected by duplicate detection

---

### Test 9: Case Insensitive Detection
**Steps:**
1. Type: "Books About Habits"
2. Submit and wait
3. Type: "books about habits" (lowercase)

**Expected Result:**
- ⚠️ Warning appears (case-insensitive match)
- 🚫 Submission blocked

**Pass Criteria:** Case variations detected as duplicates

---

### Test 10: Partial Match (High Similarity)
**Steps:**
1. Type: "show me books about building good habits"
2. Submit and wait
3. Type: "books about building habits" (within 30 seconds)

**Expected Result:**
- ⚠️ Warning appears (>80% word match)
- 🚫 Submission blocked

**Pass Criteria:** High similarity detected

---

## Browser Console Checks

### Frontend Logs to Verify:
```javascript
// Should see in console:
"Skipping duplicate function call: searchBooks:..."
"Function calls detected: [...]"
```

### Backend Logs to Verify:
```
Calling function: searchBooks with args: { query: "..." }
Skipping duplicate function call: searchBooks:{"query":"..."}
```

## Performance Checks

### Memory Usage:
- ✅ `recentQueries` limited to last 5 queries
- ✅ Old queries automatically removed
- ✅ No memory leaks

### API Efficiency:
- ✅ Duplicate function calls prevented
- ✅ Fewer database queries
- ✅ Faster response times

## Edge Cases to Test

### Edge Case 1: Rapid Submissions
**Test:** Submit same query 5 times rapidly
**Expected:** Only first one processes, others blocked

### Edge Case 2: Very Long Queries
**Test:** Submit 200+ character query twice
**Expected:** Detection still works

### Edge Case 3: Special Characters
**Test:** "books about AI/ML" vs "books about AI ML"
**Expected:** Detected as similar

### Edge Case 4: Empty Input
**Test:** Submit empty string twice
**Expected:** Both blocked (empty input validation)

## Success Criteria

### Must Pass (Critical):
- ✅ Test 1: Exact duplicates blocked
- ✅ Test 2: Similar queries detected
- ✅ Test 5: Empty results handled well
- ✅ Test 6: Backend deduplication works

### Should Pass (Important):
- ✅ Test 3: Time window works
- ✅ Test 4: No false positives
- ✅ Test 7: Real-time warning
- ✅ Test 9: Case insensitive

### Nice to Have:
- ✅ Test 8: File upload bypass
- ✅ Test 10: Partial matches
- ✅ All edge cases

## Known Limitations

1. **Session-based tracking** - Resets on page reload
2. **30-second window** - Configurable but fixed per session
3. **Word-based matching** - May miss semantic duplicates
4. **No cross-user detection** - Only tracks current user's queries

## Future Improvements

1. **Persistent tracking** - Store in localStorage/database
2. **Semantic matching** - Use embeddings for better detection
3. **Smart suggestions** - Auto-suggest rephrased queries
4. **Analytics** - Track most common duplicate patterns
5. **Configurable thresholds** - User preferences for sensitivity

## Rollback Plan

If issues occur:
1. Remove `isRepetitiveQuery` check from `handleSubmit`
2. Remove warning banner from UI
3. Keep backend deduplication (safe to keep)
4. Revert to previous version if needed

## Sign-off

- [ ] All critical tests passed
- [ ] No console errors
- [ ] Performance acceptable
- [ ] User experience improved
- [ ] Documentation complete

**Tested by:** _________________
**Date:** _________________
**Status:** _________________
