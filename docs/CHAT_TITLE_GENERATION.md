## Chat Title Generation

This document explains the improved automatic chat title logic.

### Goals

- Provide distinctive, scannable titles for each conversation
- 3–6 word noun phrase in Title Case with no trailing punctuation
- Update automatically when the conversation topic shifts (drift detection)
- Use natural word order that reflects the actual conversation

### When Titles Are Generated

1. **Initial title**: After at least 2 user messages (≥ 4 total messages including assistant replies)
2. **Drift detection**: On subsequent user messages when topic significantly changes

### How It Works

1. Client gathers focused message context and calls `/api/chat/title` endpoint
2. Endpoint prompts Gemini (`gemini-2.0-flash-exp`) with strict formatting rules
3. Result is normalized (Title Case, 3–6 words, remove quotes/punctuation/prefixes)
4. If API fails, falls back to deterministic heuristic using first user message keywords

### API Title Generation

The API uses an improved prompt that:

- **Enforces grammatical correctness and proper spelling**
- Emphasizes specific nouns and verbs over generic words
- Excludes generic terms like "help", "question", "chat"
- Removes articles (the, a, an) from the start
- Provides clear examples of good vs bad titles (including typo examples)
- Uses lower temperature (0.3) for more consistent results

**Quality Validation**:

- Automatically detects common typos (e.g., "aer" instead of "are")
- Checks for incomplete phrases (trailing prepositions)
- Retries generation if quality issues are detected
- Ensures titles are natural, complete phrases

### Fallback Heuristic (Improved)

When API is unavailable:

1. Extract first user message content
2. Tokenize and remove stopwords
3. Take first 3-6 meaningful keywords **in order of appearance** (preserves natural flow)
4. Remove trailing prepositions to avoid incomplete phrases
5. Apply Title Case formatting

**Example**: "How do I bake sourdough bread at home?" → "Bake Sourdough Bread Home"

**Quality improvements**:

- Removes trailing prepositions (to, for, with, about, from, in, on, at, by)
- Ensures titles are complete phrases, not fragments
- Much better than the old frequency-based approach which produced unnatural titles like "Any Bake Bread Feeding Home Sourdough"

### Drift Detection (Enhanced)

Triggers title regeneration when:

1. **Explicit topic shift**: User says "switching topic", "change topic", etc. AND similarity < 0.4
2. **Very low similarity**: Jaccard similarity < 0.15 AND message > 10 tokens
3. **Complete topic change**: No title words in recent message AND similarity < 0.25 AND message > 10 tokens

**Key improvements**:

- Baseline uses only first 2 user messages (not including the recent one being tested)
- Requires at least 3 user messages before detecting drift
- More conservative thresholds to avoid false positives
- Checks for explicit topic shift phrases

### Normalization Improvements

The `normalizeModelTitle` function now:

- Removes common prefixes: "Title:", "Topic:", "Chat:", "Conversation:"
- Strips quotes and trailing punctuation
- Handles too-short titles by extracting meaningful tokens
- Returns "Conversation" fallback only when truly empty

### Local Storage Persistence

Title is stored in:

- `currentChat` localStorage key (current conversation)
- Each conversation object in `chatHistory` array
- Synced to database via `/api/chat/conversations` endpoint

### Debugging

The chat interface now logs:

- When title generation is triggered
- Whether it's initial generation or drift detection
- API responses and errors
- Fallback heuristic results

Check browser console for: `"Generating title..."`, `"Generated title from API:"`, `"Heuristic title:"`

### Testing

Run test scripts:

```bash
node scripts/test-title-improvements.mjs  # Test all functions
node scripts/debug-drift.mjs              # Debug drift detection
```

### Customization

Adjust behavior in `src/utils/chatTitle.js`:

- `shouldRegenerateTitle`: Drift detection thresholds and phrases
- `heuristicTitle`: Fallback title construction
- `STOPWORDS`: Words to exclude from titles
- `normalizeModelTitle`: Post-processing rules

### Privacy

Only current conversation messages are used. No cross-conversation data is referenced.

### Future Enhancements

- Embedding-based semantic similarity for more robust drift detection
- User-initiated manual rename UI
- Caching model titles to reduce API calls
- Multi-language support for non-English conversations
