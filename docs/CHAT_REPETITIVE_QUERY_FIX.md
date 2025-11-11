# Chat Repetitive Query Fix

## Problema (Problem)

Ang AI chat ay may issue sa repetitive searches at unanswered queries:

1. **Walang duplicate detection** - Same queries ay paulit-ulit na nire-run
2. **Walang context awareness** - Hindi alam ng AI kung nag-fail na yung previous search
3. **Function call duplication** - Minsan nag-reretry ng same failed search
4. **Poor empty result handling** - Walang helpful alternatives kapag walang results

## Solusyon (Solution)

### Frontend Changes (`src/components/chat-interface.jsx`)

#### 1. Query Tracking
```javascript
const [recentQueries, setRecentQueries] = useState([]);
```
- Nag-track ng last 5 queries with timestamps
- Ginagamit para i-detect ang repetitive queries

#### 2. Repetitive Query Detection
```javascript
const isRepetitiveQuery = (newQuery) => {
  // Checks last 3 queries for similarity
  // Uses word matching algorithm (>80% similarity)
  // Returns match if found
}
```

**Detection Logic:**
- Exact match: "books about habits" === "books about habits"
- High similarity: "books about habits" ≈ "books on habits" (80%+ word match)
- Time-based: Only blocks if within 30 seconds

#### 3. Visual Warning
- Shows amber warning banner when typing similar query
- Prevents submission if query is too similar and recent (<30 seconds)
- Toast notification with helpful message

#### 4. User Experience
```javascript
if (repetitiveMatch && secondsAgo < 30) {
  showToast(
    'You asked a similar question X seconds ago. Please check the previous response or try rephrasing.',
    'warning',
    5000
  );
  return; // Prevent submission
}
```

### Backend Changes (`src/app/api/chat/route.js`)

#### 1. Function Call Deduplication
```javascript
const uniqueFunctionCalls = [];
const seenCalls = new Set();

for (const call of functionCalls) {
  const callKey = `${call.name}:${JSON.stringify(call.args)}`;
  if (!seenCalls.has(callKey)) {
    uniqueFunctionCalls.push(call);
  }
}
```
- Prevents duplicate function calls sa same request
- Uses function name + arguments as unique key

#### 2. Empty Result Handling
```javascript
if (functionResult.count === 0) {
  functionResult.suggestion = `No books found for "${args.query}". Consider trying:
- Different keywords or synonyms
- Broader search terms
- Checking available categories
- Browsing related shelves`;
}
```
- Adds helpful suggestions when searches fail
- Guides users to alternative approaches

#### 3. Updated System Instructions
```
HANDLING NO RESULTS:
1. Try ONE alternative search with synonyms
2. If still no results, acknowledge clearly
3. Suggest browsing categories
4. DO NOT repeatedly call searchBooks
5. Provide helpful alternatives
```

## Features

### 1. Smart Query Detection
- ✅ Detects exact matches
- ✅ Detects high similarity (>80% word match)
- ✅ Time-based filtering (30 second window)
- ✅ Ignores file uploads

### 2. Visual Feedback
- ✅ Real-time warning banner while typing
- ✅ Toast notification on submission attempt
- ✅ Clear, helpful messaging

### 3. Backend Protection
- ✅ Deduplicates function calls
- ✅ Adds suggestions for empty results
- ✅ Prevents infinite retry loops
- ✅ Logs all queries for analysis

### 4. User Guidance
- ✅ Suggests alternative search terms
- ✅ Recommends browsing categories
- ✅ Explains why no results found
- ✅ Provides actionable next steps

## Testing

### Test Case 1: Exact Duplicate
```
User: "books about habits"
[Wait for response]
User: "books about habits" (within 30 seconds)
Expected: Warning toast, submission blocked
```

### Test Case 2: Similar Query
```
User: "books about productivity"
[Wait for response]
User: "books on productivity" (within 30 seconds)
Expected: Warning banner + toast, submission blocked
```

### Test Case 3: Time-Based Allow
```
User: "books about habits"
[Wait 31+ seconds]
User: "books about habits"
Expected: Query allowed (different context may be needed)
```

### Test Case 4: Empty Results
```
User: "books about quantum entanglement"
Expected: AI tries search, then suggests alternatives if no results
```

### Test Case 5: Function Deduplication
```
User: "show me fiction books and also fiction books"
Expected: searchBooks called only once, not twice
```

## Benefits

1. **Better UX** - Users get immediate feedback about repetitive queries
2. **Reduced API Calls** - Prevents unnecessary duplicate searches
3. **Clearer Responses** - AI provides helpful alternatives instead of empty responses
4. **Performance** - Less database queries, faster responses
5. **User Guidance** - Helps users refine their searches effectively

## Configuration

### Adjust Similarity Threshold
```javascript
// In isRepetitiveQuery function
const similarity = matchingWords.length / Math.max(newWords.length, oldWords.length);
return similarity > 0.8; // Change 0.8 to adjust sensitivity
```

### Adjust Time Window
```javascript
if (secondsAgo < 30) { // Change 30 to adjust time window
  // Block submission
}
```

### Adjust Query History Size
```javascript
setRecentQueries(prev => [...prev.slice(-4), newQuery]); // Change -4 to track more/less
```

## Future Enhancements

1. **Search Result Caching** - Cache results to show instantly for repeated queries
2. **Query Suggestions** - Suggest related queries based on search history
3. **Smart Rephrasing** - Auto-suggest better search terms
4. **Analytics Dashboard** - Track most common failed searches
5. **Learning System** - Improve detection based on user behavior

## Notes

- Query tracking is session-based (resets on page reload)
- File uploads bypass repetitive query detection
- System works for both English and Tagalog queries
- Case-insensitive matching
- Whitespace normalized
