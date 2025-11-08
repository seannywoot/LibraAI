# Chat Title Generation Fix Summary

## Problem

Chat titles were only generating as "Conversation" for all conversations, making it impossible to distinguish between different chats in the history.

## Root Causes Identified

1. **Poor heuristic fallback**: The fallback used frequency-based keyword ranking which produced unnatural titles like "Any Bake Bread Feeding Home Sourdough"
2. **Weak API prompt**: Generic prompt didn't emphasize avoiding generic words
3. **Broken drift detection**: Baseline included the message being tested, causing high similarity scores
4. **Insufficient logging**: No visibility into what was failing

## Fixes Applied

### 1. Improved Heuristic Title Generation (`src/utils/chatTitle.js`)

**Before**: Ranked keywords by frequency, then alphabetically
```javascript
// Produced: "Any Bake Bread Feeding Home Sourdough"
```

**After**: Uses keywords in order of appearance from first user message
```javascript
// Produces: "Bake Sourdough Bread Home"
```

This preserves natural language flow and creates more readable titles.

### 2. Enhanced API Prompt (`src/app/api/chat/title/route.js`)

**Changes**:
- Switched from `gemini-2.5-flash` to `gemini-2.0-flash-exp`
- Reduced temperature from 0.4 to 0.3 for consistency
- Added explicit examples of good vs bad titles
- Emphasized avoiding generic words (help, question, chat)
- Increased max tokens from 16 to 20

### 3. Fixed Drift Detection (`src/utils/chatTitle.js`)

**Before**: Baseline included first 3 messages (including the one being tested)
```javascript
const firstFew = userMessages.slice(0, 3); // WRONG
```

**After**: Baseline uses only first 2 messages
```javascript
const firstTwo = userMessages.slice(0, 2); // CORRECT
```

**Additional improvements**:
- More conservative thresholds (0.15 instead of 0.2 for very low similarity)
- Explicit topic shift phrase detection
- Requires at least 8 tokens in recent message
- Better handling of edge cases

### 4. Better Normalization (`src/utils/chatTitle.js`)

Now removes:
- Common prefixes: "Title:", "Topic:", "Chat:", "Conversation:"
- Quotes and trailing punctuation
- Handles short titles more gracefully

### 5. Added Logging (`src/components/chat-interface.jsx`)

Console logs now show:
- When title generation is triggered
- API responses and errors
- Fallback heuristic results
- Current title and message count

## Test Results

### Heuristic Titles (Improved)
- Sourdough: "Bake Sourdough Bread Home" ✓
- Python: "Debug Python Code List Comprehension" ✓
- Travel: "Plan Day Trip Tokyo Japan" ✓
- Books: "Recommend Science Fiction Books Similar Dune" ✓

### Drift Detection (Fixed)
- Same topic: false ✓ (no regeneration)
- Explicit shift: true ✓ (regenerates)
- Subtle shift: false ✓ (no regeneration)

### Normalization (Enhanced)
- Removes quotes: "Python Code Debugging" → "Python Code Debugging" ✓
- Removes prefixes: "Title: Sourdough Bread Recipe" → "Sourdough Bread Recipe" ✓
- Handles long titles: Truncates to 6 words ✓

## Files Modified

1. `src/utils/chatTitle.js` - Core logic improvements
2. `src/app/api/chat/title/route.js` - Better API prompt
3. `src/components/chat-interface.jsx` - Enhanced logging
4. `docs/CHAT_TITLE_GENERATION.md` - Updated documentation

## Files Created

1. `scripts/test-title-improvements.mjs` - Comprehensive test suite
2. `scripts/debug-drift.mjs` - Drift detection debugging
3. `scripts/test-title-api.mjs` - API endpoint testing

## How to Verify

1. Start a new chat conversation
2. Send at least 2 messages
3. Check browser console for "Generated title from API:" or "Heuristic title:"
4. Verify title appears in chat header and history sidebar
5. Test topic drift by explicitly changing topics

## Next Steps

If titles are still showing as "Conversation":
1. Check browser console for errors
2. Verify GEMINI_API_KEY is set in `.env.local`
3. Run `node scripts/test-title-api.mjs` to test API directly
4. Check network tab for `/api/chat/title` requests

The fallback heuristic should now produce good titles even if the API fails.
