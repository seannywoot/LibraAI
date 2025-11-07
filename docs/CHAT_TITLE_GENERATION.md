## Chat Title Generation

This document explains the improved automatic chat title logic.

### Goals
- Provide distinctive, scannable titles for each conversation.
- 3–6 word noun phrase; Title Case; no trailing punctuation.
- Update automatically when the conversation topic shifts (drift).

### When Titles Are Generated
1. Initial title after at least two user messages (>= 4 total messages including assistant replies).
2. Drift detection on subsequent user messages. If the newest user message differs strongly from the baseline topic (low keyword similarity & no overlap), a new title is requested.

### How It Works
1. Client gathers a focused subset of messages (early + recent context) and calls the `/api/chat/title` endpoint.
2. The endpoint prompts Gemini (`gemini-2.5-flash`) with strict formatting rules to return only a short noun phrase.
3. The result is normalized (Title Case, 3–6 words, remove quotes/punctuation).
4. If the API fails or no key is set, a deterministic heuristic fallback extracts keywords from the first two user messages.

### Drift Detection Heuristic
- Collect keywords from the first two user messages (baseline) and the latest user message.
- Compute Jaccard similarity. If `< 0.2` and the new message has > 6 tokens, trigger regeneration.
- Also trigger if none of the current title words appear in the new message and similarity `< 0.35`.

### Local Storage Persistence
The current title is stored alongside messages in `currentChat` and within each saved conversation object in `chatHistory`.

### Fallback Heuristic Details
1. Tokenize & remove stopwords.
2. Rank by frequency (ties alphabetical), take up to 6 tokens.
3. Title Case the phrase.

### Customization
Adjust thresholds or behavior in `src/utils/chatTitle.js`:
- `shouldRegenerateTitle` for drift criteria.
- `heuristicTitle` for fallback construction.
- Stopword list for keyword extraction.

### Privacy
Only current conversation messages are used. No cross‑conversation data is referenced.

### Future Enhancements (Ideas)
- Embedding-based semantic similarity for more robust drift detection.
- User-initiated manual rename UI.
- Caching model titles to reduce token usage across reloads.
